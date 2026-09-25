import type { Inject } from "@/server/suivi-indicateurs/module";
import type { TerritoireNonAJour } from "@/server/suivi-indicateurs/domain/IndicateursAMettreAJour";
import {
  filtreIndicateurTerritoirePublie,
  filtreNonAJour,
} from "./ListerIndicateursNonAJourQuery";

const comparerParRetard = (
  gauche: TerritoireNonAJour,
  droite: TerritoireNonAJour,
) => {
  if (gauche.retardJours === droite.retardJours) {
    return gauche.nom.localeCompare(droite.nom);
  }
  if (gauche.retardJours === null) return 1;
  if (droite.retardJours === null) return -1;
  return droite.retardJours - gauche.retardJours;
};

export class ListerTerritoiresNonAJourQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async run(
    indicateurId: string,
    chantierIds: string[],
  ): Promise<TerritoireNonAJour[]> {
    const lignes = await this.deps.prisma
      .getInstance()
      .indicateur_territoire.findMany({
        where: {
          AND: [
            { id: indicateurId },
            filtreIndicateurTerritoirePublie(chantierIds),
            filtreNonAJour,
          ],
        },
        select: {
          territoire_code: true,
          maille: true,
          date_valeur_actuelle_mandat: true,
          prochaine_date_maj: true,
          prochaine_date_maj_jours: true,
          territoire: { select: { nom: true } },
        },
      });

    return lignes
      .map((ligne) => ({
        code: ligne.territoire_code,
        nom: ligne.territoire.nom,
        maille: ligne.maille,
        dateDerniereValeur:
          ligne.date_valeur_actuelle_mandat?.toISOString() ?? null,
        dateMajAttendue: ligne.prochaine_date_maj?.toISOString() ?? null,
        retardJours:
          ligne.prochaine_date_maj_jours === null
            ? null
            : -ligne.prochaine_date_maj_jours,
      }))
      .sort(comparerParRetard);
  }
}
