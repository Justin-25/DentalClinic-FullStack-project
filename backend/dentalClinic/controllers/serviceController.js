const mongoose = require('mongoose');
const Service = require('../models/serviceModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const ErrorCodes = require('../utils/errorCodes');

// Get All Services
exports.getAllServices = catchAsync(async (req, res, next) => {
  const services = await Service.find({
    secretService: mongoose.trusted({ $ne: true })
  });

  res.status(200).json({
    status: 'success',
    results: services.length,
    data: {
      services
    }
  });
});


// Get One Services
exports.getService = catchAsync(async (req, res, next) => {
  const service = await Service.findOne({
    slug: req.params.slug
  });

  if (!service) {
    return next(new AppError('Service not found...', 404, ErrorCodes.RESOURCE_NOT_FOUND));
  }

  res.status(200).json({
    status: 'success',
    data: {
      service
    }
  });
});

// Create Service
exports.createService = catchAsync(async (req, res, next) => {
  const service = await Service.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      service
    }
  });
});

// Update Service
exports.updateService = catchAsync(async (req, res, next) => {
  const service = await Service.findById(req.params.serviceId);

  if (!service) {
    return next(new AppError('Service not found...', 404, ErrorCodes.RESOURCE_NOT_FOUND));
  }

  service.set(req.body);
  await service.save();

  res.status(200).json({
    status: 'success',
    data: {
      service
    }
  });
});

// Delete Servivce
exports.deleteService = catchAsync(async (req, res, next) => {
  const service = await Service.findByIdAndUpdate(req.params.serviceId, {
    active: false
  });

  if (!service) {
    return next(new AppError('Service not found...', 404, ErrorCodes.RESOURCE_NOT_FOUND));
  }

  res.status(204).json({})
});