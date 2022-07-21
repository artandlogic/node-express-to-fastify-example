async function build(opts={}) {
  const mongoose = require('mongoose');

  if(['production', 'test'].includes(process.env.NODE_ENV)) {
    mongoose.connect(process.env.MONGODB_URI);
  } else {
    mongoose.connect('mongodb://localhost/conduit');
    mongoose.set('debug', true);
  }

  require('./models/User');
  require('./models/Article');
  require('./models/Comment');

  // Create global app object
  const app = require('fastify')({opts});
  app.addHook('onClose', async () => {
    await mongoose.disconnect();
  })
  await app.register(require('@fastify/formbody'));
  await app.register(require('./plugins/auth'));
  await app.register(require('./routes'));
  return app;
}

module.exports = build;
