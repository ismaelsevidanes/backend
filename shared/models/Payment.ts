import type { Reservation } from './Reservation';

export interface Payment {
  id: number;
  reservationId: number;
  amount: number;
  paymentMethod: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  reservation?: Reservation; // Relación uno a uno con Reservation
}