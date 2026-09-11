import { PrismaClient } from "@prisma/client";

import { creerAdapter } from "@/server/db/adapter";

import { getPrisma } from "@/server/db/PrismaTransaction";

export class PrismaPilote {
  instance: PrismaClient | null;

  constructor() {
    this.instance = null;
  }

  getInstance() {
    if (!this.instance) {
      this.instance = new PrismaClient({ adapter: creerAdapter() });
    }
    return getPrisma() || this.instance;
  }
}
