const express = require("express");
const router = express.Router();

// Сторінка налаштувань
router.get("/", (req, res) => {
    res.render("settings", { title: "Settings", theme: req.session.theme });
});

// Збереження вибраної теми
router.post("/set-theme", (req, res) => {
    const { theme } = req.body;

    if (!theme || !["light", "dark"].includes(theme)) {
        return res.status(400).json({ message: 'Invalid theme. Please choose either "light" or "dark".' });
    }

    try {
        req.session.theme = theme; // Зберігаємо тему в сесії
        req.session.save(() => {
            if (req.xhr) {
                return res.status(200).json({ message: "Theme updated successfully." });
            }
            res.redirect("/settings");
        });
    } catch (error) {
        console.error("Error saving theme: ", error);
        res.status(500).json({ message: "Error saving theme. Please try again later." });
    }
});

module.exports = { router };