const User = require('../models/userModel');
const Service = require('../models/serviceModel');
const Appointment = require('../models/appointmentModel');
const Schedule = require('../models/scheduleModel');
const AppError = require('../utils/appError');
const ErrorCodes = require('../utils/errorCodes');
const weekdays = require('../utils/weekdays');
const catchAsync = require('../utils/catchAsync');
const addMinutes = require('../utils/addMinutes');

exports.createAppointment = catchAsync(async (req, res, next) => {
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

  const isDayOff = schedule.exceptions.some((ex) => ex.date.getTime() ===  new Date(req.body.date).getTime() && ex.isAvailable === false)

  if (isDayOff) {
    return next(new AppError('Doctor is currently on day off...', 400, ErrorCodes.SLOT_UNAVAILABE));
  }

  const block = schedule.weeklyAvailability.find((b) => b.day === weekday && b.startTime <= req.body.timeSlot);

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
    status: { $ne: 'cancelled'}
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
  })
})