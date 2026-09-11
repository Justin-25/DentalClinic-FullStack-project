const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

// Create a JWT containing the user's ID so it can be used for authentication.
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
}

// Create a new user and return a JWT for immediate authentication.
exports.signup = catchAsync(async (req, res, next) => {
  // Create the user from the registration data sent by the client.
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  const token = signToken(newUser._id);

  // Prevent sensitive fields from being included in the response.
  newUser.password = undefined;
  newUser.active = undefined;

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser
    }
  });
});

// Validate the login details and return a JWT when the credentials are correct.
exports.login = catchAsync(async (req, res, next) => {
  // Read the credentials submitted by the client.
  const { email, password } = req.body;

  // Check if the email and password exist
  if (!email || !password) {
    return res.status(400).json({
      status: 'fail',
      message: 'Please provide email and password!'
    })
  }

  // Include the password hash because it is hidden by the user schema by default.
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return res.status(401).json({
      status: 'fail',
      message: 'Incorrect email or password!'
    })
  };
  
  const token = signToken(user._id);

  // Never send the stored password hash back to the client.
  user.password = undefined;

  // Send the token and safe user data after successful authentication.
  res.status(200).json({
    status: 'success',
    token,
    data: {
      user
    }
  })
});

// Protect routes by verifying the user's JWT and confirming the account is still authorized.
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // Extract the JWT from the Authorization header.
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  };

  // Block access when the request does not contain a token.
  if (!token) {
    return next(new AppError('Failed to acces, Please login to access this route...', 401));
  }

  // Verify the token and decode its payload, including the user's ID.
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);

  // Load the current user so the account and password status can be checked.
  const currentUser = await User.findById(decoded.id);

  // Reject tokens belonging to a deleted or unavailable user.
  if (!currentUser) {
    return next(new AppError('User no longer exists...', 401));
  }
  
  // Reject tokens issued before the user's most recent password change.
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed the password, Please try to login again...', 401));
  }

  // Attach the authenticated user to the request for protected routes.
  req.user = currentUser;

  // Continue to the protected route handler.
  next();
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get user from collection, including password
  const user = await User.findById(req.user.id).select('+password');

  // 2. Check if POSTed current password is correct
  // (if wrong, use AppError with an appropriate status code)
  const currentPassword = req.body.currentPassword;
  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError('Your current password is not correct, Please try again...', 401))
  }

  // 3. If correct, update the password (set user.password and user.passwordConfirm from req.body, then .save())
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4. Log user in, send new JWT (since changing password should issue a fresh token)
  const token = signToken(user.id);

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });

  if (user) {
    // Generate the random reset token (using the instance method)
    // Save it to the database (skip validation)
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    
    try {
      // Send it to user's email
      const resetURL = `${req.protocol}://${req.get('host')}/api/users/resetPassword/${resetToken}`;

      await sendEmail({
        email: user.email,
        subject: 'Your password reset token (valid for 10 minutes only)...',
        message: `Forgot your password? Submit a new password to: ${resetURL}\nIf you didn't request this, please ignore this email.`
      })
    
    } catch (error) {
      // if sending email fails, clear the reset fields and save again, then return an error
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
  
      await user.save({ validateBeforeSave: false });
      
      return next(new AppError('There was an error sending the email. Try again later!', 500));
    }
  }

  // This runs identically whether or not `user` existed
  // no information leaked either way.
  res.status(200).json({
    status: 'success',
    message: 'If an account with that email exists, a reset link has been sent.'
  })
})