import { Indicateur } from "@/server/fiche-conducteur/domain/Indicateur";

export interface IndicateurRepository {
  récupérerIndicImpactParChantierId: (
    chantierId: string,
    jalon: number,
  ) => Promise<Indicateur[]>;
}
