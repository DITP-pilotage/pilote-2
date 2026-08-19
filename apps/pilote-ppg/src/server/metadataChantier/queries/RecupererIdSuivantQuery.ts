import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataChantier/module";

export class RecupererIdSuivantQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<string> {
    const dernierChantier = await this.prisma
      .getInstance()
      .metadata_chantiers.findFirst({ orderBy: { chantier_id: "desc" } });
    const dernierNumero = dernierChantier
      ? parseInt(dernierChantier.chantier_id.replace("CH-", ""), 10)
      : 0;
    return `CH-${String(dernierNumero + 1).padStart(3, "0")}`;
  }
}
