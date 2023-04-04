import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import SynthèseDesRésultats from './SynthèseDesRésultats.interface';

export default interface SynthèseDesRésultatsRepository {
  récupérerLaPlusRécenteParChantierIdEtTerritoire(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<SynthèseDesRésultats>
  récupérerHistorique(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<SynthèseDesRésultats[]>;
  créer(chantierId: string, maille: Maille, codeInsee: CodeInsee, contenu: string, auteur: string, météo: Météo, date: Date): Promise<SynthèseDesRésultats>;
}
