import { Maille } from '@/server/domain/maille/Maille.interface';

export const NOMS_MAILLES: Record<string, Maille> = {
  NAT: 'nationale',
  DEPT: 'départementale',
  REG: 'régionale',
};

export const CODES_MAILLES: Record<Maille, string> = {
  nationale: 'NAT',
  départementale: 'DEPT',
  régionale: 'REG',
};
