const mongoose = require('mongoose');
const User = require('../models/userModel');
const Service = require('../models/serviceModel');
const Appointment = require('../models/appointmentModel');
const Schedule = require('../models/scheduleModel');
const AppError = require('../utils/appError');
const ErrorCodes = require('../utils/errorCodes');
const weekdays = require('../utils/weekdays');
const catchAsync = require('../utils/catchAsync');
const addMinutes = require('../utils/addMinutes');

const ALLOWED_STATUS_BY_ROLE = {
  patient: ['cancelled'],
  doctor: ['confirmed', 'completed', 'no-show'],
  admin: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show']
};

const ALLOWED_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no-show'],
  completed: [],
  cancelled: [],
  'no-show': [],
};

exports.createAppointment = catchAsync(async (req, res, next) => {
  const today = new Date().toISOString().slice(0, 10);
  const requested = new Date(req.body.date).toISOString().slice(0, 10);

  if (requested < today) {
    return next(new AppError('You can only book today or a future date...', 400, ErrorCodes.INVALID_INPUT));
  }

  const doctor = await User.findById(req.body.doctor);

  if (!doctor || doctor.role !== 'doctor') {
    return next(new AppError(`Doctor doesn't exists...`, 404, ErrorCodes.RESOURCE_NOT_FOUND));
  }

  const service = await Service.findById(req.body.service);

  if (!service) {
    return next(new AppError('Service not found...', 404, ErrorCodes.RESOURCE_NOT_FOUND));
  }

  const weekday = weekdays[new Date(req.body.date).getUTCDay()];

  const schedule = await Schedule.findOne({ doctor: req.body.doctor });

  if(!schedule) {
    return next(new AppError('Schedule not found...', 404, ErrorCodes.RESOURCE_NOT_FOUND));
  }

  const isDayOff = schedule.exceptions.some((ex) => ex.date.getTime() ===  new Date(req.body.date).getTime())

  if (isDayOff) {
    return next(new AppError('Doctor is currently on day off...', 400, ErrorCodes.SLOT_UNAVAILABE));
  }

  const block = schedule.weeklyAvailability.find((b) => b.day === weekday && b.startTime <= req.body.timeSlot && req.body.timeSlot < b.endTime);

  if (!block) {
    return next(new AppError('Schedule is not available...', 400, ErrorCodes.SLOT_UNAVAILABE));
  }

  const endTime = addMinutes(req.body.timeSlot, service.duration);

  if (endTime > block.endTime) {
    return next(new AppError(`This appointment would end at ${endTime}, after the doctor's availability ends at ${block.endTime}...`, 400, ErrorCodes.SLOT_UNAVAILABE));
  }

  const existingAppointments = await Appointment.find({
    doctor: req.body.doctor,
    date: new Date(req.body.date),
    status: mongoose.trusted({ $ne: 'cancelled'})
  });

  const conflict = existingAppointments.find((existing) => {
    const existingEnd = addMinutes(existing.timeSlot, existing.duration);
    return req.body.timeSlot < existingEnd && existing.timeSlot < endTime;
  });

  if (conflict) {
    return next(new AppError('This time slot is already booked. Please choose a different time...', 409, ErrorCodes.SLOT_ALREADY_BOOKED));
  }

  const appointment = await Appointment.create({
    patient: req.user.id,
    doctor: req.body.doctor,
    service: req.body.service,
    date: req.body.date,
    timeSlot: req.body.timeSlot,
    duration: service.duration,
    price: service.price
  });

  res.status(201).json({
    status: 'success',
    data: {
      appointment
    }
  });
});

exports.getMyAppointments = catchAsync(async (req, res, next) => {
  const filter = req.user.role === 'doctor' ? { doctor: req.user.id } : { patient: req.user.id };

  const appointments = await Appointment.find(filter)
    .populate('doctor', 'name specialization')
    .populate('patient', 'name')
    .populate('service', 'name')

  res.status(200).json({
    status: 'success',
    results: appointments.length,
    data: {
      appointments
    }
  });
});

exports.getAllAppointments = catchAsync(async (req, res, next) => {
  const appointments = await Appointment.find()
    .populate('doctor', 'name specialization')
    .populate('patient', 'name')
    .populate('service', 'name')

  res.status(200).json({
    status: 'success',
    results: appointments.length,
    data: {
      appointments
    }
  });
});

exports.getAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return next(new AppError('No appointments were found...', 404, ErrorCodes.RESOURCE_NOT_FOUND));
  }

  const isOwner = req.user.role === 'admin'
    || String(appointment.patient) === req.user.id
    || String(appointment.doctor) === req.user.id

  if (!isOwner) {
    return next(new AppError('No appointments were found...', 404, ErrorCodes.RESOURCE_NOT_FOUND));
  }

  await appointment.populate('doctor', 'name specialization');
  await appointment.populate('patient', 'name');
  await appointment.populate('service', 'name');

  res.status(200).json({
    status: 'success',
    data: {
      appointment
    }
  });
});

exports.updateAppointmentStatus = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return next(new AppError('No appointments were found...', 404, ErrorCodes.RESOURCE_NOT_FOUND));
  }

  const isOwner = req.user.role === 'admin'
    || String(appointment.patient) === req.user.id
    || String(appointment.doctor) === req.user.id

  if (!isOwner) {
    return next(new AppError('No appointments were found...', 404, ErrorCodes.RESOURCE_NOT_FOUND));
  }
  
  const allowed = ALLOWED_STATUS_BY_ROLE[req.user.role];

  if (!allowed.includes(req.body.status)) {
    return next(new AppError('Only authorized personnel can update this status...', 403, ErrorCodes.AUTHORIZATION_FAILURE));
  }

  const isValidTransition = ALLOWED_TRANSITIONS[appointment.status].includes(req.body.status);

  if (req.user.role !== 'admin' && !isValidTransition) {
    return next(new AppError(`Can't change an appointment from ${appointment.status} to ${req.body.status}...`, 409, ErrorCodes.INVALID_STATUS_TRANSITION));
  }

  appointment.status = req.body.status;

  if (req.body.status === 'cancelled') {
    appointment.cancellationReason = req.body.cancellationReason;
  }

  await appointment.save();

  res.status(200).json({
    status: 'success',
    data: {
      appointment
    }
  });
});