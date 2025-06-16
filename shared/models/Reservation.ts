// Modelo de reserva de campo
import type { User } from './User';
import type { Field } from './Field';
import type { Payment } from './Payment';

export interface Reservation {
  id: number; // ID único de la reserva
  fieldId: number; // Campo reservado
  startTime: Date;
  endTime: Date;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
  // NUEVO: para reservas por slot y fecha
  date?: string; // Fecha de la reserva (YYYY-MM-DD)
  slot?: number; // Slot horario (1-4)
  users?: User[]; // Usuarios asociados a la reserva
  field?: Field; // Campo asociado
  payment?: Payment; // Pago asociado
}