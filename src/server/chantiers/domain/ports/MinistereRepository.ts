import { ministere, perimetre } from '@prisma/client';
import { Ministere } from '@/server/chantiers/domain/Ministere';

export interface MinistereRepository {
  getListe(): Promise<Ministere[]>;
  getListePourChantiers(chantierIds: string[]): Promise<Ministere[]>;
  récupérerToutesLesIconesAssociéesÀLeurPérimètre(): Promise<{ perimetre_id: perimetre['id'], icone: ministere['icone'] }[]>
  récupérerLesNomsAssociésÀLeurPérimètre(périmètresIds: perimetre['id'][]): Promise<{ perimetre_id: perimetre['id'], nom: ministere['nom'] }[]>
}
