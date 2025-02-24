import {
  chantier_identite as PrismaChantierIdentite,
  chantier_territoire as PrismaChantierTerritoire,
  chantier_territoire_jalon as PrismaChantierTerritoireJalon,
} from '@prisma/client';
import Chantier, { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import { RepartitionMeteoChantiers } from '@/server/chantiers/domain/RepartitionMeteoChantiers';
import { FiltreQueryParams } from '@/server/chantiers/app/contrats/FiltreQueryParams';
import { PrismaChantier } from '@/server/infrastructure/accès_données/chantier/PrismaChantier';

export default interface ChantierRepository {
  récupérerLesEntréesDUnChantier(id: string, habilitations: Habilitations, profil: ProfilCode, jalon: number): Promise<(PrismaChantierIdentite & {
    chantier_territoire: (PrismaChantierTerritoire & { chantier_territoire_jalon: PrismaChantierTerritoireJalon[] })[]
  })>;
  récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds: string[], territoiresLectureIds: string[], profil: ProfilCode, filtres: FiltreQueryParams, territoireCode: string, jalon: number): Promise<PrismaChantier[]>;
  récupérerChantiersSynthétisés(): Promise<ChantierSynthétisé[]>;
  getChantierStatistiques(habilitations: Habilitations, listeChantier: Chantier['id'][], maille: Maille): Promise<AvancementsStatistiques>;
  modifierMétéo(chantierId: string, territoireCode: string, météo: Météo): Promise<void>;
  recupererLaRepartitionMeteo(chantiersLectureIds: string[], territoireCode: string, filtres: FiltreQueryParams): Promise<RepartitionMeteoChantiers>;
}
