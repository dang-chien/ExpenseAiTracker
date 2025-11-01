import { useState, useEffect } from "react";
import axios from "axios";
import Input from "../Inputs/Input";
import EmojiPickerPopup from "../EmojiPickerPopup";
import { BASE_URL, API_PATHS } from "../../utils/apiPaths";
import { toast } from "react-hot-toast";

const AddIncomeForm = ({ onAddIncome }) => {
  const [income, setIncome] = useState({
    categoryId: "",
    source: "",
    amount: "",
    date: ""
  });

  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: "", icon: "💰" });
  const [loading, setLoading] = useState(false);

  // 🟢 Fetch all income categories from DB
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `${BASE_URL}${API_PATHS.CATEGORY.GET_ALL_CATEGORY}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const incomeCats = data.filter((c) => c.type === "Income");
      setCategories(incomeCats);
    } catch (error) {
      toast.error("Failed to load categories");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);
  

  const handleChange = (key, value) =>
    setIncome((prev) => ({ ...prev, [key]: value }));

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
          type: "Income",
          icon: newCategory.icon || "💰",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("New category added");
      setNewCategory({ name: "", icon: "💰" });
      fetchCategories();
    } catch (error) {
      toast.error("Error adding category");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 📤 Submit Add Income
  const handleSubmit = () => {
    if (!income.categoryId || !income.source || !income.amount || !income.date) {
      toast.error("Please fill in all fields");
      return;
    }
    onAddIncome(income);
    setIncome({ categoryId: "", source: "", amount: "", date: ""});
  };

  return (
    <div className="space-y-4">
      {/* 🔸 Category Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          value={income.categoryId}
          onChange={(e) => handleChange("categoryId", e.target.value)}
          className="w-full border rounded p-2 focus:outline-none focus:ring focus:border-blue-300"
        >
          <option value="">-- Select Income Category --</option>
          {categories.map((cat) => (
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
          <Input className="rounded flex-none p-2 flex-1"
            value={newCategory.name}
            onChange = {(e) =>setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
             placeholder="Freelance, Salary, etc."
        type="text"
      />
          <button
            type="button"
            onClick={handleAddCategory}
            disabled={loading}
            className={`${
              loading ? "bg-gray" : "bg-[#875cf5]"
            } text-white px-3 py-2 flex-auto cursor-pointer`}
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>   
      </div>

      {/* 🔹 Source input */}
      <Input
        value={income.source}
        onChange={(e) => handleChange("source", e.target.value)}
        label="Income Source"
        placeholder="Freelance, Salary, etc."
        type="text"
      />

      {/* 🔹 Amount */}
      <Input
        label="Amount"
        type="currency"           
        value={income.amount}
        onChange={(val) => handleChange("amount", val)}
        placeholder="Enter amount"
      />


      {/* 🔹 Date */}
      <Input
        value={income.date}
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
          Add Income
        </button>
      </div>
    </div>
  );
};

export default AddIncomeForm;
