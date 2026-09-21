const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const ErrorCodes = require("../utils/errorCodes");

const filterObj = (obj, ...allowedFields) => {
  const filtered = {};
  Object.keys(obj).forEach(key => {
    if (allowedFields.includes(key)) {
      return filtered[key] = obj[key] 
    }
  });

  return filtered;
}

exports.myAccount = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
};

exports.updateMyAccount = catchAsync(async (req, res, next) => {
  const allowed = ['name', 'email', 'photo'];

  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError(`This route isn't for password updates. Use /updateMyPassword instead.`, 400, ErrorCodes.INVALID_PASSWORD_UPDATE_CONTEXT))
  }

  if (req.user.role === 'doctor'){
    allowed.push('specialization', 'yearsOfExperience', 'bio');
  }

  const filterBody = filterObj(req.body, ...allowed);

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    returnDocument: 'after',
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  })
});

exports.deleteMyAccount = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, {
    active: false
  });

  res.status(204)
});