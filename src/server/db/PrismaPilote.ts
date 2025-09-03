import { PrismaClient } from "@prisma/client";

import { getPrisma } from "@/server/db/PrismaTransaction";

export class PrismaPilote {
  instance: PrismaClient | null;

  constructor() {
    this.instance = null;
  }

  getInstance() {
    if (!this.instance) {
      this.instance = new PrismaClient();
    }
    return getPrisma() || this.instance;
  }
}
