const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
}

exports.signup = async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  const token = signToken(newUser._id);

  newUser.password = undefined;
  newUser.active = undefined;

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser
    }
  });
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  // Check if the email and password exist
  if (!email || !password) {
    return res.status(400).json({
      status: 'fail',
      message: 'Please provide email and password!'
    })
  }

  // Check if the user exist and password is correct
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return res.status(401).json({
      status: 'fail',
      message: 'Incorrect email or password!'
    })
  };
  
  const token = signToken(user._id);
  user.password = undefined;

  // If the password and email is correct
  res.status(200).json({
    status: 'success',
    token,
    data: {
      user
    }
  })
};

exports.protect = async (req, res, next) => {
  let token;

  // Extract the token from req.headers.authorization (with the startsWith('Bearer') check)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  };

  // If do not haved a right token, do not have an access to the routes... 
  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'Failed to acces, Please login to access this route...'
    });
  }

  // Verify the token with jwt.verify(promisified) -> decoded
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);

  // Find the current User by decoded.id
  const currentUser = await User.findById(decoded.id);

  // If the token no longer exists Unauthorized the user... 
  if (!currentUser) {
    return res.status(401).json({
      status: 'fail',
      message: 'User no longer exists...'
    })
  }
  
  // Check the changedPasswordAfter if it the password has been changed before the protect grant the access...
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return res.status(401).json({
      status: 'fail',
      message: 'User recently changed the password, Please try to login again...'
    });
  }

  // Grant Access to protected Route and pass it to the user request...
  req.user = currentUser;

  next();
}