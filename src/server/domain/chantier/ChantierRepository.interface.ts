import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { DetailsCommentaire } from '@/server/domain/chantier/Commentaire.interface';

export default interface ChantierRepository {
  getById(id: string): Promise<Chantier>;
  getListe(): Promise<Chantier[]>;
  getMetriques(chantierId: string, maille: string, codeInsee: string): Promise<MetriquesChantier>
}

export type MetriquesChantier = {
  synthèseDesRésultats: DetailsCommentaire
  météo: Météo | null
};
