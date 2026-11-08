const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
const PUBLIC_KEY = process.env.JWT_PUBLIC_KEY;

function requireUser(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  // ruleid: jsonwebtoken-verify-callback-ignores-error
  jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] }, (err, payload) => {
    req.user = payload;
    next();
  });
}

function sessionInfo(req, res) {
  // ruleid: jsonwebtoken-verify-callback-ignores-error
  jwt.verify(req.cookies.session, PUBLIC_KEY, function (error, claims) {
    res.json({ loggedIn: true, claims });
  });
}

// ruleid: jsonwebtoken-verify-callback-ignores-error
const checkToken = (token, done) => jwt.verify(token, PUBLIC_KEY, (_err, decoded) => done(decoded));

function requireUserChecked(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  // ok: jsonwebtoken-verify-callback-ignores-error
  jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] }, (err, payload) => {
    if (err) {
      return res.status(401).json({ error: 'invalid token' });
    }
    req.user = payload;
    next();
  });
}

function forwardError(req, res, next) {
  // ok: jsonwebtoken-verify-callback-ignores-error
  jwt.verify(req.cookies.session, PUBLIC_KEY, (err, claims) => (err ? next(err) : next()));
}

function payloadGuard(req, res, next) {
  // ok: jsonwebtoken-verify-callback-ignores-error
  jwt.verify(req.cookies.session, PUBLIC_KEY, (_err, decoded) => {
    if (!decoded) return res.status(401).end();
    req.user = decoded;
    next();
  });
}

function requireAdmin(req, res, next) {
  // ok: jsonwebtoken-verify-callback-ignores-error
  jwt.verify(req.cookies.session, PUBLIC_KEY, function (error, claims) {
    if (claims && claims.role === 'admin') {
      return next();
    }
    res.status(403).end();
  });
}

function synchronous(req) {
  // ok: jsonwebtoken-verify-callback-ignores-error
  return jwt.verify(req.cookies.session, PUBLIC_KEY, { algorithms: ['RS256'] });
}

app.get('/me', requireUser, (req, res) => res.json(req.user));
app.get('/session', sessionInfo);
app.get('/admin', requireAdmin, (req, res) => res.send('ok'));

module.exports = { requireUserChecked, forwardError, payloadGuard, synchronous, checkToken };
