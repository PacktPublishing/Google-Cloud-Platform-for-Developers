/**
 * The below code defines a basic Node.JS API server that interacts with Cloud Datastore
 */
const express = require('express');
const bodyParser = require('body-parser');
const Datastore = require('@google-cloud/datastore');

const port = process.env.PORT || 3000;

const app = express();

const datastore = Datastore();

app.use(bodyParser.json());

app.get('/users', (req, res) => {
  const query = datastore.createQuery('User');
  return datastore.runQuery(query).then(results => {
    console.log(results);
    const entities = results[0];
    res.send(entities);
  }).catch(err => {
    res.status(500).send(err);
  });
});

function getUserKey(name) {
  return datastore.key({
    path: ['User', name]
  });
}

app.put('/users', (req, res) => {
  const userKey = getUserKey(req.body.name);
  console.log('user key:', userKey);
  datastore.save({
    key: userKey,
    data: req.body
  }).then(results => {
    res.send(results);
  }).catch(err => {
    res.status(500).send(err);
  });
});

app.get('/users/{userName}', (req, res) => {
  return getUserKey(req.param.userName);
});

app.get('/users/{userName}', (req, res) => {
  return datastore.query()
});

function getCardKey(user, card) {
  return datastore.key({
    path: ['User', user, 'Card', card ]
  });
}

app.put('/users/{userName}/cards', (req, res) => {
  datastore.save({
    key: getCardKey(req.path.userName, req.body.name),
    data: req.body.data
  }).then(results => {
    res.send(results);
  }).catch(err => {
    res.status(500).send(err);
  });
});

app.get('/users/{userName}/cards/{cardName}', (req, res) => {
  const key = getCardKey(req.path.userName, req.path.cardName);
  return datastore.get(key);
});

app.listen(port, (err) => {
  if (err) {
    return console.error('Service failed to start', err);
  }
  console.log('Service listening on port ' + port);
});
