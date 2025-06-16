// Modelo de pago asociado a una reserva
import type { Reservation } from './Reservation';

export interface Payment {
  id: number; // ID único del pago
  reservationId: number; // Reserva asociada
  amount: number; // Importe pagado
  paymentMethod: string; // Método de pago utilizado
  paidAt?: Date; // Fecha de pago
  createdAt: Date;
  updatedAt: Date;
  reservation?: Reservation; // Relación con la reserva
}