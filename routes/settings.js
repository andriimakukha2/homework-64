const express = require('express');
const router = express.Router();

// Сторінка налаштувань
router.get('/', (req, res) => {
    // Отримуємо тему з кукі або використовуємо 'light' за замовчуванням
    const theme = req.cookies.theme || 'light';
    res.render('settings', { title: 'Settings', theme });
});

// Збереження вибраної теми
router.post('/set-theme', (req, res) => {
    const { theme } = req.body;

    // Валідація: тільки "light" або "dark" дозволено
    if (!theme || !['light', 'dark'].includes(theme)) {
        return res.status(400).json({ message: 'Invalid theme. Please choose either "light" or "dark".' });
    }

    try {
        // Зберігаємо вибрану тему в cookie
        res.cookie('theme', theme, {
            maxAge: 7 * 24 * 60 * 60 * 1000, // Тема буде зберігатися протягом 7 днів
            httpOnly: true, // cookie не доступне через JavaScript
            secure: process.env.NODE_ENV === 'production', // Якщо продакшн, використовувати secure
            sameSite: 'Strict' // Забезпечує захист від CSRF-атак
        });

        // Перевірка на AJAX-запит
        if (req.xhr) {
            return res.status(200).json({ message: 'Theme updated successfully.' });
        }

        // Після зміни теми перенаправляємо на сторінку налаштувань
        res.redirect('/settings');
    } catch (error) {
        console.error('Error saving theme: ', error);
        res.status(500).json({ message: 'Error saving theme. Please try again later.' });
    }
});

module.exports = { router };