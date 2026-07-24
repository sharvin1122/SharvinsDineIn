const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, default: 1 },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
    imageUrl: String,
    addOns: [{
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      price: Number,
      imageUrl: String
    }],
    lineTotal: Number
  }],
  addOns: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    imageUrl: String
  }],
  comment: {
    type: String,
    trim: true,
    maxlength: 500
  },
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Preparing', 'Ready', 'Completed', 'Canceled'],
    default: 'Pending'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
