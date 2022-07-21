const models = [
  require('./User'),
  require('./Article'),
  require('./Comment'),
];

async function deleteAll() {
  await Promise.all(models.map((Model) => Model.deleteMany()));
}

module.exports = {deleteAll, models};
