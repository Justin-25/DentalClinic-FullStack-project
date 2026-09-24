const User = require('../models/userModel');
const Schedule = require('../models/scheduleModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const ErrorCodes = require('../utils/errorCodes');

exports.getDoctorSchedule = catchAsync(async (req, res, next) => {
  const doctor = await User.findById(req.params.doctorId);

  if (!doctor || doctor.role !== 'doctor') {
    return next(new AppError(`No doctor found with this ID...`, 404, ErrorCodes.RESOURCE_NOT_FOUND));
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