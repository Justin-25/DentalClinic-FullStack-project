const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const AppError = require('./appError');
const ErrorCodes = require('./errorCodes');
const catchAsync = require('./catchAsync');

// Keep the file in memory (req.file.buffer) so sharp can process it before anything touches the disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024},
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
      cb (null, true);
    } else {
      cb(new AppError('Please upload an image file...', 400, ErrorCodes.INVALID_INPUT), false);
    }
  }
});

exports.uploadUserPhoto = upload.single('photo');
exports.uploadServiceCover = upload.single('imageCover');

// Photo and cover names come only from an uploaded file. A name sent as plain text
// (e.g. "photo": "<someone else's photo>.jpeg") is dropped before the controller sees it.

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  delete req.body.photo;
  if (!req.file) return next();

  const filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .jpeg({ quality: 85 })
    .toFile(path.join(__dirname, '..', 'public', 'img', 'users', filename));

  req.body.photo = filename;
  next();
});

exports.resizeServiceCover = catchAsync(async (req, res, next) => {
  delete req.body.imageCover;
  if (!req.file) return next();

  const filename = `service-${req.params.serviceId || new mongoose.Types.ObjectId()}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(1200, 900)
    .jpeg({ quality: 85 })
    .toFile(path.join(__dirname, '..', 'public', 'img', 'services', filename));

  req.body.imageCover = filename;
  next();
})
