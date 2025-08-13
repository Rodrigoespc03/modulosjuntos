import { Request, Response, NextFunction, RequestHandler } from 'express';

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Helper para manejar arrays de middleware en las rutas
 */
export function handleMiddlewareArray(middlewareArray: RequestHandler[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    let index = 0;
    
    function executeNext() {
      if (index < middlewareArray.length) {
        const middleware = middlewareArray[index];
        index++;
        middleware(req, res, executeNext);
      } else {
        next();
      }
    }
    
    executeNext();
  };
}

export default asyncHandler; 