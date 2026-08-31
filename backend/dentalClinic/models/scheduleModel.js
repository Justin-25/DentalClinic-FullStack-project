const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A schedule must belong to a doctor...'],
    unique: true
  },
  weeklyAvailability: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    }
  }],
  exceptions: [
    {
      date: {
        type: Date,
        required: true
      },
      reason: String,
      isAvailable: {
        type: Boolean,
        default: false // usually false (day off), but could be true for a special extra day added
      }
    }
  ]
});

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;