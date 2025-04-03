import {
  chantier_identite as PrismaChantierIdentite,
  chantier_territoire as PrismaChantierTerritoire,
  chantier_territoire_jalon as PrismaChantierTerritoireJalon,
} from '@prisma/client';
import { DonneeChantier } from '@/server/chantiers/domain/DonneeChantier';
import { OptionsExport } from '@/server/usecase/chantier/OptionsExport';
import { ChantierPourExport } from '@/server/chantiers/domain/ChantierPourExport';
import {
  PropositionValeurAvancementChantierInformation,
} from '@/server/chantiers/domain/PropositionValeurAvancementChantierInformation';
import { Chantier, ChantierSynthétisé } from '@/server/chantiers/domain/Chantier.interface';
import { Météo } from '@/server/chantiers/domain/Meteo';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import { RepartitionMeteoChantiers } from '@/server/chantiers/domain/RepartitionMeteoChantiers';
import { FiltreQueryParams } from '@/server/chantiers/app/contrats/FiltreQueryParams';
import { PrismaChantier } from '@/server/chantiers/infrastructure/adapters/PrismaChantier';
import { Maille } from '@/server/chantiers/domain/Territoire';

export interface ChantierRepository {
  récupérerDonneesChantier(chantierId: string, territoireCodesLecture: string[]): Promise<DonneeChantier[]>;
  récupérerPourExports(chantierId: string, territoireCodesLecture: string[], optionsExport: OptionsExport, jalon: number): Promise<ChantierPourExport[] | null>;
  récupérerPourExportsV2(chantierId: string, territoireCodesLecture: string[], optionsExport: OptionsExport, jalon: number): Promise<ChantierPourExport[] | null>;
  récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(chantierIds: string[], optionsExport: OptionsExport): Promise<Chantier['id'][]>;
  recupererPropositionValeurAvancementChantierInformationParIndicId({ indicId }: { indicId: string }): Promise<PropositionValeurAvancementChantierInformation>;
  récupérerLesEntréesDUnChantier(id: string, habilitations: Habilitations, profil: ProfilCode, jalon: number): Promise<(PrismaChantierIdentite & {
    chantier_territoire: (PrismaChantierTerritoire & { chantier_territoire_jalon: PrismaChantierTerritoireJalon[] })[]
  })>;
  récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds: string[], territoiresLectureIds: string[], profil: ProfilCode, filtres: FiltreQueryParams, territoireCode: string, jalon: number): Promise<PrismaChantier[]>;
  récupérerChantiersSynthétisés(): Promise<ChantierSynthétisé[]>;
  getChantierStatistiques(habilitations: Habilitations, listeChantier: Chantier['id'][], maille: Maille): Promise<AvancementsStatistiques>;
  modifierMétéo(chantierId: string, territoireCode: string, météo: Météo): Promise<void>;
  recupererLaRepartitionMeteo(chantiersLectureIds: string[], territoireCode: string, filtres: FiltreQueryParams): Promise<RepartitionMeteoChantiers>;
}
