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

// Middleware для збереження теми в сесії
router.use((req, res, next) => {
    if (!req.session.theme) {
        req.session.theme = "light"; // Тема за замовчуванням
    }
    res.locals.theme = req.session.theme; // Передача теми в шаблони
    next();
});

// Сторінка авторизації
router.get("/", (req, res) => {
    res.render("auth", {
        title: "Authorization",
        theme: req.session.theme, // Беремо тему з сесії
        error: req.flash("error"),
        user: req.user || null,
    });
});

// Зміна теми
router.post("/set-theme", (req, res) => {
    const { theme } = req.body;
    if (theme === "light" || theme === "dark") {
        req.session.theme = theme; // Збереження теми в сесії
        console.log("✅ Тема змінена на:", theme);
    } else {
        console.log("❌ Неправильне значення теми:", theme);
    }
    res.redirect("/auth"); // Перенаправлення на сторінку авторизації
});

// Реєстрація користувача
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, passwordConfirm, age } = req.body;

        if (!name || !email || !password || !passwordConfirm || !age) {
            req.flash("error", "All fields are required");
            return res.redirect("/auth");
        }

        if (isNaN(age) || age < 18 || age > 100) {
            req.flash("error", "Age must be a valid number between 18 and 100");
            return res.redirect("/auth");
        }

        if (password !== passwordConfirm) {
            req.flash("error", "Passwords do not match");
            return res.redirect("/auth");
        }

        if (await User.findOne({ email })) {
            req.flash("error", "User already exists");
            return res.redirect("/auth");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword, age });
        await newUser.save();

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
            req.flash("error", "Authentication error");
            return res.redirect("/auth");
        }
        if (!user) {
            req.flash("error", info.message || "Invalid credentials");
            return res.redirect("/auth");
        }

        req.logIn(user, (err) => {
            if (err) {
                req.flash("error", "Login error");
                return res.redirect("/auth");
            }
            return res.redirect("/protected");
        });
    })(req, res, next);
});

// Вихід користувача
router.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy(() => res.redirect("/"));
    });
});

// Захищений маршрут
router.get("/protected", isAuthenticated, (req, res) => {
    res.send(`<h1>Welcome, ${req.user.name}</h1><br><a href="/logout">Logout</a>`);
});

// Middleware для перевірки авторизації
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    req.flash("error", "You need to log in first");
    res.redirect("/auth");
}

module.exports = { router };