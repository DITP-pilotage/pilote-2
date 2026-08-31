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
    });
    if (indicateurs.length === 0) return [];

    const indicIds = indicateurs.map((indicateur) => indicateur.indic_id);
    const [complémentaires, parametrages] = await Promise.all([
      instance.metadata_indicateurs_complementaire.findMany({
        where: { indic_id: { in: indicIds } },
      }),
      instance.metadata_parametrage_indicateurs.findMany({
        where: { indic_id: { in: indicIds } },
      }),
    ]);
    const complémentaireParId = new Map(
      complémentaires.map((complémentaire) => [
        complémentaire.indic_id,
        complémentaire,
      ]),
    );
    const parametrageParId = new Map(
      parametrages.map((parametrage) => [parametrage.indic_id, parametrage]),
    );

    return indicateurs.map((indicateur) => {
      const complémentaire = complémentaireParId.get(indicateur.indic_id);
      const parametrage = parametrageParId.get(indicateur.indic_id);
      return {
        indicId: indicateur.indic_id,
        indicNom: indicateur.indic_nom,
        maillesApplicables: calculerMaillesApplicablesIndicateur(
          complémentaire?.indic_territorialise ?? false,
          complémentaire?.mailles ?? null,
        ),
        poidsPourcentDept: parametrage?.poids_pourcent_dept_declaree ?? null,
        poidsPourcentReg: parametrage?.poids_pourcent_reg_declaree ?? null,
        poidsPourcentNat: parametrage?.poids_pourcent_nat_declaree ?? null,
      };
    });
  }
}
