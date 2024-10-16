import { ministere, perimetre } from '@prisma/client';
import Ministère from '@/server/domain/ministère/Ministère.interface';

export default interface MinistèreRepository {
  getListe(): Promise<Ministère[]>;
  getListePourChantiers(chantierIds: string[]): Promise<Ministère[]>;
  récupérerToutesLesIconesAssociéesÀLeurPérimètre(): Promise<{ perimetre_id: perimetre['id'], icone: ministere['icone'] }[]>
  récupérerLesNomsAssociésÀLeurPérimètre(périmètresIds: perimetre['id'][]): Promise<{ perimetre_id: perimetre['id'], nom: ministere['nom'] }[]>
}


