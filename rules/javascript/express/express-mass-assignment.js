const express = require('express');
const _ = require('lodash');
const { z } = require('zod');
const { matchedData } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const User = require('./models/user');
const Order = require('./models/order');
const Joi = require('joi');
const { Invoice } = require('./sequelize-models');

const noteSchema = Joi.object({ text: Joi.string().max(200) });
const yup = require('yup');
const yupSignupSchema = yup.object({ name: yup.string(), email: yup.string().email() });
const signupSchema = Joi.object({ name: Joi.string(), email: Joi.string().email() });
const looseObjectSchema = z.looseObject({ name: z.string() });
const identity = { parse: (x) => x };
const openProfileSchema = z.object({ name: z.string() }).passthrough();

const prisma = new PrismaClient();
const router = express.Router();

const profileSchema = z.object({ name: z.string(), bio: z.string().max(500) });

router.post('/users', async (req, res) => {
  // ruleid: express-mass-assignment
  const user = await User.create(req.body);
  res.status(201).json(user);
});

router.put('/users/:id', async (req, res) => {
  // ruleid: express-mass-assignment
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(user);
});

router.patch('/orders/:id', async function (req, res) {
  const changes = req.body;
  // ruleid: express-mass-assignment
  await Order.updateOne({ _id: req.params.id, owner: req.user.id }, changes);
  res.sendStatus(204);
});

router.post('/signup', async (req, res) => {
  // ruleid: express-mass-assignment
  const user = new User({ ...req.body, createdAt: new Date() });
  await user.save();
  res.status(201).end();
});

router.patch('/me', async (req, res) => {
  const user = await User.findById(req.user.id);
  // ruleid: express-mass-assignment
  Object.assign(user, req.body);
  await user.save();
  res.json(user);
});

router.post('/accounts', async (req, res) => {
  // ruleid: express-mass-assignment
  const account = await prisma.account.create({ data: req.body });
  res.json(account);
});

router.post('/users/safe', async (req, res) => {
  const { name, email } = req.body;
  // ok: express-mass-assignment
  const user = await User.create({ name, email });
  res.status(201).json(user);
});

router.put('/users/:id/name', async (req, res) => {
  // ok: express-mass-assignment
  await User.updateOne({ _id: req.user.id }, { name: req.body.name });
  res.sendStatus(204);
});

router.patch('/profile', async (req, res) => {
  const data = profileSchema.parse(req.body);
  // ok: express-mass-assignment
  await prisma.profile.update({ where: { userId: req.user.id }, data });
  res.sendStatus(204);
});

router.patch('/settings', async (req, res) => {
  // ok: express-mass-assignment
  await User.findByIdAndUpdate(req.user.id, _.pick(req.body, ['theme', 'locale']));
  res.sendStatus(204);
});

router.post('/addresses', async (req, res) => {
  const data = matchedData(req);
  // ok: express-mass-assignment
  await prisma.address.create({ data });
  res.sendStatus(201);
});

router.post('/webhooks/stripe', async (req, res) => {
  // ok: express-mass-assignment
  await stripe.customers.create(req.body);
  res.sendStatus(200);
});

router.post('/tenants/:id/members', async (req, res) => {
  // ruleid: express-mass-assignment
  const member = await prisma.member.create({ data: { ...req.body, tenantId: req.params.id } });
  res.json(member);
});

router.put('/invoices/:id', async (req, res) => {
  // ok: express-mass-assignment
  await Invoice.update(req.body, { where: { id: req.params.id, ownerId: req.user.id }, fields: ['memo', 'dueDate'] });
  res.sendStatus(204);
});

router.post('/notes', async (req, res) => {
  const note = await noteSchema.validateAsync(req.body);
  // ok: express-mass-assignment
  await prisma.note.create({ data: note });
  res.sendStatus(201);
});

router.patch('/users/:id/set', async (req, res) => {
  // ruleid: express-mass-assignment
  await User.updateOne({ _id: req.user.id }, { $set: req.body });
  res.sendStatus(204);
});

router.patch('/users/:id/set-name', async (req, res) => {
  // ok: express-mass-assignment
  await User.updateOne({ _id: req.user.id }, { $set: { name: String(req.body.name) } });
  res.sendStatus(204);
});

router.patch('/profile-open', async (req, res) => {
  const data = openProfileSchema.parse(req.body);
  // ruleid: express-mass-assignment
  await prisma.profile.update({ where: { userId: req.user.id }, data });
  res.sendStatus(204);
});

router.post('/notes-open', async (req, res) => {
  const note = await noteSchema.validateAsync(req.body, { allowUnknown: true });
  // ruleid: express-mass-assignment
  await prisma.note.create({ data: note });
  res.sendStatus(201);
});

router.post('/signup-joi', async (req, res) => {
  const { value, error } = signupSchema.validate(req.body);
  if (error) return res.status(400).end();
  // ok: express-mass-assignment
  await User.create(value);
  res.sendStatus(201);
});

router.post('/signup-yup', async (req, res) => {
  const value = await yupSignupSchema.validate(req.body, { stripUnknown: true });
  // ok: express-mass-assignment
  await User.create(value);
  res.sendStatus(201);
});

router.post('/signup-yup-unsafe', async (req, res) => {
  const value = await yupSignupSchema.validate(req.body);
  // ruleid: express-mass-assignment
  await User.create(value);
  res.sendStatus(201);
});

router.post('/profile-loose-object', async (req, res) => {
  const data = looseObjectSchema.parse(req.body);
  // ruleid: express-mass-assignment
  await User.create(data);
  res.sendStatus(201);
});

router.post('/profile-identity', async (req, res) => {
  const data = identity.parse(req.body);
  // ruleid: express-mass-assignment
  await User.create(data);
  res.sendStatus(201);
});

router.post('/signup-joi-ignored', async (req, res) => {
  const { value } = signupSchema.validate(req.body);
  // ruleid: express-mass-assignment
  await User.create(value);
  res.sendStatus(201);
});

router.post('/signup-inline-zod', async (req, res) => {
  const data = z.object({ name: z.string(), email: z.string().email() }).strict().parse(req.body);
  // ok: express-mass-assignment
  await User.create(data);
  res.sendStatus(201);
});

router.put('/invoices/:id/instance', async (req, res) => {
  const invoice = await Invoice.findByPk(req.params.id);
  // ruleid: express-mass-assignment
  await invoice.update(req.body);
  res.sendStatus(204);
});

router.post('/users/nested', async (req, res) => {
  // A nested object is still the whole client payload. The field sanitizer hides it.
  // todoruleid: express-mass-assignment
  await User.create(req.body.user);
  res.sendStatus(201);
});

router.post('/users/rest', async (req, res) => {
  const { password, ...rest } = req.body;
  // Semgrep drops taint on a ...rest binding, so this is missed.
  // todoruleid: express-mass-assignment
  await User.create(rest);
  res.sendStatus(201);
});

module.exports = router;
