const fp = require("fastify-plugin");
const secret = require('../config').secret;

module.exports = fp(async function (fastify, opts) {
  await fastify.register(require("@fastify/jwt"), {
    decoratorName: 'payload',
    secret,
    verify: {
      extractToken: (request) => {
        const parts = request.headers.authorization.split(' ');
        if (parts.length !== 2) {
          throw new BadRequestError();
        }

        const [scheme, token] = parts;

        if (!/^Token$/i.test(scheme)) {
          throw new BadRequestError()
        }

        return token;
      },
    },
  });
  await fastify.decorate("authenticated", async function(request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });
  await fastify.decorate("authenticatedOptional", async function(request, reply) {
    try {
      await request.jwtVerify();
    } catch {}
  });
});
