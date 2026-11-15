const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

// Change DNS for mongoDB to connect to Atlas
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// SanitizeFilter
mongoose.set('sanitizeFilter', true);

dotenv.config({ path: './config.env' });
const app = require('./app');


const port = process.env.PORT || 3000;
const DB = process.env.DATABASE_URL.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// DATABASE_NAME (optional) picks another database in the same cluster, e.g. the live demo's
const options = process.env.DATABASE_NAME ? { dbName: process.env.DATABASE_NAME } : {};

mongoose.connect(DB, options).then(() => {
  console.log(`DB connection successfully!!! (${mongoose.connection.name})`);
});

app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});