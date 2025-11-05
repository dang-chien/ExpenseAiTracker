const Category = require("../models/Category");

// 🟢 ADD Category
exports.addCategory = async (req, res) => {
  const userId = req.user.id; // Lấy user từ token middleware

  try {
    const { name, type, icon } = req.body;

    // Kiểm tra input
    if (!name || !type) {
      return res.status(400).json({ message: "Name and type are required" });
    }

    // Kiểm tra trùng lặp (1 user không có 2 category cùng tên và type)
    const existing = await Category.findOne({ userId, name, type });
    if (existing) {
      return res
        .status(400)
        .json({ message: "This category already exists for the user" });
    }

    // Tạo mới category
    const newCategory = new Category({
      userId,
      name,
      type,
      icon: icon || "💰",
    });

    await newCategory.save();
    res.status(200).json(newCategory);
  } catch (error) {
        res
      .status(500)
      .json({ message: "Error adding category", error: error.message });
  }
};

// 🟡 GET all Categories (của user hiện tại)
exports.getAllCategories = async (req, res) => {
  const userId = req.user.id;

  try {
    const categories = await Category.find({ $or: [
        { userId },                   // category riêng của user
        { userId: null }          
      ] }).sort({ createdAt: -1 });
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      message: "Error fetching categories",
      error: error.message,
    });
  }
};

// 🟣 GET Category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    res.status(200).json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({
      message: "Error fetching category",
      error: error.message,
    });
  }
};

// 🟠 UPDATE Category
exports.updateCategory = async (req, res) => {
  try {
    const { name, type, icon } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category)
      return res.status(404).json({ message: "Category not found" });

    // Chỉ cho phép user sở hữu sửa
    if (category.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    category.name = name || category.name;
    category.type = type || category.type;
    category.icon = icon || category.icon;

    await category.save();
    res
      .status(200)
      .json({ message: "Category updated successfully", category });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      message: "Error updating category",
      error: error.message,
    });
  }
};

// 🔴 DELETE Category by ID
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    // Chỉ xóa nếu đúng user tạo ra
    if (category.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await category.deleteOne();
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      message: "Error deleting category",
      error: error.message,
    });
  }
};

// ⚫ DELETE all Categories (chỉ user hiện tại)
exports.deleteAllCategories = async (req, res) => {
  const userId = req.user.id;

  try {
    await Category.deleteMany({ userId });
    res.status(200).json({ message: "All categories deleted successfully" });
  } catch (error) {
    console.error("Error deleting all categories:", error);
    res.status(500).json({
      message: "Error deleting all categories",
      error: error.message,
    });
  }
};
