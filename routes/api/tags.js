const mongoose = require('mongoose');

const Article = mongoose.model('Article');

module.exports = async function (fastify, opts) {
  fastify.route({
    method: 'GET',
    url: '/',
    schema: {},
    handler: async function(request, reply) {
      const tags = await Article.find().distinct('tagList');
      return {tags};
    },
  });
}
