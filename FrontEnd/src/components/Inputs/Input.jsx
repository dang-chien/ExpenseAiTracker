import { useState } from 'react';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';

const Input = (props) => {
  const {
    value,
    onChange,
    label,
    placeholder,
    type = 'text',
    allowInput = true,
  } = props;

  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  // 🧮 Hàm định dạng tiền tệ
  const formatCurrency = (num) => {
    if (num === null || num === undefined || num === '') return '';
    const raw = num.toString().replace(/,/g, '');
    if (isNaN(raw)) return num; // tránh lỗi nếu nhập ký tự
    return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // 📤 Xử lý thay đổi giá trị
  const handleChange = (e) => {
    let val = e.target.value;

    // Nếu là currency → loại dấu phẩy & parse về số
    if (type === 'currency') {
      const raw = val.replace(/,/g, '');
      if (!/^\d*$/.test(raw)) return; // chỉ cho nhập số
      val = Number(raw);
    }

    // Truyền event hoặc số về parent
    if (type === 'currency') onChange(val);
    else onChange(e);
  };

  // 📋 Giá trị hiển thị
  const displayValue =
    type === 'currency' && value !== undefined && value !== null
      ? formatCurrency(value)
      : value;

  // 📋 Loại input thật sự (ẩn mật khẩu hoặc bình thường)
  const inputType =
    type === 'password'
      ? showPassword
        ? 'text'
        : 'password'
      : type === 'currency'
      ? 'text'
      : type;

  return (
    <div>
      {label && (
        <label className="text-[13px] text-slate-800 mb-1 block">{label}</label>
      )}

      <div className="input-box flex items-center gap-2 border rounded px-2 py-1">
        <input
          type={inputType}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none"
          value={displayValue}
          onChange={handleChange}
          disabled={!allowInput}
        />

        {type === 'password' && (
          <>
            {showPassword ? (
              <FaRegEye
                size={22}
                className="text-primary cursor-pointer"
                onClick={togglePasswordVisibility}
              />
            ) : (
              <FaRegEyeSlash
                size={22}
                className="text-slate-400 cursor-pointer"
                onClick={togglePasswordVisibility}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Input;
