const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
  {
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
        required: true,
        match: [/^([01]\d|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:mm format...']
      },
      endTime: {
        type: String,
        required: true,
        match: [/^([01]\d|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:mm format...']
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
  }
);

scheduleSchema.pre('validate', function() {
  const scheds = this.weeklyAvailability;

  for (const sched of scheds) {
    if (sched.startTime >= sched.endTime) {
      return this.invalidate('weeklyAvailability', `${sched.day}: endTime (${sched.endTime}) must be after startTime (${sched.startTime})`);
    }
  }

  for (let i = 0; i < scheds.length; i++) {
    for (let j = i + 1; j < scheds.length; j++) {
      const a = scheds[i];
      const b = scheds[j];

      if (a.day !== b.day) continue;

      if (a.startTime < b.endTime && b.startTime < a.endTime) {
        return this.invalidate('weeklyAvailability', `${a.day}: ${a.startTime}-${a.endTime} overlaps ${b.startTime}-${b.endTime}`);
      }
    }
  }
})

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;