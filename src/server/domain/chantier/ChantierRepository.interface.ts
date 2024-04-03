import { chantier as ChantierPrisma } from '@prisma/client';
import Chantier, { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import { Habilitations, Scope } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';
import { ChantierPourExport } from '@/server/usecase/chantier/ExportCsvDesChantiersSansFiltreUseCase.interface';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import { OptionsExport } from '@/server/usecase/chantier/OptionsExport';

export default interface ChantierRepository {
  récupérerLesEntréesDUnChantier(id: string, habilitations: Habilitations, profil: ProfilCode): Promise<ChantierPrisma[]>;
  récupérerLesEntréesDeTousLesChantiersHabilités(habilitation: Habilitation, profil: ProfilCode): Promise<ChantierPrisma[]>;
  récupérerTous(): Promise<ChantierPrisma[]>;
  récupérerChantiersSynthétisés(): Promise<ChantierSynthétisé[]>;
  getChantierStatistiques(habilitations: Habilitations, listeChantier: Chantier['id'][], maille: Maille): Promise<AvancementsStatistiques>;
  récupérerMétéoParChantierIdEtTerritoire(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<Météo | null>
  modifierMétéo(chantierId: string, territoireCode: string, météo: Météo): Promise<void>;
  récupérerPourExports(chantierIdsLecture: string[], territoireCodesLecture: string[]): Promise<ChantierPourExport[]>;
  récupérerChantierIdsEnLectureOrdonnésParNom(habilitation: Habilitation): Promise<Chantier['id'][]>;
  récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(habilitation: Habilitation, optionsExport: OptionsExport): Promise<Chantier['id'][]>;
  récupérerChantierIdsAssociésAuxPérimètresMinistèriels(périmètreIds: PérimètreMinistériel['id'][], scope: Scope, profilUtilisateur: string): Promise<Chantier['id'][]> ;
  récupérerChantierIdsPourSaisieCommentaireServiceDeconcentré(chantierIds: Chantier['id'][]): Promise<Chantier['id'][]>;
}
