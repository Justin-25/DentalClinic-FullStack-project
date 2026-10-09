const mongoose = require('mongoose');
const Appointment = require('../models/appointmentModel');
const Service = require('../models/serviceModel');
const User = require('../models/userModel');
const Schedule = require('../models/scheduleModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const ErrorCodes = require('../utils/errorCodes');
const computeSlots = require('../utils/computeSlots');
const weekdays = require('../utils/weekdays');
const addMinutes = require('../utils/addMinutes');

exports.getDoctorSchedule = catchAsync(async (req, res, next) => {
  const doctor = await User.findById(req.params.doctorId);

  if (!doctor || doctor.role !== 'doctor') {
    return next(new AppError(`Doctor doesn't exists...`, 404, ErrorCodes.RESOURCE_NOT_FOUND));
  }
  
  const schedule = await Schedule.findOne({
    doctor: req.params.doctorId
  });

  if (!schedule) {
    return next(new AppError('Doctor Schedule still not available...', 404, ErrorCodes.RESOURCE_NOT_FOUND));
  }

  res.status(200).json({
    status: 'success',
    data: {
      schedule
    }
  });
});

exports.getAvailability = catchAsync(async (req, res, next) => {
  const { date, service: serviceId} = req.query;

  if (!date || !serviceId) {
    return next(new AppError('Please provide a date and a service...', 400, ErrorCodes.INVALID_INPUT));
  }

  if (Number.isNaN(new Date(date).getTime())) {
    return next(new AppError('Date must be in YYYY-MM-DD format...', 400, ErrorCodes.INVALID_INPUT));
  }

  const today = new Date().toISOString().slice(0, 10);
  const requested = new Date(date).toISOString().slice(0, 10);

  if (requested < today) {
    return next(new AppError('You can only book today or a future date...', 400, ErrorCodes.INVALID_INPUT));
  }

  const [ doctor, service, schedule ] = await Promise.all([
    User.findOne({ _id: req.params.doctorId, role: 'doctor' }),
    Service.findById(serviceId),
    Schedule.findOne({ doctor: req.params.doctorId})
  ]);

  if (!doctor) {
    return next(new AppError('Doctor not found...', 404, ErrorCodes.RESOURCE_NOT_FOUND));
  }

  if (!service) {
    return next(new AppError('Service not found...', 404, ErrorCodes.RESOURCE_NOT_FOUND));
  }

  if (!schedule) {
    return next(new AppError('Schedule not found...', 404, ErrorCodes.RESOURCE_NOT_FOUND));
  }

  const day = new Date(date);
  const isDayOff = schedule.exceptions.some((ex) => ex.date.getTime() === day.getTime());

  if (isDayOff) return res.status(200).json({
    status: 'success',
    data: {
      date,
      slots: []
    }
  });

  const blocks = schedule.weeklyAvailability.filter((b) => b.day === weekdays[day.getUTCDay()]);

  const appointments = await Appointment.find({
    doctor: req.params.doctorId,
    date: day,
    status: mongoose.trusted({ $ne: 'cancelled' })
  });

  const busy = appointments.map((a) => ({
    start: a.timeSlot,
    end: addMinutes(a.timeSlot, a.duration)
  }));

  const slots = computeSlots({ blocks, busy, duration: service.duration });

  res.status(200).json({
    status: 'success',
    data: {
      date,
      duration: service.duration,
      slots
    }
  });
});

exports.updateMySchedule = catchAsync(async (req, res, next) => {
  let schedule = await Schedule.findOne({
    doctor: req.user.id
  });

  if (!schedule) {
    schedule = new Schedule({
      doctor: req.user.id
    });
  }

  const { doctor, ...changes } = req.body; 
  schedule.set(changes);
  await schedule.save();

  res.status(200).json({
    status: 'success',
    data: {
      schedule
    }
  });
});