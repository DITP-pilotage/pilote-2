import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { ChantierPourExport } from '@/server/domain/chantier/ChantierPourExport';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';

export default interface ChantierRepository {
  getById(id: string, habilitations: Habilitations): Promise<Chantier>;

  getListe(habilitations: Habilitation): Promise<Chantier[]>;
  récupérerMétéoParChantierIdEtTerritoire(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<Météo | null>
  modifierMétéo(chantierId: string, maille: Maille, codeInsee: CodeInsee, météo: Météo): Promise<void>;
  getChantiersPourExports(habilitations: Habilitations): Promise<ChantierPourExport[]>;
  récupérerChantierIdsAssociésAuxPérimètresMinistèriels(périmètreIds: PérimètreMinistériel['id'][]): Promise<Chantier['id'][]> 
}
