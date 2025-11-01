import { useState } from "react";
import axios from "axios";
import Input from "../Inputs/Input";
import EmojiPickerPopup from "../EmojiPickerPopup";
import { BASE_URL, API_PATHS } from "../../utils/apiPaths";
import { toast } from "react-hot-toast";

const AddExpenseForm = ({ onAddExpense, categories = [], onCategoryAdded }) => {
  const [expense, setExpense] = useState({
    categoryId: "",
    amount: "",
    date: "",
  });

  const [newCategory, setNewCategory] = useState({ name: "", icon: "💸" });
  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) =>
    setExpense((prev) => ({ ...prev, [key]: value }));

  // ➕ Add new category inline
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error("Please enter category name");
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.post(
        `${BASE_URL}${API_PATHS.CATEGORY.ADD_CATEGORY}`,
        {
          name: newCategory.name.trim(),
          type: "Expense",
          icon: newCategory.icon || "💸",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("New category added");
      setNewCategory({ name: "", icon: "💸" });
      if (onCategoryAdded) onCategoryAdded(); // 🟢 gọi callback từ cha để reload categories
    } catch (error) {
      toast.error("Error adding category");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 📤 Submit Add Expense
  const handleSubmit = () => {
    if (!expense.categoryId || !expense.amount || !expense.date) {
      toast.error("Please fill in all fields");
      return;
    }
    onAddExpense(expense);
    setExpense({ categoryId: "", amount: "", date: "" });
  };

  return (
    <div className="space-y-4">
      {/* 🔸 Category Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          value={expense.categoryId}
          onChange={(e) => handleChange("categoryId", e.target.value)}
          className="w-full border rounded p-2 focus:outline-none focus:ring focus:border-blue-300"
        >
          <option value="">-- Select Expense Category --</option>
          {categories
            .filter((cat) => cat.type === "Expense")
            .map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.icon} {cat.name}
              </option>
            ))}
        </select>
      </div>

      {/* 🟢 Add New Category Inline */}
      <div className="border rounded p-3 bg-gray-50 mt-2">
        <p className="text-sm font-semibold mb-2 text-gray-700">
          Add New Category
        </p>
        <div className="flex gap-2 items-center">
          <EmojiPickerPopup
            className="flex-none"
            icon={newCategory.icon}
            onSelect={(selectedIcon) =>
              setNewCategory((prev) => ({ ...prev, icon: selectedIcon }))
            }
          />
          <Input
            className=" flex-auto rounded p-2"
            value={newCategory.name}
            onChange={(e) =>
              setNewCategory((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Food, Transport, etc."
            type="text"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            disabled={loading}
            className={`${
              loading ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"
            } flex-auto text-white px-3 py-2 rounded transition`}
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>

      </div>

      {/* 🔹 Amount */}
      <Input
        label="Amount"
        type="currency"
        value={expense.amount}
        onChange={(val) => handleChange("amount", val)}
        placeholder="Enter amount"
      />

      {/* 🔹 Date */}
      <Input
        value={expense.date}
        onChange={(e) => handleChange("date", e.target.value)}
        label="Date"
        type="date"
      />

      {/* 🔘 Submit Button */}
      <div className="flex justify-end mt-6">
        <button
          type="button"
          className="add-btn primary-btn-fill"
          onClick={handleSubmit}
        >
          Add Expense
        </button>
      </div>
    </div>
  );
};

export default AddExpenseForm;
