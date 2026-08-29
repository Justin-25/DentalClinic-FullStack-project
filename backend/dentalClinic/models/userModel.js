const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
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
  passwordChangedAt: Date,
  passwordResetToken: String, 
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false // Based on my understanding on natours course, this will only display on DB compass not on responses.
  },
  specialization: {
    type: String,
  },
  yearsOfExperience: Number,
  bio: {
    type: String,
    maxlength: [500, 'A bio must have less or equal than 500 characters...']
  }
})