export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  fields?: Field[]; // Relación muchos a muchos con Field
  reservations?: Reservation[]; // Relación muchos a muchos con Reservation
}