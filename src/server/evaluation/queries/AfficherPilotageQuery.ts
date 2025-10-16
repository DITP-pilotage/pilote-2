import { PrismaPilote } from "@/server/db/PrismaPilote";

export class AfficherPilotageQuery {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async run() {
    return {};
  }
}
