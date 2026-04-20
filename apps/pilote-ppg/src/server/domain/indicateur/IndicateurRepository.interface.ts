import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { DétailsIndicateurs } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";
import { CodeInsee } from "@/server/domain/territoire/Territoire.interface";
import Chantier from "@/server/domain/chantier/Chantier.interface";

export default interface IndicateurRepository {
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
