import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

function formatZodErrors(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }
  return errors;
}

/**
 * Validate req.body against a Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: formatZodErrors(result.error),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validate req.query against a Zod schema
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(422).json({
        success: false,
        message: 'Query validation failed',
        errors: formatZodErrors(result.error),
      });
      return;
    }
    (req as any).validatedQuery = result.data;
    next();
  };
}

/**
 * Validate req.params against a Zod schema
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      res.status(422).json({
        success: false,
        message: 'Parameter validation failed',
        errors: formatZodErrors(result.error),
      });
      return;
    }
    next();
  };
}
