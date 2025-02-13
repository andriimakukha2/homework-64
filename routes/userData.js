const express = require("express");
const { ObjectId } = require("mongodb");
const User = require("../models/User");

const router = express.Router();

// 📌 Створення одного користувача (insertOne)
router.post("/insertOne", async (req, res) => {
    try {
        const newUser = new User(req.body);
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (error) {
        console.error("❌ Error inserting user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// 📌 Створення кількох користувачів (insertMany)
router.post("/insertMany", async (req, res) => {
    try {
        const result = await User.insertMany(req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error("❌ Error inserting multiple users:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// 📌 Оновлення одного користувача (updateOne)
// Обновление одного пользователя
router.put("/updateOne/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        delete updateData._id;

        const result = await User.updateOne({ _id: new ObjectId(id) }, { $set: updateData });

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            message: "User updated successfully",
            updatedCount: result.modifiedCount,
            updatedFields: updateData,
        });
    } catch (error) {
        console.error("❌ Error updating user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Обновление нескольких пользователей
router.put("/updateMany", async (req, res) => {
    try {
        const { filter, updateData } = req.body;

        if (!filter || !updateData) {
            return res.status(400).json({ message: "Filter and updateData are required" });
        }

        const result = await User.updateMany(filter, { $set: updateData });

        res.json({
            message: "Users updated successfully",
            updatedCount: result.modifiedCount,
            matchedCount: result.matchedCount,
        });
    } catch (error) {
        console.error("❌ Error updating multiple users:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// 📌 Заміна одного користувача (replaceOne)
router.put("/replaceOne/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const newData = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        delete newData._id; // Запобігаємо конфліктам з _id

        const result = await User.replaceOne({ _id: new ObjectId(id) }, newData);

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(result);
    } catch (error) {
        console.error("❌ Error replacing user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// 📌 Видалення одного користувача (deleteOne)
router.delete("/deleteOne/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const result = await User.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(result);
    } catch (error) {
        console.error("❌ Error deleting user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// 📌 Видалення кількох користувачів (deleteMany)
router.delete("/deleteMany", async (req, res) => {
    try {
        const { filter } = req.body;

        if (!filter) {
            return res.status(400).json({ message: "Filter is required" });
        }

        const result = await User.deleteMany(filter);

        res.json(result);
    } catch (error) {
        console.error("❌ Error deleting multiple users:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// 📌 Пошук користувачів з проекцією (find)
router.get("/find", async (req, res) => {
    try {
        const filter = req.query || {};
        const projection = { name: 1, email: 1, age: 1, _id: 1 }; // Вибіркові поля

        const users = await User.find(filter, projection);

        res.json(users);
    } catch (error) {
        console.error("❌ Error finding users:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// 📌 Використання курсорів (Cursor Pagination)
router.get("/findWithCursor", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const cursor = User.find().skip((page - 1) * limit).limit(limit).cursor();
        const users = [];

        for await (const user of cursor) {
            users.push(user);
        }

        res.json(users);
    } catch (error) {
        console.error("❌ Error using cursor:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// 📌 Агрегаційний запит для статистики (наприклад, середнє значення віку користувачів)
router.get("/aggregate", async (req, res) => {
    try {
        const aggregationResult = await User.aggregate([
            { $group: { _id: null, averageAge: { $avg: "$age" }, userCount: { $sum: 1 } } }
        ]);

        res.json(aggregationResult);
    } catch (error) {
        console.error("❌ Error performing aggregation:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = { router };