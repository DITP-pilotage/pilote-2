import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataChantier/module";
import {
  Maille,
  calculerMaillesApplicablesIndicateur,
} from "@/server/metadataChantier/domain/maille";

export interface IndicateurPonderation {
  indicId: string;
  indicNom: string;
  maillesApplicables: Maille[];
  poidsPourcentDept: number | null;
  poidsPourcentReg: number | null;
  poidsPourcentNat: number | null;
}

export class RecupererIndicateursPonderationsChantierQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run({
    chantierId,
  }: {
    chantierId: string;
  }): Promise<IndicateurPonderation[]> {
    const instance = this.prisma.getInstance();

    const indicateurs = await instance.metadata_indicateurs_hidden.findMany({
      where: { indic_parent_ch: chantierId },
      orderBy: { indic_nom: "asc" },
      include: { complementaire: true, parametrage: true },
    });

    return indicateurs.map((indicateur) => ({
      indicId: indicateur.indic_id,
      indicNom: indicateur.indic_nom,
      maillesApplicables: calculerMaillesApplicablesIndicateur(
        indicateur.complementaire?.indic_territorialise ?? false,
        indicateur.complementaire?.mailles ?? null,
      ),
      poidsPourcentDept:
        indicateur.parametrage?.poids_pourcent_dept_declaree ?? null,
      poidsPourcentReg:
        indicateur.parametrage?.poids_pourcent_reg_declaree ?? null,
      poidsPourcentNat:
        indicateur.parametrage?.poids_pourcent_nat_declaree ?? null,
    }));
  }
}
