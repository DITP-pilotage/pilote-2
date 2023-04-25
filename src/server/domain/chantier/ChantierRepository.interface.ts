import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { Habilitation, Scope } from '@/server/domain/identité/Habilitation';
import { ChantierPourExport } from '@/server/domain/chantier/ChantierPourExport';

export default interface ChantierRepository {
  getById(id: string, habilitation: Habilitation, scope: string): Promise<Chantier>;
  getListe(habilitation: Habilitation, scope: Scope): Promise<Chantier[]>;
  récupérerMétéoParChantierIdEtTerritoire(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<Météo | null>
  modifierMétéo(chantierId: string, maille: Maille, codeInsee: CodeInsee, météo: Météo): Promise<void>;
  getChantiersPourExports(habilitation: Habilitation): Promise<ChantierPourExport[]>;
}
