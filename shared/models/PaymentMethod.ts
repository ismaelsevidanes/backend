export interface PaymentMethod {
  id?: number;
  userId: number;
  type: 'card';
  encryptedData: string;
  iv: string;
  last4: string;
  createdAt?: Date;
  updatedAt?: Date;
}
