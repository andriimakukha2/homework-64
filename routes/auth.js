const express = require("express");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const LocalStrategy = require("passport-local").Strategy;
const flash = require("connect-flash");
const User = require("../models/User");

const router = express.Router();

// Налаштування стратегії Passport
passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
        try {
            const user = await User.findOne({ email });
            if (!user) return done(null, false, { message: "User not found" });

            const isMatch = await bcrypt.compare(password, user.password);
            return isMatch ? done(null, user) : done(null, false, { message: "Incorrect password" });
        } catch (err) {
            return done(err);
        }
    })
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Middleware для перевірки авторизації
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    req.flash("error", "You need to log in first");
    res.redirect("/auth");
}

// Сторінка авторизації
router.get("/", (req, res) => {
    res.render("auth", {
        title: "Authorization",
        theme: req.session.theme || "light",
        error: req.flash("error"),
        user: req.user || null,
    });
});

// Реєстрація користувача та збереження в MongoDB
router.post("/register", async (req, res) => {
    try {
        console.log("📩 Отримано запит на реєстрацію:", req.body);

        const { name, email, password, passwordConfirm, age } = req.body;

        // Перевірка обов'язкових полів
        if (!name || !email || !password || !passwordConfirm || !age) {
            req.flash("error", "All fields are required");
            return res.redirect("/auth");
        }

        // Перевірка віку
        if (isNaN(age) || age < 18 || age > 100) {
            req.flash("error", "Age must be a valid number between 18 and 100");
            return res.redirect("/auth");
        }

        // Перевірка пароля
        if (password !== passwordConfirm) {
            req.flash("error", "Passwords do not match");
            return res.redirect("/auth");
        }

        if (await User.findOne({ email })) {
            req.flash("error", "User already exists");
            return res.redirect("/auth");
        }

        // Хешування пароля
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("🔑 Зашифрований пароль:", hashedPassword);

        // Створення користувача
        const newUser = new User({ name, email, password: hashedPassword, age });
        await newUser.save();

        console.log("✅ Користувач збережений:", newUser);

        req.login(newUser, (err) => {
            if (err) return next(err);
            return res.redirect("/protected");
        });
    } catch (err) {
        console.error("❌ Помилка під час реєстрації:", err);
        req.flash("error", "Registration error");
        res.redirect("/auth");
    }
});

// Вхід користувача
router.post("/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) {
            console.error("❌ Помилка аутентифікації:", err);
            req.flash("error", "Authentication error");
            return res.redirect("/auth");
        }
        if (!user) {
            req.flash("error", info.message || "Invalid credentials");
            return res.redirect("/auth");
        }

        req.logIn(user, (err) => {
            if (err) {
                console.error("❌ Помилка під час входу:", err);
                req.flash("error", "Login error");
                return res.redirect("/auth");
            }

            console.log("✅ Користувач увійшов:", user);
            return res.redirect("/protected");
        });
    })(req, res, next);
});

// Вихід користувача
router.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error("❌ Помилка при виході:", err);
            return next(err);
        }
        req.session.destroy(() => res.redirect("/"));
    });
});

// Захищений маршрут
router.get("/protected", isAuthenticated, (req, res) => {
    console.log("Authenticated User:", req.user); // Debugging line
    res.send(`<h1>Welcome, ${req.user.name}</h1><br><a href="/logout">Logout</a>`);
});

// Отримання списку користувачів (тільки для авторизованих)
router.get("/users", isAuthenticated, async (req, res) => {
    try {
        const users = await User.find({}, "name email age");
        res.render("users", { title: "Users List", users });
    } catch (error) {
        console.error("❌ Error fetching users:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = { router };