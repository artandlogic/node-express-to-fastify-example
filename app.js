var isProduction = process.env.NODE_ENV === 'production';

async function build() {
  const mongoose = require('mongoose');

  if(isProduction){
    mongoose.connect(process.env.MONGODB_URI);
  } else {
    mongoose.connect('mongodb://localhost/conduit');
    mongoose.set('debug', true);
  }

  require('./models/User');
  require('./models/Article');
  require('./models/Comment');
  require('./config/passport');

  // Create global app object
  const app = require('fastify')({
    logger: true,
  });
  await app.register(require('@fastify/formbody'));
  await app.register(require('./plugins/auth'));
  await app.register(require('./routes/legacy'), {isProduction});
  await app.register(require('./routes'));
  return app;
}

build()
  .then(app => app.listen({port: 3000}))
  .then((address) => {
    console.log('Listening on ' + address);
  }).catch(console.log);
