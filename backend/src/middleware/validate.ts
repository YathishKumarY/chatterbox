import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors.js';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors
          .map(e => {
            const path = e.path.filter(p => p !== 'body' && p !== 'query' && p !== 'params').join('.');
            return path ? `${path}: ${e.message}` : e.message;
          })
          .join('; ');
        next(new ValidationError(message));
      } else {
        next(error);
      }
    }
  };
}
