const mongoose = require('mongoose');
const slugify = require('slugify');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, 'A service must have a name...']
    },
    slug: String,
    imageCover: {
      type: String,
      default: 'default.jpg'
    },
    price: {
      type: Number,
      required: [true, 'A service must have a price...']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price...'
      }
    },
    duration: {
      type: Number,
      required: [true, 'A service must have a duration...']
    },
    category: {
      type: String,
      enum: ['Preventive & Diagnostic', 'Restorative', 'Surgical & Specialized', 'Cosmetic', 'Emergency & Urgent Care', 'Consultation'],
      required: [true, 'A service must belong to a category']
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A service must have summary...']
    },
    secretService: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now,
      select: false
    }
  },
  {
    toJSON: { virtuals: true},
    toObject: { virtuals: true}
  }
);

// Reversed Ref and virtual populate
serviceSchema.virtual('appointments', {
  ref: 'Appointment',
  foreignField: 'service',
  localField: '_id'
})

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;