const express = require("express");
const {
    addCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    deleteAllCategories,
} = require("../controllers/categoryController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
// CRUD Category routes
router.post("/add", protect, addCategory);
router.get("/get", protect, getAllCategories);
router.get("/:id", protect, getCategoryById);
router.put("/:id", protect, updateCategory);
router.delete("/:id", protect, deleteCategory);
router.delete("/all", protect, deleteAllCategories);

module.exports = router;