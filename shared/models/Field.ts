// Modelo de campo de fútbol (Field)
import type { User } from './User';
import type { Reservation } from './Reservation';

export type FieldType = 'futbol7' | 'futbol11';

export interface Field {
  id: number; // ID único del campo
  name: string; // Nombre del campo
  type: FieldType; // Tipo de campo: futbol7 o futbol11
  description?: string;
  address?: string;
  location?: string;
  pricePerHour: number; // Precio por hora
  createdAt: Date;
  updatedAt: Date;
  users?: User[]; // Relación muchos a muchos con usuarios
  reservations?: Reservation[]; // Relación uno a muchos con reservas
  images?: string[]; // Rutas de imágenes asociadas
}