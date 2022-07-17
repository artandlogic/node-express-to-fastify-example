const articles = require('./articles');
const profiles = require('./profiles');

module.exports = async function (fastify, opts) {
  await fastify.register(articles, {prefix: "/articles"});
  await fastify.register(profiles, {prefix: "/profiles"});
}
