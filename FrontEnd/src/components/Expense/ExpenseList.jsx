import moment from "moment";
import TransactionInfoCard from "../Cards/TransactionInfoCard";
import { LuDownload } from "react-icons/lu";

const ExpenseList = (props) => {
    const { transactions, expenseCategories, onDelete, onDownload } = props;
    const getCategoryIcon = (categoryId) => {
        const category = expenseCategories.find((cat) => cat._id === categoryId);
        console.log("Category for ID", categoryId, ":", category);
        return category?.icon || "💰"
    };

    const getCategoryName = (categoryId) => {
        const category = expenseCategories.find((cat) => cat._id === categoryId);
        console.log("Category for ID", categoryId, ":", category);
        return category?.name || "Unknown";
    };

    return (
        <div className="card">
            <div className="flex items-center justify-between">
                <h5 className="text-lg">Expense Sources</h5>

                <button className="card-btn" onClick={onDownload}>
                    <LuDownload className="text-base" /> Download
                </button>
            </div>

            <div className="grid grid-cols-1 mg:grid-cols-2">
                {transactions?.map((expense) => (
                    <TransactionInfoCard
                        key={expense._id}
                        title={getCategoryName(expense.categoryId)}
                        icon={getCategoryIcon(expense.categoryId)}
                        date={moment(expense.date).format("Do MMM YYYY")}
                        amount={expense.amount}
                        type="expense"
                        onDelete={() => onDelete(expense._id)}
                    />
                ))}
            </div>
        </div>
    )
};

export default ExpenseList;