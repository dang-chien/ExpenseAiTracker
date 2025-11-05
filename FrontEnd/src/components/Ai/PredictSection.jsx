import { useEffect, useState } from "react";
import { predictExpenses } from "../../utils/aiService";
import { addThousandsSeparator } from "../../utils/helper";
import { Loader2 } from "lucide-react";

const trendColors = {
  increasing_strong: "text-red-600",
  increasing_mild: "text-orange-500",
  decreasing_mild: "text-green-600",
  decreasing_strong: "text-green-700",
  stable: "text-gray-600",
};

const PredictSection = ({ expenses }) => {
  const [prediction, setPrediction] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePredict = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await predictExpenses(expenses);

      if (Array.isArray(result)) setPrediction(result);
      else setError(result.error || "Unable to generate prediction.");
    } catch (err) {
      setError("An error occurred while predicting.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expenses?.length > 0) handlePredict();
  }, [expenses]);

  return (
    <div className="bg-white shadow-md rounded-xl p-6 mt-6 transition-all">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        🔮 Monthly Spending Prediction
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-6 text-gray-500">
          <Loader2 className="animate-spin mr-2" /> Analyzing your spending patterns...
        </div>
      ) : error ? (
        <p className="text-red-500 text-center">{error}</p>
      ) : (
        <div className="space-y-4">
          {/* Table */}
          <table className="table-auto w-full border-collapse rounded-lg overflow-hidden text-sm md:text-base">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-2 text-left">Category Group</th>
                <th className="p-2 text-right">Predicted Spending</th>
                <th className="p-2 text-right">Confidence (±)</th>
              </tr>
            </thead>
            <tbody>
              {prediction.map((item, i) => (
                <tr key={i} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3 font-medium flex items-center gap-2">
                    <span>{item.emoji}</span> {item.group}
                  </td>
                  <td
                    className={`p-3 text-right font-semibold ${trendColors[item.trend] || "text-gray-700"
                      }`}
                  >
                    ${addThousandsSeparator(item.predicted)}
                  </td>
                  <td className="p-3 text-right text-gray-500">
                    ±{addThousandsSeparator(item.confidence)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* AI Insights */}
          <div className="mt-4 bg-gradient-to-r from-indigo-50 via-white to-purple-50 border rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2">💬 AI Insights</h3>
            <ul className="space-y-2 text-gray-700">
              {prediction.map((item, i) => (
                <li
                  key={i}
                  className={`flex items-start gap-2 ${trendColors[item.trend]}`}
                >
                  <span
                    className="leading-snug"
                    dangerouslySetInnerHTML={{
                      __html: item.message.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>"),
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictSection;
