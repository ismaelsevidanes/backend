import type { User } from './User';
import type { Field } from './Field';
import type { Payment } from './Payment';

export interface Reservation {
  id: number;
  fieldId: number;
  startTime: Date;
  endTime: Date;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
  users?: User[]; // Relación muchos a muchos con User
  field?: Field; // Relación uno a muchos con Field
  payment?: Payment; // Relación uno a uno con Payment
}