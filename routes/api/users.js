const mongoose = require('mongoose');

const User = mongoose.model('User');

const userSchema = {
  type: "object",
  properties: {
    username: {type: "string"},
    email: {
      type: "string",
      format: "email",
    },
    image: {type: "string"},
    password: {type: "string"},
  },
  required: ["username", "email", "password"],
};

module.exports = async function (fastify, opts) {
  fastify.route({
    method: 'GET',
    url: '/user',
    onRequest: [fastify.authenticated],
    schema: {},
    handler: async function(request, reply) {
      const user = await User.findById(request.payload.id);
      if(!user){
        return {profile: profileUser.toProfileJSONFor(false)};
      }

      return {user: user.toAuthJSON()};
    },
  });

  fastify.route({
    method: 'PUT',
    url: '/user',
    onRequest: [fastify.authenticated],
    schema: {
      body: {
        type: "object",
        properties: {
          user: {
            ...userSchema,
            required: [],
          },
        },
        required: ["user"],
      },
    },
    handler: async function(request, reply) {
      const user = await User.findById(request.payload.id);
      if(!user){
        return {profile: profileUser.toProfileJSONFor(false)};
      }

      // only update fields that were actually passed...
      if(typeof request.body.user.username !== 'undefined'){
        user.username = request.body.user.username;
      }
      if(typeof request.body.user.email !== 'undefined'){
        user.email = request.body.user.email;
      }
      if(typeof request.body.user.bio !== 'undefined'){
        user.bio = request.body.user.bio;
      }
      if(typeof request.body.user.image !== 'undefined'){
        user.image = request.body.user.image;
      }
      if(typeof request.body.user.password !== 'undefined'){
        user.setPassword(request.body.user.password);
      }

      await user.save();
      return {user: user.toAuthJSON()};
    },
  });

  fastify.route({
    method: 'POST',
    url: '/users/login',
    schema: {
      body: {
        type: "object",
        properties: {
          user: {
            type: "object",
            properties: {
              email: {
                type: "string",
                format: "email",
              },
              password: {type: "string"},
            },
            required: ["email", "password"],
          },
        },
        required: ["user"],
      },
    },
    handler: async function(request, reply) {
      const user = await User.findOne({email: request.body.user.email});
      if(!user || !user.validPassword(request.body.user.password)){
        reply.statusCode = 401;
        return {errors: {'email or password': 'is invalid'}};
      }

      user.token = user.generateJWT();
      return {user: user.toAuthJSON()};
    },
  });

  fastify.route({
    method: 'POST',
    url: '/users',
    schema: {
      body: {
        type: "object",
        properties: {
          user: userSchema,
        },
        required: ["user"],
      },
    },
    handler: async function(request, reply) {
      const user = new User();

      user.username = request.body.user.username;
      user.email = request.body.user.email;
      user.setPassword(request.body.user.password);

      await user.save();
      return {user: user.toAuthJSON()};
    },
  });
}
