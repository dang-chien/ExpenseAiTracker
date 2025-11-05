import { useState, useEffect } from "react";
import CustomPieChart from "../Charts/CustomPieChart";
import { formatCurrency } from "../../utils/helper";

const COLORS = ['#875CF5', '#FA2C37', '#4F39F6'];

const RecentIncomeWithChart = (props) => {
    const { data, totalIncome } = props;

    const [chartData, setChartData] = useState([]);

    console.log("RecentIncomeWithChart data:", data);
    

    useEffect(() => {
        const dataArr = data?.map((item) => ({
            name: item?.source,
            amount: item?.amount,
        }));
        setChartData(dataArr);
    }, [data]);

    return (
        <div className="card">
            <div className="flex items-center justify-between">
                <h5 className="text-lg">Last 60 Days Income</h5>
            </div>

            <CustomPieChart
                data={chartData}
                label="Total Income"
                totalAmount={`$${formatCurrency(totalIncome)}`}
                showTextAnchor
                colors={COLORS}
            />
        </div>
    );
};
export default RecentIncomeWithChart;