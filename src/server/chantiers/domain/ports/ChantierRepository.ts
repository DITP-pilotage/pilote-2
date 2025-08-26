import { DonneeChantier } from "@/server/chantiers/domain/DonneeChantier";
import { OptionsExport } from "@/server/usecase/chantier/OptionsExport";
import { ChantierPourExport } from "@/server/chantiers/domain/ChantierPourExport";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import { PropositionValeurAvancementChantierInformation } from "@/server/chantiers/domain/PropositionValeurAvancementChantierInformation";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";
import { FiltreQueryParams } from "@/server/chantiers/app/contrats/FiltreQueryParams";
import { PrismaChantier } from "@/server/chantiers/domain/PrismaChantier";

export interface ChantierRepository {
  récupérerDonneesChantier(
    chantierId: string,
    territoireCodesLecture: string[],
  ): Promise<DonneeChantier[]>;
  recupererPourExports(
    chantierId: string,
    territoireCodesLecture: string[],
    optionsExport: OptionsExport,
    jalon: number,
  ): Promise<ChantierPourExport[] | null>;
  recupererPourExportsV2(
    chantierId: string,
    territoireCodesLecture: string[],
    optionsExport: OptionsExport,
    jalon: number,
  ): Promise<ChantierPourExport[] | null>;
  récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(
    chantierIds: string[],
    optionsExport: OptionsExport,
  ): Promise<Chantier["id"][]>;
  recupererPropositionValeurAvancementChantierInformationParIndicId({
    indicId,
  }: {
    indicId: string;
  }): Promise<PropositionValeurAvancementChantierInformation>;
  recupererListePropositionValeurAvancementChantierInformationParChantiersIds({
    listeChantiersIds,
  }: {
    listeChantiersIds: string[];
  }): Promise<PropositionValeurAvancementChantierInformation[]>;
  récupérerLesEntréesDeTousLesChantiersHabilitésNew(
    chantiersLectureIds: string[],
    territoiresLectureIds: string[],
    profil: ProfilCode,
    filtres: FiltreQueryParams,
    territoireCode: string,
    jalon: number,
  ): Promise<PrismaChantier[]>;
}
