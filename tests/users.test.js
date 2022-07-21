const {MongoMemoryServer} = require('mongodb-memory-server');
const {test} = require('tap');

const build = require('../app')
const {deleteAll} = require('../models');
const User = require('../models/User');

test('/users', async t => {
  let mongod, app;

  t.before(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = mongod.getUri();
    app = await build();
  });
  t.beforeEach(async t => {
    await deleteAll();
  });
  t.teardown(async () => {
    await app.close();
    await mongod.stop();
  });

  await t.test('POST /users', async t => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': '',
      },
      payload: {
        user: {
          email: 'john@jacob.com',
          password: 'johnnyjacob',
          username: 'johnjacob',
        },
      },
    })

    t.equal(response.statusCode, 200, 'returns a status code of 200');
    const body = response.json();
    t.hasProp(body, 'user', 'Response has "user" property"');
    t.hasProp(body.user, 'email', 'User has "email" property"');
    t.hasProp(body.user, 'username', 'User has "username" property"');
    t.hasProp(body.user, 'token', 'User has "token" property"');
  });

  await t.test('POST /users/login', async t => {
    const user = new User();
    user.username = 'johnjacob';
    user.email = 'john@jacob.com';
    user.setPassword('johnnyjacob');
    await user.save();

    const response = await app.inject({
      method: 'POST',
      url: '/api/users/login',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': '',
      },
      payload: {
        user: {
          email: 'john@jacob.com',
          password: 'johnnyjacob',
        },
      },
    })

    t.equal(response.statusCode, 200, 'returns a status code of 200');
    const body = response.json();
    t.hasProp(body, 'user', 'Response has "user" property"');
    t.hasProp(body.user, 'email', 'User has "email" property"');
    t.hasProp(body.user, 'username', 'User has "username" property"');
    t.hasProp(body.user, 'token', 'User has "token" property"');
  });

  await t.test('GET /user', async t => {
    const user = new User();
    user.username = 'johnjacob';
    user.email = 'john@jacob.com';
    user.setPassword('johnnyjacob');
    await user.save();

    const response = await app.inject({
      method: 'GET',
      url: '/api/user',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': '',
        Authorization: `Token ${user.generateJWT()}`,
      },
    })

    t.equal(response.statusCode, 200, 'returns a status code of 200');
    const body = response.json();
    t.hasProp(body, 'user', 'Response has "user" property"');
    t.hasProp(body.user, 'email', 'User has "email" property"');
    t.hasProp(body.user, 'username', 'User has "username" property"');
    t.hasProp(body.user, 'token', 'User has "token" property"');
  });

  await t.test('PUT /user', async t => {
    const user = new User();
    user.username = 'johnjacob';
    user.email = 'john@jacob.com';
    user.setPassword('johnnyjacob');
    await user.save();

    const response = await app.inject({
      method: 'PUT',
      url: '/api/user',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': '',
        Authorization: `Token ${user.generateJWT()}`,
      },
      payload: {
        user: {email: 'john@jacob.com'},
      },
    })

    t.equal(response.statusCode, 200, 'returns a status code of 200');
    const body = response.json();
    t.hasProp(body, 'user', 'Response has "user" property"');
    t.hasProp(body.user, 'email', 'User has "email" property"');
    t.hasProp(body.user, 'username', 'User has "username" property"');
    t.hasProp(body.user, 'token', 'User has "token" property"');
  });
});
