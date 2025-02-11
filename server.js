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
const connectDB = require("./config/db");

// Налаштування змінних середовища
dotenv.config();

// Ініціалізація Express
const app = express();

// Підключення до MongoDB перед стартом сервера
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(helmet());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Ліміт запитів
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later."
});
app.use("/api", limiter);

// Налаштування сесій
app.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, sameSite: "Strict" }
}));

// Ініціалізація Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Flash-повідомлення
app.use(flash());

// Middleware для доступу до flash-повідомлень
app.use((req, res, next) => {
    res.locals.error = req.flash("error");
    next();
});

// Налаштування шаблонізатора EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Імпортуємо маршрути
const { router: authRouter } = require("./routes/auth");
const { router: settingsRouter } = require("./routes/settings");
const { router: usersRouter } = require("./routes/users");
const { router: userDataRouter } = require("./routes/userData");

app.use("/settings", settingsRouter);
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/userData", userDataRouter);

// Основні маршрути
app.get("/", (req, res) => {
    res.render("index", {
        title: "Home",
        theme: req.session.theme || "light",
        body: "<h1>Welcome to Home Page</h1>"
    });
});

app.get("/settings", (req, res) => {
    res.render("settings", {
        title: "Settings",
        theme: req.cookies.theme || "light",
        body: "<h1>Settings Page</h1>"
    });
});

app.get("/protected", (req, res) => {
    res.status(200).send("Protected route content");
});

// Обробка 404
app.use((req, res, next) => {
    res.status(404).render("error", { message: "Page not found", status: 404 });
});

// Обробка серверних помилок
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render("error", { message: "Server error", status: 500 });
});

// Запуск сервера
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));