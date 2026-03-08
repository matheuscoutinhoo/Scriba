import type { Request, Response, NextFunction } from 'express';
import { DEFAULT_USER_ID } from '../lib/constants.js';

declare global {
   namespace Express {
      interface Request {
         userId: string;
      }
   }
}

export function extractUserId(req: Request, _res: Response, next: NextFunction): void {
   req.userId = DEFAULT_USER_ID;
   next();
}
