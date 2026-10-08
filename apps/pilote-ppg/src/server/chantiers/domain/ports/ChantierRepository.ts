import { DonneeChantier } from "@/server/chantiers/domain/DonneeChantier";
import { OptionsExport } from "@/server/chantiers/usecases/OptionsExport";
import { ChantierPourExport } from "@/server/chantiers/domain/ChantierPourExport";
import { Chantier } from "@/shared/chantier/Chantier.interface";
import { RapportDirecteurProjetChantierInformation } from "@/server/chantiers/domain/PropositionValeurAvancementChantierInformation";
import { ProfilCode } from "@/shared/utilisateur/Utilisateur.interface";
import { FiltreQueryParams } from "@/server/chantiers/app/contrats/FiltreQueryParams";
import {
  PrismaChantier,
  PrismaChantierPourTerritoire,
} from "@/server/chantiers/domain/PrismaChantier";
import { Meteo } from "@/shared/meteo/Meteo.interface";
import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";

export interface ChantierRepository {
  modifierMeteo(
    chantierId: string,
    territoireCode: string,
    meteo: Meteo,
  ): Promise<void>;
  récupérerDonneesChantier(
    chantierId: string,
    territoireCodesLecture: string[],
  ): Promise<DonneeChantier[]>;
  recupererLesEntreesDUnChantier(
    id: string,
    habilitations: Habilitations,
    profil: ProfilCode,
    jalon: number,
  ): Promise<PrismaChantier>;
  recupererPourExports(
    chantierId: string,
    territoireCodesLecture: string[],
    optionsExport: OptionsExport,
    jalonSelectionne: number,
    jalonParDefaut: number,
  ): Promise<ChantierPourExport[] | null>;
  récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(
    chantierIds: string[],
    optionsExport: OptionsExport,
  ): Promise<Chantier["id"][]>;
  recupererPropositionValeurAvancementChantierInformationParIndicId({
    indicId,
  }: {
    indicId: string;
  }): Promise<RapportDirecteurProjetChantierInformation>;
  recupererChantierInformationsParIds({
    listeChantiersIds,
  }: {
    listeChantiersIds: string[];
  }): Promise<RapportDirecteurProjetChantierInformation[]>;
  récupérerLesEntréesDeTousLesChantiersHabilités(
    chantiersLectureIds: string[],
    territoiresLectureIds: string[],
    profil: ProfilCode,
    filtres: FiltreQueryParams,
    territoireCode: string,
    jalons: number[],
  ): Promise<PrismaChantier[]>;
  listChantiersHabilitesByTerritoire(
    chantiersLectureIds: string[],
    territoiresLectureIds: string[],
    profil: ProfilCode,
    filtres: FiltreQueryParams,
    territoireCode: string,
    jalon: number,
    jalonParDefaut: number,
  ): Promise<PrismaChantierPourTerritoire[]>;
}
