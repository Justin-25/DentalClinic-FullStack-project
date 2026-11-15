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

// The demo data was written around 13 Oct 2026. So it still looks right whenever it's
// loaded, the visits are moved to fit today: finished visits end before today, and the
// later ones (with the dentists' days off) start today or after. Every move is whole
// weeks, so each visit keeps its weekday and stays inside its dentist's working hours.
const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;

const shiftToToday = ({ appointments, schedules, reviews }) => {
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()); // local date, stored as UTC midnight like the data
  const time = (iso) => Date.parse(iso);

  const lastFinished = Math.max(...appointments
    .filter((a) => ['completed', 'no-show'].includes(a.status))
    .map((a) => time(a.date)));
  const firstLater = Math.min(...appointments.map((a) => time(a.date)).filter((t) => t > lastFinished));

  const pastShift = Math.floor((today - DAY - lastFinished) / WEEK) * WEEK; // last finished visit: yesterday or the week before
  const laterShift = Math.ceil((today - firstLater) / WEEK) * WEEK;         // first later visit: today or within a week
  const shiftFor = (iso) => (time(iso) > lastFinished ? laterShift : pastShift);
  const move = (iso, by) => new Date(time(iso) + by).toISOString();
  const notFuture = (iso) => new Date(Math.min(time(iso), now.getTime())).toISOString();

  const movedBy = new Map(); // appointment id -> its shift, so its review moves with it
  for (const a of appointments) {
    const by = shiftFor(a.date);
    movedBy.set(a._id, by);
    a.date = move(a.date, by);
    if (a.createdAt) a.createdAt = notFuture(move(a.createdAt, by));
  }
  for (const schedule of schedules) {
    for (const dayOff of schedule.exceptions ?? []) dayOff.date = move(dayOff.date, shiftFor(dayOff.date));
  }
  for (const r of reviews) {
    if (r.createdAt) r.createdAt = notFuture(move(r.createdAt, movedBy.get(r.appointment) ?? pastShift));
  }
  return { pastDays: pastShift / DAY, laterDays: laterShift / DAY };
};

const importData = async () => {
  const appointments = read('appointments');
  const schedules = read('schedules');
  const reviews = read('reviews');
  const { pastDays, laterDays } = shiftToToday({ appointments, schedules, reviews });

  await User.create(read('users'));
  await Service.create(read('services'));
  await Schedule.create(schedules);
  await Appointment.create(appointments);
  await Review.create(reviews);

  console.log(`Demo data imported (finished visits moved ${pastDays} days, later visits ${laterDays} days, to fit today).`);
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
