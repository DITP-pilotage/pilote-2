import { Maille as MaillePrisma } from '@prisma/client';
import { Maille } from '@/server/domain/maille/Maille.interface';


export const NOMS_MAILLES: Record<MaillePrisma, Maille> = {
  NAT: 'nationale',
  DEPT: 'departementale',
  REG: 'regionale',
};

export const CODES_MAILLES: Record<Maille, MaillePrisma> = {
  nationale: 'NAT',
  departementale: 'DEPT',
  regionale: 'REG',
};
