const express = require("express");
const User = require("../models/User");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const users = await User.find({}).limit(1);  // Возьмем только одного пользователя для отладки
        console.log("Single user:", users[0]);  // Выводим одного пользователя в консоль
        res.render("users", { title: "Users", users });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = { router };