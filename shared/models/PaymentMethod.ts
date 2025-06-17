// Modelo para métodos de pago guardados por usuario (solo tipo tarjeta, cifrado)
export interface PaymentMethod {
  id?: number; // ID autoincremental
  userId: number; // Usuario propietario del método
  type: 'card'; // Solo tarjetas soportadas
  encryptedData: string; // Datos cifrados de la tarjeta
  iv: string; // Vector de inicialización para el cifrado
  last4: string; // Últimos 4 dígitos de la tarjeta
  createdAt?: Date; // Fecha de creación del método de pago
  updatedAt?: Date; // Fecha de última actualización del método de pago
}
