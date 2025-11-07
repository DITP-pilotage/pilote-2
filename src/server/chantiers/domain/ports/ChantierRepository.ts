import { DonneeChantier } from "@/server/chantiers/domain/DonneeChantier";
import { OptionsExport } from "@/server/usecase/chantier/OptionsExport";
import { ChantierPourExport } from "@/server/chantiers/domain/ChantierPourExport";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import { RapportDirecteurProjetChantierInformation } from "@/server/chantiers/domain/PropositionValeurAvancementChantierInformation";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";
import { FiltreQueryParams } from "@/server/chantiers/app/contrats/FiltreQueryParams";
import { PrismaChantier } from "@/server/chantiers/domain/PrismaChantier";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";

export interface ChantierRepository {
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
  }): Promise<RapportDirecteurProjetChantierInformation>;
  recupererListePropositionValeurAvancementChantierInformationParChantiersIds({
    listeChantiersIds,
  }: {
    listeChantiersIds: string[];
  }): Promise<RapportDirecteurProjetChantierInformation[]>;
  récupérerLesEntréesDeTousLesChantiersHabilitésNew(
    chantiersLectureIds: string[],
    territoiresLectureIds: string[],
    profil: ProfilCode,
    filtres: FiltreQueryParams,
    territoireCode: string,
    jalon: number,
  ): Promise<PrismaChantier[]>;
}
