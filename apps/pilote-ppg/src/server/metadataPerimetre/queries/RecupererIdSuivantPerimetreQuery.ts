import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataPerimetre/module";

export class RecupererIdSuivantPerimetreQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<string> {
    const dernier = await this.prisma
      .getInstance()
      .metadata_perimetres.findFirst({ orderBy: { perimetre_id: "desc" } });
    const dernierNumero = dernier
      ? parseInt(dernier.perimetre_id.replace("PER-", ""), 10)
      : 0;
    return `PER-${String(dernierNumero + 1).padStart(3, "0")}`;
  }
}
