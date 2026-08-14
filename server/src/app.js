const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const env = require('./config/env');
const logger = require('./config/logger');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const morganStream = { write: (message) => logger.http ? logger.http(message.trim()) : logger.info(message.trim()) };
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', { stream: morganStream }));

app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
