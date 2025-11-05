const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false,
            default: null //Nếu là category chung thì userId sẽ là null
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            enum: ['Income', 'Expense'], //Chỉ cho phép hai giá trị này 
            required: true
        },
        icon: {
            type: String, //Lưu emojy hoặc URL của icon
            default: "💸"
        },
    },
    { 
        timestamps: true,
    }
);

module.exports = mongoose.model('Category', CategorySchema);
