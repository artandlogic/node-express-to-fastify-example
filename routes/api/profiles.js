const mongoose = require('mongoose');

const User = mongoose.model('User');

module.exports = async function (fastify, opts) {
  fastify.route({
    method: 'GET',
    url: '/:username',
    onRequest: [fastify.authenticatedOptional],
    schema: {
      params: {
        type: "object",
        properties: {
          username: {
            type: "string",
            minLength: 1,
          },
        },
        required: ["username"],
      },
    },
    handler: async function(request, reply) {
      if(request.payload){
        const [user, profileUser] = await Promise.all([
          User.findById(request.payload.id),
          User.findOne({username: request.params.username}),
        ]);
        if (!profileUser) {
          reply.code(404).send();
          return;
        }

        if(!user){
          return {profile: profileUser.toProfileJSONFor(false)};
        }

        return {profile: profileUser.toProfileJSONFor(user)};
      } else {
        return {profile: profileUser.toProfileJSONFor(false)};
      }
    },
  });
}
