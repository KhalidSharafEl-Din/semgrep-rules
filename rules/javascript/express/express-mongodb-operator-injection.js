const express = require('express');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const User = require('./models/user');
const db = require('./db');
const { WalletModel } = require('./sequelize-models');

const app = express();
app.use(express.json());

const searchSchema = z.object({ status: z.enum(['open', 'closed']) });

app.post('/login', async (req, res) => {
  // ruleid: express-mongodb-operator-injection
  const user = await User.findOne({ username: req.body.username, password: req.body.password });
  if (!user) return res.status(401).end();
  res.json({ id: user.id });
});

app.get('/orders', async (req, res) => {
  const { status } = req.query;
  // ruleid: express-mongodb-operator-injection
  const orders = await db.collection('orders').find({ owner: req.user.id, status }).toArray();
  res.json(orders);
});

app.delete('/drafts', async function (req, res) {
  // ruleid: express-mongodb-operator-injection
  await db.collection('drafts').deleteMany(req.body);
  res.sendStatus(204);
});

app.post('/reset', async (req, res) => {
  const token = req.body.token;
  // ruleid: express-mongodb-operator-injection
  const user = await User.findOneAndUpdate({ resetToken: token }, { resetToken: null });
  res.json({ ok: Boolean(user) });
});

app.post('/login-safe', async (req, res) => {
  // ok: express-mongodb-operator-injection
  const user = await User.findOne({ username: String(req.body.username) });
  if (!user || !(await bcrypt.compare(String(req.body.password), user.passwordHash))) {
    return res.status(401).end();
  }
  res.json({ id: user.id });
});

app.get('/orders-safe', async (req, res) => {
  const { status } = searchSchema.parse(req.query);
  // ok: express-mongodb-operator-injection
  const orders = await db.collection('orders').find({ owner: req.user.id, status }).toArray();
  res.json(orders);
});

app.get('/users/:id', async (req, res) => {
  // ok: express-mongodb-operator-injection
  const user = await User.findOne({ _id: req.params.id });
  res.json(user);
});

app.get('/tags', async (req, res) => {
  // ok: express-mongodb-operator-injection
  const tags = await db.collection('tags').find({ prefix: `${req.query.prefix}` }).toArray();
  res.json(tags);
});

app.get('/wallet', async (req, res) => {
  // Sequelize: operators are Symbols, so JSON input cannot add one.
  // ok: express-mongodb-operator-injection
  const wallet = await WalletModel.findOne({ where: { UserId: req.body.UserId } });
  res.json(wallet);
});

app.patch('/reviews', async (req, res) => {
  // ruleid: express-mongodb-operator-injection
  await db.collection('reviews').update({ _id: req.body.id }, { $set: { message: String(req.body.message) } });
  res.sendStatus(204);
});

app.patch('/wallet', async (req, res) => {
  // ok: express-mongodb-operator-injection
  await WalletModel.update({ balance: Number(req.body.amount), note: req.body.note }, { where: { UserId: req.user.id } });
  res.sendStatus(204);
});

app.patch('/me', async (req, res) => {
  const user = await WalletModel.findByPk(req.user.id);
  // ok: express-mongodb-operator-injection
  await user.update({ nickname: req.body.nickname });
  res.sendStatus(204);
});

app.patch('/reviews-checked', async (req, res) => {
  if (typeof req.body.id !== 'string') {
    return res.status(400).end();
  }
  // ok: express-mongodb-operator-injection
  await db.collection('reviews').update({ _id: req.body.id }, { $set: { message: String(req.body.message) } });
  res.sendStatus(204);
});

app.post('/lookup', async (req, res) => {
  const email = req.body.email;
  if (typeof email === 'string') {
    // ok: express-mongodb-operator-injection
    return res.json(await User.findOne({ email }));
  }
  res.status(400).end();
});

module.exports = app;
