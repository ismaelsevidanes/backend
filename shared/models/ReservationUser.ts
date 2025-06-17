// Modelo para la relación usuario-reserva (tabla intermedia)
export interface ReservationUser {
  reservationId: number; // ID de la reserva
  userId: number; // ID del usuario
  quantity: number; // Plazas reservadas por el usuario
}
