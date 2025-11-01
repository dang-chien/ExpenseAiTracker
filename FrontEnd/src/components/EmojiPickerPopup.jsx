import { useState, useEffect, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import { LuImage } from "react-icons/lu";

const EmojiPickerPopup = ({ icon, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);
  const isUrl = icon && icon.startsWith("http");

  // 🔒 Đóng picker khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block">
      {/* 👉 Icon hiển thị, click để bật popup */}
      <button
        type="button"
        title="Choose Icon"
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center text-2xl border rounded-full hover:bg-gray-100 transition-transform hover:scale-110"
      >
        {icon ? (
          isUrl ? (
            <img src={icon} alt="icon" className="w-8 h-8 rounded-md" />
          ) : (
            <span className="text-3xl">{icon}</span>
          )
        ) : (
          <LuImage className="text-gray-500" />
        )}
      </button>

      {/* 🟡 Emoji Picker xuất hiện ngay tại icon */}
      {isOpen && (
        <div
          ref={pickerRef}
          className="absolute z-[9999] top-12 left-0 shadow-lg rounded-md"
        >
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              onSelect(emojiData?.emoji || "");
              setIsOpen(false); // 🔒 tự đóng khi chọn xong
            }}
            theme="light"
          />
        </div>
      )}
    </div>
  );
};

export default EmojiPickerPopup;
