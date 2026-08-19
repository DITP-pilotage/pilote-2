import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataChantier/module";

export interface PorteurOption {
  id: string;
  label: string;
}

type PorteurType = "MIN" | "DAC";

export class ListerPorteursQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run({ type }: { type?: PorteurType } = {}): Promise<PorteurOption[]> {
    const porteurs = await this.prisma
      .getInstance()
      .metadata_porteurs.findMany({
        where: type ? { porteur_type_short: type } : undefined,
        orderBy: { porteur_id: "asc" },
      });
    return porteurs.map(toApiModel);
  }
}

function toApiModel(p: {
  porteur_id: string;
  porteur_name: string;
}): PorteurOption {
  return { id: p.porteur_id, label: p.porteur_name };
}
