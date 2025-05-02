export interface Field {
  id: number;
  name: string;
  description?: string;
  directions?: string;
  location?: string;
  pricePerHour: number;
  createdAt: Date;
  updatedAt: Date;
  users?: User[]; // Relación muchos a muchos con User
  reservations?: Reservation[]; // Relación uno a muchos con Reservation
}