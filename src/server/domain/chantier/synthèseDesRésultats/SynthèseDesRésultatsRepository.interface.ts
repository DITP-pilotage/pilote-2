import { Météo } from '@/server/chantiers/domain/Meteo';
import { Chantier } from '@/server/chantiers/domain/Chantier.interface';
import { SyntheseDesResultats } from './SynthèseDesRésultats.interface';

export interface SyntheseDesResultatsRepository {
  récupérerLaPlusRécente(chantierId: string, territoireCode: string): Promise<SyntheseDesResultats>
  récupérerHistorique(chantierId: string, territoireCode: string): Promise<SyntheseDesResultats[]>;
  créer(chantierId: string, territoireCode: string, id: string, contenu: string, auteur: string, météo: Météo, date: Date): Promise<SyntheseDesResultats>;
  récupérerLesPlusRécentesGroupéesParChantier(chantiersIds: Chantier['id'][], maille: string, codeInsee: string): Promise<Record<Chantier['id'], SyntheseDesResultats>>;
}
