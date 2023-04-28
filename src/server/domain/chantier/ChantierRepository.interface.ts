import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { ChantierPourExport } from '@/server/domain/chantier/ChantierPourExport';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';

export default interface ChantierRepository {
  getById(id: string, habilitation: Utilisateur['scopes']): Promise<Chantier>;
  getListe(habilitation: Utilisateur['scopes']): Promise<Chantier[]>;
  récupérerMétéoParChantierIdEtTerritoire(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<Météo | null>
  modifierMétéo(chantierId: string, maille: Maille, codeInsee: CodeInsee, météo: Météo): Promise<void>;
  getChantiersPourExports(habilitation: Utilisateur['scopes']): Promise<ChantierPourExport[]>;
  récupérerChantierIdsAssociésAuxPérimètresMinistèriels(périmètreIds: PérimètreMinistériel['id'][]): Promise<Chantier['id'][]> 
}
