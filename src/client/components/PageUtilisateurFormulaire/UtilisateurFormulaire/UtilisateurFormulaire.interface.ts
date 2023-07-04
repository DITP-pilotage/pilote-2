import { RouterInputs } from '@/server/infrastructure/api/trpc/trpc.interface';

export type UtilisateurFormInputs =  Omit<RouterInputs['utilisateur']['créer'], 'csrf'>;
