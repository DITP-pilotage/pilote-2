import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataPorteur/module";

export class RecupererIdSuivantPorteurQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<string> {
    const porteurs = await this.prisma
      .getInstance()
      .metadata_porteurs.findMany({ select: { porteur_id: true } });
    const maxId = porteurs.reduce((max, p) => {
      const n = parseInt(p.porteur_id, 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    return String(maxId + 1);
  }
}
