const express = require('express'),
      session = require('express-session'),
      fp = require('fastify-plugin'),
      cors = require('cors'),
      errorhandler = require('errorhandler');

module.exports = fp(async function (fastify, opts) {
  await fastify.register(require('@fastify/express'), {
    // run express after `fastify-formbody` logic
    expressHook: 'preHandler',
  });

  fastify.use(cors());

  // Normal express config defaults
  fastify.use(require('morgan')('dev'));

  fastify.use(require('method-override')());
  fastify.use(express.static(__dirname + '/../../public'));

  fastify.use(session({ secret: 'conduit', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false  }));

  if (!opts.isProduction) {
    fastify.use(errorhandler());
  }

  const router = require('express').Router();

  router.use('/api', require('./api'));
  fastify.use(router);

  /// error handlers

  // development error handler
  // will print stacktrace
  if (!opts.isProduction) {
    fastify.use(function(err, req, res, next) {
      console.log(err.stack);

      res.status(err.status || 500);

      res.json({'errors': {
        message: err.message,
        error: err
      }});
    });
  }

  // production error handler
  // no stacktraces leaked to user
  fastify.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({'errors': {
      message: err.message,
      error: {}
    }});
  });
});
