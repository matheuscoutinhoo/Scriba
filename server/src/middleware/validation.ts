import type { Request, Response, NextFunction } from 'express';
import { type ZodSchema, ZodError } from 'zod';

export function validateBody(schema: ZodSchema) {
   return (req: Request, res: Response, next: NextFunction): void => {
      try {
         req.body = schema.parse(req.body);
         next();
      } catch (error) {
         if (error instanceof ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
         }
         next(error);
      }
   };
}

export function validateQuery(schema: ZodSchema) {
   return (req: Request, res: Response, next: NextFunction): void => {
      try {
         const parsed = schema.parse(req.query);
         Object.assign(req.query, parsed);
         next();
      } catch (error) {
         if (error instanceof ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
         }
         next(error);
      }
   };
}
