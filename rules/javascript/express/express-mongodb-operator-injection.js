const express = require('express');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const User = require('./models/user');
const db = require('./db');
const mongoose = require('mongoose');
const Joi = require('joi');

const loginSchema = Joi.object({ email: Joi.string().email(), password: Joi.string() });
const { WalletModel } = require('./sequelize-models');

const app = express();
app.use(express.json());

const searchSchema = z.object({ status: z.enum(['open', 'closed']) });
const looseSchema = z.object({ status: z.string() }).passthrough();
const anySchema = z.any();

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

app.post('/login-normalised', async (req, res) => {
  // ok: express-mongodb-operator-injection
  const user = await User.findOne({ email: req.body.email.toLowerCase().trim() });
  res.json({ found: Boolean(user) });
});

app.patch('/reviews-logged', async (req, res) => {
  if (typeof req.body.id !== 'string') {
    console.warn('unexpected id type');
  }
  // ruleid: express-mongodb-operator-injection
  await db.collection('reviews').update({ _id: req.body.id }, { $set: { seen: true } });
  res.sendStatus(204);
});

app.post('/lookup-object', async (req, res) => {
  const email = req.body.email;
  if (typeof email === 'object') {
    // ruleid: express-mongodb-operator-injection
    return res.json(await User.findOne({ email }));
  }
  res.status(400).end();
});

app.post('/search-loose', async (req, res) => {
  const filter = looseSchema.parse(req.body);
  // ruleid: express-mongodb-operator-injection
  res.json(await db.collection('orders').find(filter).toArray());
});

app.post('/search-json', async (req, res) => {
  const filter = JSON.parse(req.body.filter);
  // ruleid: express-mongodb-operator-injection
  res.json(await db.collection('orders').find(filter).toArray());
});

app.post('/search-strict', async (req, res) => {
  const filter = searchSchema.parse(req.body);
  // ok: express-mongodb-operator-injection
  res.json(await db.collection('orders').find(filter).toArray());
});

app.post('/login-sanitized', async (req, res) => {
  // ok: express-mongodb-operator-injection
  const user = await User.findOne(mongoose.sanitizeFilter({ email: req.body.email }));
  res.json({ found: Boolean(user) });
});

app.post('/login-option', async (req, res) => {
  // ok: express-mongodb-operator-injection
  const user = await User.findOne({ email: req.body.email }, null, { sanitizeFilter: true });
  res.json({ found: Boolean(user) });
});

app.get('/orders/by-id', async (req, res) => {
  // ok: express-mongodb-operator-injection
  const order = await db.collection('orders').findOne({ _id: new mongoose.Types.ObjectId(req.query.id) });
  res.json(order);
});

app.get('/orders/since', async (req, res) => {
  // ok: express-mongodb-operator-injection
  const orders = await db.collection('orders').find({ createdAt: { $gte: new Date(req.query.since) } }).toArray();
  res.json(orders);
});

app.post('/login-compound', async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).end();
  // ok: express-mongodb-operator-injection
  const user = await User.findOne({ email });
  res.json({ found: Boolean(user && password) });
});

app.post('/login-compound-2', async (req, res) => {
  const email = req.body.email;
  if (!email || typeof email !== 'string') {
    return res.status(400).end();
  }
  // ok: express-mongodb-operator-injection
  res.json(await User.findOne({ email }));
});

app.get('/orders/valid-id', async (req, res) => {
  const id = req.query.id;
  if (!mongoose.isValidObjectId(id)) return res.status(400).end();
  // ok: express-mongodb-operator-injection
  res.json(await db.collection('orders').findOne({ _id: id }));
});

app.get('/orders/by-status', async (req, res) => {
  const status = req.query.status;
  if (!['open', 'closed'].includes(status)) return res.status(400).end();
  // ok: express-mongodb-operator-injection
  res.json(await db.collection('orders').find({ status }).toArray());
});

app.post('/orders/batch', async (req, res) => {
  // ok: express-mongodb-operator-injection
  res.json(await db.collection('orders').find({ _id: { $in: req.body.ids.map(String) } }).toArray());
});

app.post('/login-joi', async (req, res) => {
  // validate() returns the error instead of throwing, so ignoring it lets
  // { "email": { "$ne": null } } through.
  const { value } = loginSchema.validate(req.body);
  // ruleid: express-mongodb-operator-injection
  res.json(await User.findOne({ email: value.email }));
});

app.post('/login-joi-checked', async (req, res) => {
  const { value, error } = loginSchema.validate(req.body);
  if (error) return res.status(400).end();
  // ok: express-mongodb-operator-injection
  res.json(await User.findOne({ email: value.email }));
});

app.post('/login-inline-zod', async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  // ok: express-mongodb-operator-injection
  res.json(await User.findOne({ email }));
});

app.post('/orders/batch-arrow', async (req, res) => {
  // ok: express-mongodb-operator-injection
  res.json(await db.collection('orders').find({ _id: { $in: req.body.ids.map((id) => String(id)) } }).toArray());
});

app.post('/login-nested-guard', async (req, res) => {
  const password = req.body.password;
  if (typeof password !== 'string') {
    if (req.query.reject) return res.end();
  }
  // ruleid: express-mongodb-operator-injection
  res.json(await User.findOne({ password }));
});

app.post('/search-any', async (req, res) => {
  const filter = anySchema.parse(req.body);
  // ruleid: express-mongodb-operator-injection
  res.json(await db.collection('orders').find(filter).toArray());
});

app.post('/users/where-sibling', async (req, res) => {
  // ruleid: express-mongodb-operator-injection
  res.json(await User.findOne({ name: req.body.name, where: { archived: false } }));
});

app.post('/login-result-error', async (req, res) => {
  const result = loginSchema.validate(req.body);
  if (result.error) return res.status(400).end();
  // ok: express-mongodb-operator-injection
  res.json(await User.findOne({ email: result.value.email }));
});

app.post('/login-eq', async (req, res) => {
  // ok: express-mongodb-operator-injection
  res.json(await User.findOne({ email: { $eq: req.body.email } }));
});

app.post('/login-object-guard', async (req, res) => {
  const email = req.body.email;
  if (typeof email !== 'object') return res.status(400).end();
  // Known miss: any typeof check that returns counts as a guard, even one that
  // lets only objects through.
  // todoruleid: express-mongodb-operator-injection
  res.json(await User.findOne({ email }));
});

module.exports = app;
