const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountPercentage: { type: Number, required: true },
  expiresAt: { type: Date },
  isActive: { type: Boolean, default: true },
  maxUses: { type: Number, required: true },
  currentUses: { type: Number, default: 0 }
});


const PromoCode = mongoose.model('PromoCode', promoCodeSchema);
module.exports = PromoCode;
