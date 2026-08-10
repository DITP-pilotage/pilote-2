import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataChantier/module";
import {
  MetadataChantierContrat,
  presenterEnMetadataChantierContrat,
} from "@/server/app/contrats/MetadataChantierContrat";

export class RecupererChantierQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run({
    chantierId,
  }: {
    chantierId: string;
  }): Promise<MetadataChantierContrat> {
    const chantier = await this.prisma
      .getInstance()
      .metadata_chantiers.findUniqueOrThrow({
        where: { chantier_id: chantierId },
      });
    return presenterEnMetadataChantierContrat(chantier);
  }
}
