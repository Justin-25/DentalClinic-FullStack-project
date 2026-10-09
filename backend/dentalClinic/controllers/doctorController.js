const mongoose = require('mongoose');
const User = require('../models/userModel');
const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');
const ErrorCodes = require('../utils/errorCodes');
const catchAsync = require('../utils/catchAsync');

const PUBLIC_FIELDS = 'name photo yearsOfExperience specialization bio';

const ratingSummary = (match) => Review.aggregate([
  { $match: { type: 'doctor', ...match } },
  { $group: { _id: '$doctor', ratingAverage: { $avg: '$rating' }, ratingCount: { $sum: 1 } } },
]);

const withRating = (doctor, summary) => ({
  ...doctor.toJSON(),
  ratingAverage: summary ? Math.round(summary.ratingAverage * 10) / 10 : null,
  ratingCount: summary ? summary.ratingCount : 0,
});

exports.getAllDoctors = catchAsync(async (req, res, next) => {
  const [ doctors, summaries ] = await Promise.all([
    User.find({ role: 'doctor'}).select(PUBLIC_FIELDS),
    ratingSummary({})
  ]);

  const byDoctor = new Map(summaries.map((s) => [String(s._id), s]));

  res.status(200).json({
    status: 'success',
    results: doctors.length,
    data: {
      doctors: doctors.map((d) => withRating(d, byDoctor.get(d.id)))
    }
  });
});

exports.getDoctor = catchAsync(async (req, res, next) => {
  const doctor = await User.findOne({ _id: req.params.doctorId, role: 'doctor' }).select(PUBLIC_FIELDS);

  if (!doctor) {
    return next(new AppError('Doctor not found...', 404, ErrorCodes.RESOURCE_NOT_FOUND));
  }

  const [summary] = await ratingSummary({
    doctor: new mongoose.Types.ObjectId(req.params.doctorId)
  });

  res.status(200).json({
    status: 'success',
    data: {
      doctor: withRating(doctor, summary)
    }
  });
});