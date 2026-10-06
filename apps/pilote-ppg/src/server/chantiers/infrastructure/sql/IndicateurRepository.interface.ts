import { Indicateur } from "@/shared/indicateur/Indicateur.interface";
import { DétailsIndicateurs } from "@/shared/indicateur/DetailsIndicateur.interface";
import { Maille } from "@/shared/maille/Maille.interface";
import { CodeInsee } from "@/shared/territoire/Territoire.interface";
import { Chantier } from "@/shared/chantier/Chantier.interface";

export interface IndicateurRepository {
  récupérerParChantierId(chantierId: string): Promise<Indicateur[]>;
  récupérerGroupésParChantier(
    chantiersIds: Chantier["id"][],
  ): Promise<Record<string, Indicateur[]>>;
  récupérerDétailsGroupésParChantierEtParIndicateur(
    chantiersIds: Chantier["id"][],
    maille: Maille,
    codeInsee: CodeInsee,
    jalon: number,
    dateDerniereExecutionDatajobs: Date,
  ): Promise<Record<Chantier["id"], DétailsIndicateurs>>;
  recupererListeIndicateursPrisEnCompteDansCalculAvancementSurAuMoinsUnTerritoire(
    chantiersIds: Chantier["id"][],
  ): Promise<Indicateur["id"][]>;
}
