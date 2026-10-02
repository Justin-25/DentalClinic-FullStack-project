const Appointment = require('../models/appointmentModel');
const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const ErrorCodes = require('../utils/errorCodes');


exports.createReview = catchAsync(async (req, res, next) => {
  const query = {
    patient: req.user.id,
    status: 'completed'
  };

  if (req.body.type === 'doctor') {
    query.doctor = req.body.doctor;
  }

  const qualifyingAppointment = await Appointment.findOne(query);

  if (!qualifyingAppointment) {
    return next(new AppError('You can leave a review once your appointment is complete...', 403, ErrorCodes.REVIEW_NOT_ELIGIBLE));
  }

  const review = await Review.create({
    review: req.body.review,
    type: req.body.type,
    rating: req.body.rating,
    doctor: req.body.doctor,
    patient: req.user.id,
    appointment: qualifyingAppointment._id
  });

  res.status(201).json({
    status: 'success',
    data: {
      review
    }
  });
});

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};

  if (req.query.doctor) filter.doctor = req.query.doctor;
  if (req.query.type) filter.type = req.query.type;

  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;

  const [reviews, totalResults] = await Promise.all([
    Review.find(filter)
      .populate('patient', 'name')
      .populate('doctor', 'name')
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter)
  ]);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    pagination: {
      page,
      limit,
      totalResults,
      totalPages: Math.ceil(totalResults / limit)
    },
    data: {
      reviews
    }
  });
});

exports.getReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id)
    .populate('patient', 'name')
    .populate('doctor', 'name');

  if (!review) {
    return next(new AppError('Review not found...', 404, ErrorCodes.RESOURCE_NOT_FOUND));
  }

  res.status(200).json({
    status: 'success',
    data: {
      review
    }
  });
});

exports.updateReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('Review not found...', 404, ErrorCodes.RESOURCE_NOT_FOUND));
  }

  const isOwner = String(review.patient) === req.user.id;

  if (!isOwner) {
    return next(new AppError('Review not found...', 404, ErrorCodes.RESOURCE_NOT_FOUND));
  }

  if (req.body.review !== undefined) review.review = req.body.review;
  if (req.body.rating !== undefined) review.rating = req.body.rating;

  await review.save();

  res.status(200).json({
    status: 'success',
    data: {
      review
    }
  });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('Review not found...', 404, ErrorCodes.RESOURCE_NOT_FOUND));
  }

  const isOwner = req.user.role === 'admin' || String(review.patient) === req.user.id;

  if (!isOwner) {
    return next(new AppError('Review not found...', 404, ErrorCodes.RESOURCE_NOT_FOUND));
  }

  await Review.findByIdAndDelete(req.params.id);

  res.status(204).send();
})