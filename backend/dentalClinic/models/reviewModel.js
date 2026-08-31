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
        if (e === 'doctor') return this.doctor
      },
      message: 'Appointment must be done before adding a review on this Doctor...'
    }
  },
  appointment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Appointment',
  }
});

reviewSchema.index({ doctor: 1, date: 1 }, { unique: true });