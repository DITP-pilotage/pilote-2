import { Profil } from '@/server/domain/profil/Profil.interface';
import { RouterInputs } from '@/server/infrastructure/api/trpc/trpc.interface';

export default interface PageUtilisateurFormulaireProps {
  profils: Profil[]
}
export type UtilisateurFormInputs =  Omit<RouterInputs['utilisateur']['créer'], 'csrf'>;

