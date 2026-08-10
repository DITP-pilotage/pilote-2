import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataChantier/module";
import {
  MetadataChantierContrat,
  presenterEnMetadataChantierContrat,
} from "@/server/app/contrats/MetadataChantierContrat";

export class ListerChantiersQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<MetadataChantierContrat[]> {
    const chantiers = await this.prisma
      .getInstance()
      .metadata_chantiers.findMany({ orderBy: { chantier_id: "asc" } });
    return chantiers.map(presenterEnMetadataChantierContrat);
  }
}
