import { PrismaClient } from '@prisma/client';

export class PrismaPilote {
  instance: PrismaClient | null;

  constructor() {
    this.instance = null;
  }

  getInstance() {
    if (!this.instance) {
      this.instance = new PrismaClient();
    }
    return this.instance;
  }
}
