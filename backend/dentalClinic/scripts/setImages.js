require('dns').setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', 'config.env')});

const Service = require('../models/serviceModel');

const DRY_RUN = process.argv.includes('--dry-run');
const IMG = path.join(__dirname, '..', 'public', 'img');

async function run() {
  const DB = process.env.DATABASE_URL.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
  );
  await mongoose.connect(DB);

  const services = await Service.find().setOptions({ includeInactive: true });
  for (const s of services) {
    const file = `${s.slug}.jpg`;
    if (!fs.existsSync(path.join(IMG, 'services', file))) {
      console.log(`skip ${s.slug} (no image file, stays ${s.imageCover})`);
      continue;
    }

    console.log(`${DRY_RUN ? 'would set' : 'set'} ${s.slug} -> ${file}`);
    if (!DRY_RUN) await Service.updateOne({ _id: s._id }, {  imageCover: file });
  }

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
})