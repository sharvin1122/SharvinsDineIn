const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    enum: ["Food", "Beverage"],
    default: "Food",
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  stock: {
    type: Number,
    default: 1,
    min: 0,
  },
  imageString: {
    type: String, // store base64 string or image URL
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Automatically uses MongoDB's built-in _id (no custom "id" field)
module.exports = mongoose.model("Product", productSchema);
