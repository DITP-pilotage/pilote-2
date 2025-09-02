import { DonneeIndicateur } from "@/server/chantiers/domain/DonneeIndicateur";
import { IndicateurPourExport } from "@/server/chantiers/domain/IndicateurPourExport";
import { HistoriqueIndicateurPourExport } from "@/server/chantiers/domain/HistoriqueIndicateurPourExport";
import {
  DetailsIndicateurs,
  DetailsIndicateurTerritoire,
} from "@/server/chantiers/domain/DetailsIndicateurs";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";

export interface IndicateurRepository {
  listerParIndicId({
    indicId,
    jalon,
  }: {
    indicId: string;
    jalon: number;
  }): Promise<DonneeIndicateur[]>;
  supprimerPropositionValeurAvancement({
    indicId,
    territoireCode,
    auteurModification,
  }: {
    indicId: string;
    territoireCode: string;
    auteurModification: string;
  }): Promise<void>;
  recupererPourExports(
    chantierIdsLecture: string,
    territoireCodesLecture: string[],
    jalon: number,
    estAvecCadrage: boolean,
  ): Promise<IndicateurPourExport[]>;
  récupérerHistoriquePourExports(
    chantierIdsLecture: string,
    territoireCodesLecture: string[],
    jalon: number,
  ): Promise<HistoriqueIndicateurPourExport[]>;
  recupererDetailsParChantierIdEtTerritoire(
    chantierId: string,
    territoireCodes: string[],
    jalon: number,
    dateDerniereExecutionDatajobs: Date,
  ): Promise<DetailsIndicateurs>;
  récupérerDétailsTerritoirePourUnIndicateur(
    indicateurId: string,
    habilitations: Habilitations,
    profil: ProfilCode,
    jalon: number,
    dateDerniereExecutionDatajobs: Date,
  ): Promise<DetailsIndicateurTerritoire>;
}
