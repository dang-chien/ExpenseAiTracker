import { LuArrowRight } from "react-icons/lu";
import moment from "moment";
import TransactionInfoCard from "../Cards/TransactionInfoCard";
import EmptyTransactionInfoCard from "../Cards/EmptyTransactionInfoCard";
import { formatCurrency } from "../../utils/helper";

const RecentTransactions = (props) => {
    const { transactions, onSeeMore } = props;

    return (
        <div className="card">
            <div className="flex items-center justify-between">
                <h5 className="text-lg">Recent Transactions</h5>
                <button className="card-btn" onClick={onSeeMore}>
                    See All <LuArrowRight className="text-base" />
                </button>
            </div>

            {!transactions.length ? (
                <EmptyTransactionInfoCard
                    title="No Transactions"
                    description="You haven't made any transactions yet."
                />
            ) : (
                <div className="mt-6 h-full">
                    {transactions.slice(0, 5).map((item) => (
                        <TransactionInfoCard
                            key={item._id}
                            title={item.type === 'expense' ? item.categoryId?.name || 'Unknown' : item.source}
                            icon={item.categoryId?.icon || '💰'}
                            date={moment(item.date).format('Do MM YYYY')}
                            amount={formatCurrency(item.amount)}
                            type={item.type}
                            hideDeleteBtn
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default RecentTransactions;