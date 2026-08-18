import { ZodError } from 'zod';
import { badRequest } from '../lib/errors.js';

/**
 * Zod validation middleware. Validates and REPLACES `req.body`/`req.query`/
 * `req.params` with the parsed, stripped result — so controllers receive only
 * whitelisted, typed fields and mass-assignment via `{ ...req.body }` is no
 * longer possible (a caller can't smuggle in `vendor`, `status`, `isApproved`,
 * etc. because unknown keys are dropped by the schema).
 *
 * Usage: `router.post('/', validate({ body: createOrderSchema }), handler)`
 */
export const validate = (schemas) => (req, res, next) => {
  try {
    if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
    if (schemas.query) {
      // req.query is a read-only getter in Express 5; stash parsed values.
      req.validatedQuery = schemas.query.parse(req.query ?? {});
    }
    if (schemas.params) req.params = schemas.params.parse(req.params ?? {});
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return next(badRequest('Invalid request', details));
    }
    next(err);
  }
};

export default validate;
