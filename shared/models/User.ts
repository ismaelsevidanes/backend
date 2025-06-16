// Modelo de usuario para la base de datos y la lógica de negocio
import type { Field } from './Field';
import type { Reservation } from './Reservation';

export interface User {
  id: number; // ID único del usuario
  name: string; // Nombre del usuario
  email: string; // Email del usuario
  password: string; // Hash de la contraseña
  createdAt: Date;
  updatedAt: Date;
  fields?: Field[]; // Relación muchos a muchos con campos
  reservations?: Reservation[]; // Relación muchos a muchos con reservas
}