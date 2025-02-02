const express = require("express");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const LocalStrategy = require("passport-local").Strategy;
const flash = require("connect-flash");

const router = express.Router();

const users = new Map(); // Використовуємо Map для зберігання користувачів у пам'яті

// Налаштування стратегії Passport
passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
        const user = users.get(email);
        if (!user) return done(null, false, { message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        return isMatch ? done(null, user) : done(null, false, { message: "Incorrect password" });
    })
);

passport.serializeUser((user, done) => done(null, user.email));
passport.deserializeUser((email, done) => {
    const user = users.get(email);
    done(null, user);
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
    });
});

// Реєстрація користувача
router.post("/register", async (req, res, next) => {
    const { email, password, passwordConfirm } = req.body;

    if (!email || !password || !passwordConfirm) {
        req.flash("error", "All fields are required");
        return res.redirect("/auth");
    }

    if (password !== passwordConfirm) {
        req.flash("error", "Passwords do not match");
        return res.redirect("/auth");
    }

    if (password.length < 6) {
        req.flash("error", "Password must be at least 6 characters long");
        return res.redirect("/auth");
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
        req.flash("error", "Invalid email format");
        return res.redirect("/auth");
    }

    if (users.has(email)) {
        req.flash("error", "User already exists");
        return res.redirect("/auth");
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { email, password: hashedPassword };
        users.set(email, newUser);

        req.login(newUser, (err) => {
            if (err) return next(err);
            return res.redirect("/protected");
        });
    } catch (err) {
        console.error(err);
        req.flash("error", "Registration error");
        return res.redirect("/auth");
    }
});

// Вхід користувача
router.post(
    "/login",
    passport.authenticate("local", {
        successRedirect: "/protected",
        failureRedirect: "/auth",
        failureFlash: true,
    })
);

// Вихід користувача
router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy(() => {
            res.redirect("/");
        });
    });
});

// Захищений маршрут
router.get("/protected", isAuthenticated, (req, res) => {
    res.send(`<h1>Welcome, ${req.user.email}</h1><br><a href="/logout">Logout</a>`);
});

module.exports = { router };