const Appointment = require('../models/appointmentModel');
const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const ErrorCodes = require('../utils/errorCodes');


exports.createReview = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findById(req.body.appointment);

  // Step 2: missing OR not this patient's → hide it
  if (!appointment || String(appointment.patient) !== req.user.id) {
    return next(new AppError('Appointment not found...', 404, ErrorCodes.RESOURCE_NOT_FOUND));
  }

  // Step 3: only completed visits
  if (appointment.status !== 'completed') {
    return next(new AppError('You can leave a review once your appointment is complete...', 403, ErrorCodes.REVIEW_NOT_ELIGIBLE));
  }

  // Step 4: only review/rating/type come from the body
  const review = await Review.create({
    review: req.body.review,
    type: req.body.type,
    rating: req.body.rating,
    doctor: req.body.type === 'doctor' ? appointment.doctor : undefined,
    patient: req.user.id,
    appointment: appointment.id
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

exports.getMyReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({ patient: req.user.id })
    .populate('doctor', 'name')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews
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