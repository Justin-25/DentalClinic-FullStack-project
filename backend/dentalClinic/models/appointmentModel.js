const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'An appointment must belong to a patient...']
    },
    doctor: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'An appointment must belong to a doctor...']
    },
    service: {
      type: mongoose.Schema.ObjectId,
      ref: 'Service',
      required: [true, 'An appointment must belong to a service...']
    },
    date: {
      type: Date,
      required: [true, 'An appointment must have a date...']
    },
    timeSlot: {
      type: String,
      required: [true, 'An appointment must have a time slot...']
    },
    createdAt: {
      type: Date,
      default: Date.now,
      select: false
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
      default: 'pending'
    },
    notes: String
  }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment