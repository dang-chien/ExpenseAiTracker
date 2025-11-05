import { useEffect, useState } from "react";
import { predictExpenses } from "../../utils/aiService";
import { addThousandsSeparator } from "../../utils/helper";

const PredictSection = ({ expenses }) => {
  const [prediction, setPrediction] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePredict = async () => {
    try {
      setLoading(true);
      setError(null);

      // Gọi API predict
      const result = await predictExpenses(expenses);

      if (Array.isArray(result)) setPrediction(result);
      else setError(result.error || "Không thể dự đoán chi tiêu");
    } catch (err) {
      setError("Có lỗi xảy ra khi dự đoán.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expenses?.length > 0) {
      handlePredict();
    }
  }, [expenses]);

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mt-6">
      <h2 className="text-lg font-semibold mb-4">🔮 Dự đoán chi tiêu tháng này</h2>

      {loading ? (
        <p>Đang dự đoán chi tiêu...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <table className="table-auto w-full text-center border">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-2">Nhóm</th>
              <th className="p-2">Chi tiêu dự đoán</th>
              <th className="p-2">Độ tin cậy (±)</th>
            </tr>
          </thead>
          <tbody>
            {prediction.map((item, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{item.group}</td>
                <td className="p-2 text-primary font-semibold">
                  {addThousandsSeparator(item.predicted)}
                </td>
                <td className="p-2 text-gray-500">
                  ±{addThousandsSeparator(item.confidence)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PredictSection;
