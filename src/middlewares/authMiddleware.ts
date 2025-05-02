import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = 'your_jwt_secret_key';

// Extender el tipo Request para incluir la propiedad user
export interface AuthenticatedRequest extends Request {
  user?: string | JwtPayload;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Acceso denegado. Token no proporcionado.' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.status(403).json({ message: 'Token inválido.' });
      return;
    }

    req.user = user; // Agregar el usuario decodificado al objeto de la solicitud
    next();
  });
}