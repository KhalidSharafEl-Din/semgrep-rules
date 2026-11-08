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

function logsOnly(req, res, next) {
  // ruleid: jsonwebtoken-verify-callback-ignores-error
  jwt.verify(req.cookies.session, PUBLIC_KEY, (err, payload) => {
    console.log(err);
    req.user = payload;
    next();
  });
}

function ifElse(req, res, next) {
  // ok: jsonwebtoken-verify-callback-ignores-error
  jwt.verify(req.cookies.session, PUBLIC_KEY, (err, payload) => {
    if (err) {
      res.status(401).end();
    } else {
      req.user = payload;
      next();
    }
  });
}

function logsInBranch(req, res, next) {
  // ruleid: jsonwebtoken-verify-callback-ignores-error
  jwt.verify(req.cookies.session, PUBLIC_KEY, (err, payload) => {
    if (err) console.log(err);
    req.user = payload;
    next();
  });
}

function payloadLogOnly(req, res, next) {
  // ruleid: jsonwebtoken-verify-callback-ignores-error
  jwt.verify(req.cookies.session, PUBLIC_KEY, (err, payload) => {
    if (!payload) console.log('missing payload');
    req.user = payload;
    next();
  });
}

function forwardsToNext(req, res, next) {
  // ok: jsonwebtoken-verify-callback-ignores-error
  jwt.verify(req.cookies.session, PUBLIC_KEY, (err, payload) => {
    req.user = payload;
    return next(err);
  });
}

function nodeCallback(token, done) {
  // ok: jsonwebtoken-verify-callback-ignores-error
  jwt.verify(token, PUBLIC_KEY, (err, decoded) => done(err, decoded));
}

function refreshSession(req, res, next) {
  // ok: jsonwebtoken-verify-callback-ignores-error
  jwt.verify(req.cookies.session, PUBLIC_KEY, (err, decoded) => {
    if (err === null && decoded) {
      res.cookie('session', req.cookies.session);
    }
  });
  next();
}

function expiredOnly(req, res, next) {
  // A forged token raises JsonWebTokenError, skips this branch and reaches next().
  // ruleid: jsonwebtoken-verify-callback-ignores-error
  jwt.verify(req.cookies.session, PUBLIC_KEY, (err, payload) => {
    if (err && err.name === 'TokenExpiredError') return res.status(401).json({ error: 'expired' });
    req.user = payload;
    next();
  });
}

function notNull(req, res, next) {
  // ok: jsonwebtoken-verify-callback-ignores-error
  jwt.verify(req.cookies.session, PUBLIC_KEY, (err, payload) => {
    if (err !== null) return res.status(401).end();
    req.user = payload;
    next();
  });
}

function expiredOnlyForward(req, res, next) {
  // ruleid: jsonwebtoken-verify-callback-ignores-error
  jwt.verify(req.cookies.session, PUBLIC_KEY, (err, payload) => {
    if (err && err.name === 'TokenExpiredError') return next(err);
    req.user = payload;
    next();
  });
}

function successBranchThenNext(req, res, next) {
  // Known miss: the success branch is accepted even though next() runs either way.
  // todoruleid: jsonwebtoken-verify-callback-ignores-error
  jwt.verify(req.cookies.session, PUBLIC_KEY, (err, payload) => {
    if (!err) {
      req.user = payload;
    }
    next();
  });
}

function expiredOnlyTernary(req, res, next) {
  // Known miss: the forward exemption also matches next(err) inside an arrow's
  // expression body, so this expired-only ternary is not reported.
  // todoruleid: jsonwebtoken-verify-callback-ignores-error
  jwt.verify(req.cookies.session, PUBLIC_KEY, (err, p) => (err && err.name === 'TokenExpiredError' ? next(err) : next()));
}

app.get('/me', requireUser, (req, res) => res.json(req.user));
app.get('/session', sessionInfo);
app.get('/admin', requireAdmin, (req, res) => res.send('ok'));

module.exports = { expiredOnlyTernary, expiredOnlyForward, successBranchThenNext, expiredOnly, notNull, refreshSession, logsInBranch, payloadLogOnly, forwardsToNext, nodeCallback, logsOnly, ifElse, requireUserChecked, forwardError, payloadGuard, synchronous, checkToken };
