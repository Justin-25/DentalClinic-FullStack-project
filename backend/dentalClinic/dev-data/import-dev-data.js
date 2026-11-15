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

// Usage: node dev-data/import-dev-data.js --import | --delete | --reset  [--db <name>]
//   --reset  = delete everything, then import the demo data again
//   --db     = another database in the same cluster (e.g. the live demo's); default: the one in DATABASE_URL

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

const dbFlag = process.argv.indexOf('--db');
const dbName = dbFlag > -1 ? process.argv[dbFlag + 1] : undefined;

(async () => {
  await mongoose.connect(process.env.DATABASE_URL.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
  ), dbName ? { dbName } : {});
  console.log(`Database: ${mongoose.connection.name}`);
  try {
    if (process.argv.includes('--import')) await importData();
    else if (process.argv.includes('--delete')) await deleteData();
    else if (process.argv.includes('--reset')) {
      await deleteData();
      // the unique indexes (one booking per slot, one review per visit) must exist before importing
      await Promise.all([User, Service, Schedule, Appointment, Review].map((Model) => Model.init()));
      await importData();
    }
    else console.log('Use --import, --delete or --reset');
  } catch (err) {
    console.error(err.message);
  } finally {
    await mongoose.connection.close();
  }
})();
