import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

const PUBLIC_KEY = process.env.JWT_PUBLIC_KEY as string;

export function requireUser(req: Request, res: Response, next: NextFunction) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  // ruleid: jsonwebtoken-verify-callback-ignores-error
  verify(token, PUBLIC_KEY, { algorithms: ['RS256'] }, (err, payload) => {
    (req as any).user = payload;
    next();
  });
}

export function requireUserChecked(req: Request, res: Response, next: NextFunction) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  // ok: jsonwebtoken-verify-callback-ignores-error
  verify(token, PUBLIC_KEY, { algorithms: ['RS256'] }, (err, payload) => {
    if (err) return res.status(401).end();
    (req as any).user = payload;
    next();
  });
}
