// File tag
const tag = 'whiskse';

// Requirements
require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const debug = require('debug')(tag);

// App configuration
const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

// Paths
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'css')));
app.use('/js', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'js')));
app.use('/js', express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist')));
app.set('views', './src/views');

// Routing
const whiskRouter = require('./src/routes/whiskRoutes')();

app.use('/', whiskRouter);

// Start Server
app.listen(port, () => {
  debug(`Express server listening on port ${port}...`);
});
