// utils/initDefaultCategories.js
const Category = require("../models/Category");

const defaultCategories = require("../data/categoriesGlobal.json");

async function initDefaultCategories() {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      await Category.insertMany(defaultCategories);
      console.log("✅ Default categories created successfully.");
    } else {
      console.log(`ℹ️ ${count} categories already exist, skipping initialization.`);
    }
  } catch (err) {
    console.error("❌ Error initializing categories:", err.message);
  }
}

module.exports = initDefaultCategories;
