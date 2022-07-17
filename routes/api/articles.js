const mongoose = require('mongoose');

const Article = mongoose.model('Article');
const Comment = mongoose.model('Comment');
const User = mongoose.model('User');

const articleSchema = {
  type: "object",
  properties: {
    title: {type: "string"},
    description: {type: "string"},
    body: {type: "string"},
    tagList: {
      type: "array",
      items: {
        type: "string",
        minLength: 1,
      },
    },
  },
  required: [
    "title",
    "description",
    "body",
    "tagList",
  ],
};

module.exports = async function (fastify, opts) {
  fastify.route({
    method: 'GET',
    url: '/',
    onRequest: [fastify.authenticatedOptional],
    schema: {
      query: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            minimum: 1,
          },
          offset: {
            type: "number",
            minimum: 0,
          },
          tag: {
            type: "string",
            minLength: 1,
          },
          author: {
            type: "string",
            minLength: 1,
          },
          favorited: {
            type: "string",
            minLength: 1,
          },
        },
        required: [],
      },
    },
    handler: async function(request, reply) {
      var query = {};
      var limit = 20;
      var offset = 0;

      if(typeof request.query.limit !== 'undefined'){
        limit = request.query.limit;
      }

      if(typeof request.query.offset !== 'undefined'){
        offset = request.query.offset;
      }

      if( typeof request.query.tag !== 'undefined' ){
        query.tagList = {"$in" : [request.query.tag]};
      }

      const [author, favoriter] = await Promise.all([
        request.query.author ?
          await User.findOne({username: request.query.author}) :
          null,
        request.query.favorited ?
          await User.findOne({username: request.query.favorited}) :
          null,
      ]);

      if(author){
        query.author = author._id;
      }

      if(favoriter){
        query._id = {$in: favoriter.favorites};
      } else if(request.query.favorited){
        query._id = {$in: []};
      }

      const [articles, articlesCount, user] = await Promise.all([
        Article.find(query)
          .limit(Number(limit))
          .skip(Number(offset))
          .sort({createdAt: 'desc'})
          .populate('author')
          .exec(),
        Article.count(query).exec(),
        request.payload ? User.findById(request.payload.id) : null,
      ]);

      return {
        articles: articles.map(function(article){
          return article.toJSONFor(user);
        }),
        articlesCount: articlesCount,
      };
    },
  });

  fastify.route({
    method: 'GET',
    url: '/feed',
    onRequest: [fastify.authenticated],
    schema: {
      query: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            minimum: 1,
          },
          offset: {
            type: "number",
            minimum: 0,
          },
        },
        required: [],
      },
    },
    handler: async function(request, reply) {
      var limit = 20;
      var offset = 0;

      if(typeof request.query.limit !== 'undefined'){
        limit = request.query.limit;
      }

      if(typeof request.query.offset !== 'undefined'){
        offset = request.query.offset;
      }

      const user = await User.findById(request.payload.id);
      if (!user) {
        reply.code(401).send();
        return;
      }

      const [articles, articlesCount] = await Promise.all([
        Article.find({ author: {$in: user.following}})
          .limit(Number(limit))
          .skip(Number(offset))
          .populate('author')
          .exec(),
        Article.count({ author: {$in: user.following}})
      ]);
      return {
        articles: articles.map(function(article){
          return article.toJSONFor(user);
        }),
        articlesCount: articlesCount
      };
    },
  });

  // return a article
  fastify.route({
    method: 'GET',
    url: '/:article',
    onRequest: [fastify.authenticatedOptional],
    schema: {
      params: {
        type: "object",
        properties: {
          article: {
            type: "string",
            minLength: 1,
          },
        },
        required: ["article"],
      },
    },
    handler: async function(request, reply) {
      const [user, article] = await Promise.all([
        request.payload ? User.findById(request.payload.id) : null,
        Article.findOne({slug: request.params.article})
          .populate('author'),
      ]);
      if (!article) {
        reply.code(404).send();
        return;
      }

      return {article: article.toJSONFor(user)};
    },
  });

  fastify.route({
    method: 'POST',
    url: '/',
    onRequest: [fastify.authenticated],
    schema: {
      body: {
        type: "object",
        properties: {
          article: articleSchema,
        },
        required: ["article"],
      },
    },
    handler: async function(request, reply) {
      const user = await User.findById(request.payload.id);
      if (!user) {
        reply.code(401).send();
        return;
      }

      const article = new Article(request.body.article);
      article.author = user;

      await article.save();
      console.log(article.author);
      return {article: article.toJSONFor(user)};
    },
  });

  // update article
  fastify.route({
    method: 'PUT',
    url: '/:article',
    onRequest: [fastify.authenticated],
    schema: {
      params: {
        type: "object",
        properties: {
          article: {
            type: "string",
            minLength: 1,
          },
        },
        required: ["article"],
      },
      body: {
        type: "object",
        properties: {
          article: {
            ...articleSchema,
            required: [],
          },
        },
        required: ["article"],
      },
    },
    handler: async function(request, reply) {
      const [user, article] = await Promise.all([
        User.findById(request.payload.id),
        Article.findOne({slug: request.params.article})
          .populate('author'),
      ]);
      if(article.author._id.toString() === request.payload.id.toString()){
        if(typeof request.body.article.title !== 'undefined'){
          article.title = request.body.article.title;
        }

        if(typeof request.body.article.description !== 'undefined'){
          article.description = request.body.article.description;
        }

        if(typeof request.body.article.body !== 'undefined'){
          article.body = request.body.article.body;
        }

        if(typeof request.body.article.tagList !== 'undefined'){
          article.tagList = request.body.article.tagList
        }

        await article.save();
        return {article: article.toJSONFor(user)};
      } else {
        reply.code(403).send();
        return;
      }
    },
  });

  // delete article
  fastify.route({
    method: 'DELETE',
    url: '/:article',
    onRequest: [fastify.authenticated],
    schema: {
      params: {
        type: "object",
        properties: {
          article: {
            type: "string",
            minLength: 1,
          },
        },
        required: ["article"],
      },
    },
    handler: async function(request, reply) {
      const [user, article] = await Promise.all([
        User.findById(request.payload.id),
        Article.findOne({slug: request.params.article})
          .populate('author'),
      ]);
      if (!user) {
        reply.code(401).send();
        return;
      }

      if(article.author._id.toString() === request.payload.id.toString()){
        await article.remove();
        reply.code(204).send();
        return;
      } else {
        reply.code(403);
        return;
      }
    },
  });

  // Favorite an article
  fastify.route({
    method: 'POST',
    url: '/:article/favorite',
    onRequest: [fastify.authenticated],
    schema: {
      params: {
        type: "object",
        properties: {
          article: {
            type: "string",
            minLength: 1,
          },
        },
        required: ["article"],
      },
    },
    handler: async function(request, reply) {
      let [user, article] = await Promise.all([
        User.findById(request.payload.id),
        Article.findOne({slug: request.params.article})
          .populate('author'),
      ]);
      if (!user) {
        reply.code(401).send();
        return;
      }
      const articleId = article._id;

      await user.favorite(articleId);
      article = await article.updateFavoriteCount();
      return {article: article.toJSONFor(user)};
    },
  });

  // Unfavorite an article
  fastify.route({
    method: 'DELETE',
    url: '/:article/favorite',
    onRequest: [fastify.authenticated],
    schema: {
      params: {
        type: "object",
        properties: {
          article: {
            type: "string",
            minLength: 1,
          },
        },
        required: ["article"],
      },
    },
    handler: async function(request, reply) {
      let [user, article] = await Promise.all([
        User.findById(request.payload.id),
        Article.findOne({slug: request.params.article})
          .populate('author'),
      ]);
      if (!user) {
        reply.code(401).send();
        return;
      }
      const articleId = article._id;

      await user.unfavorite(articleId);
      article = await article.updateFavoriteCount();
      return {article: article.toJSONFor(user)};
    },
  });

  // return an article's comments
  fastify.route({
    method: 'GET',
    url: '/:article/comments',
    onRequest: [fastify.authenticatedOptional],
    schema: {
      params: {
        type: "object",
        properties: {
          article: {
            type: "string",
            minLength: 1,
          },
        },
        required: ["article"],
      },
    },
    handler: async function(request, reply) {
      const [user, article] = await Promise.all([
        request.payload ? User.findById(request.payload.id) : null,
        Article.findOne({slug: request.params.article})
          .populate('author'),
      ]);

      await article.populate({
        path: 'comments',
        populate: {
          path: 'author'
        },
        options: {
          sort: {
            createdAt: 'desc'
          }
        }
      });
      return {comments: article.comments.map(function(comment){
        return comment.toJSONFor(user);
      })};
    },
  });

  // create a new comment
  fastify.route({
    method: 'POST',
    url: '/:article/comments',
    onRequest: [fastify.authenticated],
    schema: {
      params: {
        type: "object",
        properties: {
          article: {
            type: "string",
            minLength: 1,
          },
        },
        required: ["article"],
      },
      body: {
        type: "object",
        properties: {
          comment: {
            type: "object",
            properties: {
              body: {type: "string"},
            },
            required: ["body"],
          },
        },
        required: ["comment"],
      },
    },
    handler: async function(request, reply) {
      const [user, article] = await Promise.all([
        User.findById(request.payload.id),
        Article.findOne({slug: request.params.article})
          .populate('author'),
      ]);
      if(!user){
        reply.code(401).send();
        return;
      }

      const comment = new Comment(request.body.comment);
      comment.article = article;
      comment.author = user;

      await comment.save();
      article.comments.push(comment);

      await article.save();
      return {comment: comment.toJSONFor(user)};
    },
  });

  fastify.route({
    method: 'DELETE',
    url: '/:article/comments/:comment',
    onRequest: [fastify.authenticated],
    schema: {
      params: {
        type: "object",
        properties: {
          article: {
            type: "string",
            minLength: 1,
          },
          comment: {
            type: "string",
            minLength: 1,
          },
        },
        required: ["article"],
      },
    },
    handler: async function(request, reply) {
      const [article, comment] = await Promise.all([
        Article.findOne({slug: request.params.article})
          .populate('author'),
        Comment.findById(request.params.comment),
      ]);

      if(comment.author.toString() === request.payload.id.toString()){
        article.comments.remove(comment._id);
        await article.save();
        await Comment.find({_id: request.comment._id}).remove().exec();
        reply.code(204).send();
        return;
      } else {
        reply.code(403).send();
        return;
      }
    },
  });
}
