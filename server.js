const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");

// Налаштування змінних середовища
dotenv.config();

// Імпортуємо підключення до бази
const connectDB = require("./config/db");

// Ініціалізація Express
const app = express();

// Імпортуємо маршрути
const { router: authRouter } = require("./routes/auth");
const { router: settingsRouter } = require("./routes/settings");

// Налаштування шаблонізатора EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(helmet());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Ліміт запитів для захисту від DDoS
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 хвилин
    max: 100, // Максимум 100 запитів
    message: "Too many requests from this IP, please try again later."
});
app.use("/api", limiter);

// Налаштування сесій
app.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Встановіть `true`, якщо використовуєте HTTPS
}));

// Ініціалізація Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Додаємо flash-повідомлення
app.use(flash());

// Middleware для глобального доступу до flash-повідомлень
app.use((req, res, next) => {
    res.locals.error = req.flash("error");
    next();
});

// Збереження теми в сесії
app.post("/settings/set-theme", (req, res) => {
    req.session.theme = req.body.theme || "light";
    res.redirect("/settings");
});

// Маршрут для головної сторінки
app.get("/", (req, res) => {
    res.render("index", {
        title: "Home",
        theme: req.session.theme || "light",
        body: "<h1>Welcome to Home Page</h1>"
    });
});

// Маршрут для сторінки налаштувань
app.get("/settings", (req, res) => {
    res.render("settings", {
        title: "Settings",
        theme: req.session.theme || "light",
        body: "<h1>Settings Page</h1>"
    });
});

// Підключаємо маршрути
app.use("/settings", settingsRouter);
app.use("/auth", authRouter);

// Обробка помилки 404
app.use((req, res, next) => {
    res.status(404).render("error", { message: "Page not found", status: 404 });
});

// Обробка помилки сервера
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render("error", { message: "Server error", status: 500 });
});

// Підключення до MongoDB
connectDB();

// Запуск сервера
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));