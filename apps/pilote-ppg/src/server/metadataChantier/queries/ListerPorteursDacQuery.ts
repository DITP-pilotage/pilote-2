import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataChantier/module";
import { PorteurOption } from "@/server/metadataChantier/queries/ListerPorteursMinQuery";

export class ListerPorteursDacQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<PorteurOption[]> {
    const porteurs = await this.prisma
      .getInstance()
      .metadata_porteurs.findMany({
        where: { porteur_type_short: "DAC" },
        orderBy: { porteur_id: "asc" },
      });
    return porteurs.map((p) => ({
      id: p.porteur_id,
      label: p.porteur_name_short ?? p.porteur_short,
    }));
  }
}
