import type { Request, Response, NextFunction } from 'express';
import { type ZodSchema, ZodError } from 'zod';

function sanitizeZodErrors(errors: ZodError['errors']): { field: string; message: string }[] {
   return errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
   }));
}

type RequestSource = 'body' | 'query';

export function validate(schema: ZodSchema, source: RequestSource) {
   return (req: Request, res: Response, next: NextFunction): void => {
      try {
         const parsed = schema.parse(req[source]);
         if (source === 'body') {
            req.body = parsed;
         } else {
            Object.assign(req.query, parsed);
         }
         next();
      } catch (error) {
         if (error instanceof ZodError) {
            res.status(400).json({ error: 'Validation failed', details: sanitizeZodErrors(error.errors) });
            return;
         }
         next(error);
      }
   };
}

/** @deprecated Use validate(schema, 'body') instead */
export const validateBody = (schema: ZodSchema) => validate(schema, 'body');
/** @deprecated Use validate(schema, 'query') instead */
export const validateQuery = (schema: ZodSchema) => validate(schema, 'query');
