import { PrismaClient } from '@prisma/client';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';

export class TerritoireSQLRepository implements TerritoireRepository { 
  constructor(private _prisma: PrismaClient) {}

  récupérerTous() {
    return this._prisma.territoire.findMany();
  }
}
