import { Request, Response, NextFunction } from 'express';

// Blacklist de tokens JWT para invalidar sesiones (logout, etc)
const jwtBlacklist = new Set<string>();

// Middleware para comprobar si el token está en la blacklist
export function checkJwtBlacklist(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token && jwtBlacklist.has(token)) {
    res.status(401).json({ message: 'Token inválido o expirado (blacklist)' });
    return;
  }
  next();
}

// Función para añadir un token a la blacklist (por ejemplo, en logout)
export function addTokenToBlacklist(token: string) {
  jwtBlacklist.add(token);
}

export { jwtBlacklist };
