const articles = require('./articles');
const profiles = require('./profiles');
const tags = require('./tags');
const users = require('./users');

module.exports = async function (fastify, opts) {
  await fastify.register(articles, {prefix: "/articles"});
  await fastify.register(profiles, {prefix: "/profiles"});
  await fastify.register(tags, {prefix: "/tags"});
  await fastify.register(users);
}
