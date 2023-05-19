import { Maille as MaillePrinsa } from '@prisma/client';
import { Maille } from '@/server/domain/maille/Maille.interface';


export const NOMS_MAILLES: Record<MaillePrinsa, Maille> = {
  NAT: 'nationale',
  DEPT: 'départementale',
  REG: 'régionale',
};

export const CODES_MAILLES: Record<Maille, MaillePrinsa> = {
  nationale: 'NAT',
  départementale: 'DEPT',
  régionale: 'REG',
};
