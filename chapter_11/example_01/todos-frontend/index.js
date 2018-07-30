/**
 * This is a simple web app with a Node.js + Express backend.
 * We serve the static web content from /dist and forward all other
 * requests to the todos-backend service.
 *
 * We configure Stackdriver Trace and Stackdriver Debugger immediately.
 * Stackdriver Trace must be configured before any other dependencies.
 */

if (process.env.NODE_ENV === 'production') {
  require('@google-cloud/trace-agent').start({
    ignoreUrls: [/.*\.(js|css|png|map)/]
  });
  require('@google-cloud/debug-agent').start();
}

/**
 * Configure Stackdriver Logging integrations
 */
const winston = require('winston');
const LoggingWinston = require('@google-cloud/logging-winston').LoggingWinston;

const log = new winston.Logger({
  level: 'info',
  transports: [
    new winston.transports.Console(),
    new LoggingWinston()
  ]
});

/**
 * Configure the Express server
 */
const express = require('express');
const proxy = require('express-http-proxy');
const app = express();


/**
 * Determine the downstream todos-backend URL. This can be provided as a BACKEND_URL
 * environment variable. If no BACKEND_URL is provided, attempt to generate the URL
 * from App Engine context, otherwise assume the backend is running locally on port 8081.
 */
const config = {
  port: process.env.PORT || 8080,
  backendUrl: process.env.BACKEND_URL || process.env.NODE_ENV == 'production'
    ? `todos-backend-dot-${process.env.GCLOUD_PROJECT}.appspot.com`
    : 'localhost:8081'
}

/**
 * Forward all requets to /api/* to the todos-backend service.
 */
log.info('Forwarding API requests to ', config.backendUrl);
app.use('/api', proxy(config.backendUrl, {
  // Preserve the leading /api for downstream requests
  proxyReqPathResolver: (req) => {
    const path = '/api' + require('url').parse(req.url).path;
    log.info('Forwarding request to ' + config.backendUrl + path);
    return path;
  }
}));

/**
 * All other requests should be for static content.
 * We could alternatively let App Engine host this static content
 * directly by configuring static route handlers in app.yaml.
 */
app.use('/', express.static(__dirname + '/dist'));

// Start the express server on the provided port.
app.listen(config.port, (err) => {
  if (err) {
    return log.error('Failed to start node server', err);
  }
  log.info('Application listening on port', config.port);
});
