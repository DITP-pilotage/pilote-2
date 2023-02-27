import Chantier from '@/server/domain/chantier/Chantier.interface';

export default interface ChantierRepository {
  getById(id: string): Promise<Chantier>;
  getListe(): Promise<Chantier[]>;
  getMetriques(chantierId: string, maille: string, codeInsee: string): Promise<MetriquesChantier>
}

export type MetriquesChantier = {
  synthèseDesRésultats: SyntheseDesResultats
};

export type SyntheseDesResultats = {
  commentaire: string | null
  date: string | null
  auteur: string | null
};
