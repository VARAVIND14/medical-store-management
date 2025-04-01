const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    stock: { 
        type: Number, 
        required: true, 
        min: [0, 'Stock cannot be negative'],
        default: 0 
    },
    addedAt: { type: Date, default: Date.now },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('Medicine', MedicineSchema);
