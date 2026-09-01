const mongoose = require('mongoose');
const validator = require('validator');

const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    required: [true, 'Review cannot be empty...'],
  },
  type: {
    type: String,
    enum: ['clinic', 'doctor'],
    required: [true, 'A review must have a type...'],
  },
  rating: {
    type: Number,
    required: [true, 'Rating cannot be empty...'],
    min: 1,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  patient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A review must be a patient...']
  },
  doctor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    validate: {
      validator: function(e) {
        if (this.type === 'doctor') {
          return e;
        }
        return true; // clinic reviews don't need this to check if fail
      },
      message: "A doctor review must specify which doctor it's for..."
    }
  },
  appointment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Appointment',
  }
});

reviewSchema.index({ doctor: 1, patient: 1 }, { unique: true });