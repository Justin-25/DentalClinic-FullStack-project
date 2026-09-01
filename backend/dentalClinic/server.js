const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

// Change DNS for mongoDB to connect to Atlas
dns.setServers(["1.1.1.1", "8.8.8.8"]);

dotenv.config({ path: './config.env' });
const app = require('./app');


const port = process.env.PORT || 3000;
const DB = process.env.DATABASE_URL.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => {
  console.log(`DB connection successfully!!!`);
});

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});