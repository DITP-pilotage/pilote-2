import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import { RouterInputs } from '@/server/infrastructure/api/trpc/trpc.interface';

export interface UtilisateurFormulaireProps {
  utilisateur?: Utilisateur
}

export type UtilisateurFormInputs =  Omit<RouterInputs['utilisateur']['créer'], 'csrf'>;
