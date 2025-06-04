export type FieldType = 'futbol7' | 'futbol11';

export interface Field {
  id: number;
  name: string;
  type: FieldType; // 'futbol7' o 'futbol11'
  description?: string;
  address?: string;
  location?: string;
  pricePerHour: number;
  createdAt: Date;
  updatedAt: Date;
  users?: User[]; // Relación muchos a muchos con User
  reservations?: Reservation[]; // Relación uno a muchos con Reservation
  images?: string[]; // Nuevo campo para las rutas de imágenes
}