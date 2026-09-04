const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A user must have a name...']
    },
    email: {
      type: String,
      required: [true, 'A user must have an email...'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email...']
    },
    photo: {
      type: String,
      default: 'default.jpg'
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      default: 'patient'
    },
    password: {
      type: String,
      required: [true, 'A user must have a password...'],
      minlength: 8,
      select: false // Based on my understanding this will not be displayed on responses
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password...'],
      validate: {
        // This only works on Cretae and Save middleware
        validator: function(el) {
          return el === this.password
        },
        message: 'Password do not match! Please try again...'
      }
    },
    specialization: {
      type: String,
    },
    yearsOfExperience: Number,
    bio: {
      type: String,
      maxlength: [500, 'A bio must have less or equal than 500 characters...']
    },
    passwordChangedAt: Date,
    passwordResetToken: String, 
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false // Based on my understanding on natours course, this will only display on DB compass not on responses.
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true}
  }
);

// all appointments this user booked as a patient
userSchema.virtual('appointmentsAsPatient', {
  ref: 'Appointment',
  foreignField: 'patient',
  localField: '_id'
});

// all appointments this user has as a doctor
userSchema.virtual('appointmentsAsDoctor', {
  ref: 'Appointment',
  foreignField: 'doctor',
  localField: '_id'
});

// all reviews about this doctor
userSchema.virtual('reviewsReceived', {
  ref: 'Review',
  foreignField: 'doctor',
  localField: '_id'
});

// this doctor's single Schedule document
userSchema.virtual('schedule', {
  ref: 'Schedule',
  foreignField: 'doctor',
  localField: '_id',
  justOne: true // returns a single object instead of an array
})

// Mongoose Middleware
userSchema.pre('save', async function() {
  // Only run this condition if password is not modified.
  // Guard clause
  if (!this.isModified('password')) {
    return;
  }

  // Hash the password with a cost of 12 cost factor (rounds).
  this.password = await bcrypt.hash(this.password, 12);

  // Delete this passwordConfirm field so it doesn't store in database
  // this field did its one job during validation, and now it should disappear before we save, because there's nothing left for it to do.
  this.passwordConfirm = undefined
});

// Instance Methods
userSchema.methods.correctPassword = async function(inputPassword, userPassword) {
  return await bcrypt.compare(inputPassword, userPassword);
}

userSchema.methods.changedPasswordAfter = function(JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

    return JWTTimeStamp < changedTimeStamp
  }

  // return false if password not changed
  return false;
}

const User = mongoose.model('User', userSchema);

module.exports = User;