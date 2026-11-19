import { randomBytes } from 'node:crypto';

export const generateMedicalRecordNumber = (): string => {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `RC-${date}-${randomBytes(3).toString('hex').toUpperCase()}`;
};
