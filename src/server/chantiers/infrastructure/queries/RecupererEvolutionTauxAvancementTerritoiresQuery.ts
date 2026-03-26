import type { Inject } from "@/server/chantiers/module";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";

export type EvolutionTAIndicateurTerritoire = {
  territoireCode: string;
  historiquesValeurs: { date: string; valeur: number }[];
  listeValeursCiblesAnnuelles: {
    annee: number;
    valeurCible: number | null;
  }[];
};

export class RecupererEvolutionTauxAvancementTerritoiresQuery {
  constructor(
    private readonly deps: Inject<"listerDetailsIndicateurTerritoireUseCaseV2">,
  ) {}

  async execute(params: {
    indicateurId: string;
    chantierId: string;
    jalon: number;
    habilitations: Habilitations;
    profil: ProfilCode;
  }): Promise<EvolutionTAIndicateurTerritoire[]> {
    const result =
      await this.deps.listerDetailsIndicateurTerritoireUseCaseV2.run(
        [params.indicateurId],
        params.chantierId,
        params.habilitations,
        params.profil,
        params.jalon,
      );

    const details = result[params.indicateurId] ?? {};

    return Object.entries(details).map(([territoireCode, detail]) => ({
      territoireCode,
      historiquesValeurs: detail.historiquesValeurs
        .filter((entry) => entry.taux_avancement_jalon != null)
        .map((entry) => ({
          date: entry.date,
          valeur: entry.taux_avancement_jalon!,
        })),
      listeValeursCiblesAnnuelles: [],
    }));
  }
}
