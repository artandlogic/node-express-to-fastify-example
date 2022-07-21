require('./app')({logger: true})
  .then(app => app.listen({port: 3000}))
  .then((address) => {
    console.log('Listening on ' + address);
  }).catch(console.log);
