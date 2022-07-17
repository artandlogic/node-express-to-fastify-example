const api = require('./api');

module.exports = async function (fastify, opts) {
  await fastify.register(api, {prefix: "/api"});
};
