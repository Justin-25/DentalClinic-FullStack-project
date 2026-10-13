require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', 'config.env')});

const User = require('../models/userModel');
const Service = require('../models/serviceModel');
const Schedule = require('../models/scheduleModel');
const Appointment = require('../models/appointmentModel');
const Review = require('../models/reviewModel');

const read = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, `${name}.json`), 'utf-8'));

const importData = async () => {
  await User.create(read('users'));
  await Service.create(read('services'));
  await Schedule.create(read('schedules'));
  await Appointment.create(read('appointments'));
  await Review.create(read('reviews'));

  console.log('Demo data imported.');
}

const deleteData = async () => {
  await Promise.all([User.deleteMany(), Service.deleteMany(), Schedule.deleteMany(), Appointment.deleteMany(), Review.deleteMany()]);

  console.log('All data deleted.')
}

(async () => {
  await mongoose.connect(process.env.DATABASE_URL.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
  ));
  try {
    if (process.argv.includes('--import')) await importData();
    else if (process.argv.includes('--delete')) await deleteData();
    else console.log('Use --import or --delete');
  } catch (err) {
    console.error(err.message);
  } finally {
    await mongoose.connection.close();
  }
})();