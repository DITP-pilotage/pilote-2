import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { DétailsIndicateurs, DétailsIndicateurMailles } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { IndicateurPourExport } from '@/server/usecase/chantier/indicateur/ExportCsvDesIndicateursSansFiltreUseCase.interface';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';

export default interface IndicateurRepository {
  récupérerChantierIdAssocié(indicateurId: string): Promise<string>
  récupérerDétailsParMailles(IndicateurId: string, habilitations: Habilitations, profil: ProfilCode): Promise<DétailsIndicateurMailles>
  récupérerParChantierId(chantierId: string): Promise<Indicateur[]>;
  récupérerDétails(indicateurId: string, maille: Maille): Promise<DétailsIndicateurs>;
  récupererDétailsParChantierIdEtTerritoire(chantierId: string, territoireCodes: string[]): Promise<DétailsIndicateurs>;
  récupérerGroupésParChantier(chantiersIds: Chantier['id'][], maille: Maille, codeInsee: CodeInsee): Promise<Record<string, Indicateur[]>>
  récupérerDétailsGroupésParChantierEtParIndicateur(chantiersIds: Chantier['id'][], maille: Maille, codeInsee: CodeInsee): Promise<Record<Chantier['id'], DétailsIndicateurs>>

  récupérerPourExports(chantierIdsLecture: string[], territoireCodesLecture: string[]): Promise<IndicateurPourExport[]>;
}
