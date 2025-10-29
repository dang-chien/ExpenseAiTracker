import { useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { LuImage, LuX } from 'react-icons/lu';

const EmojiPickerPopup = (props) => {
    const { icon, onSelect } = props;

    const [isOpen, setIsOpen] = useState(false);

    const isUrl = icon && icon.startsWith("http");

    return (
        <div className="flex flex-col md:flex-row items-center gap-5 mb-6">
            <div
                className="flex items-center gap-4 cursor-pointer"
                onClick={() => setIsOpen(true)}
            >
                <div className="w-10 h-10 flex items-center justify-center text-2xl bg-purple-50 text-primary rounded-lg">
                    {/* {icon ? (
                        <img
                            src={icon}
                            alt="Icon"
                            className="w-14 h-14"
                        />
                    ) : (
                        <LuImage />
                    )} */}
                    {icon ? (
                        isUrl ? (
                            <img
                                src= {icon}
                                alt="Icon"
                                className="w-14 h-14"
                            />
                        ) : (
                            <span className='text-3xl' >{icon}</span>
                        ) 
                    ) : (
                        <LuImage />
                    )}
                </div>

                <p className="">
                    {icon ? "Change Icon" : "Pick Icon"}
                </p>
            </div>

            {isOpen && (
                <div className="relative">
                    <button
                        className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-full absolute -top-2 -right-2 z-10 cursor-pointer"
                        onClick={() => setIsOpen(false)}
                    >
                        <LuX />
                    </button>

                    <EmojiPicker
                        open={isOpen}
                        onEmojiClick={(emojiData) => onSelect(emojiData?.emoji || "")}
                    />
                </div>
            )}
        </div>
    );
}

export default EmojiPickerPopup;