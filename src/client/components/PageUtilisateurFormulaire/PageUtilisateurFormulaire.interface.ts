import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Profil } from '@/server/domain/profil/Profil.interface';
import { RouterInputs } from '@/server/infrastructure/api/trpc/trpc.interface';

export default interface PageUtilisateurFormulaireProps {
  chantiers: Chantier[],
  périmètresMinistériels: PérimètreMinistériel[];
  profils: Profil[]
}

export type UtilisateurFormInputs =  RouterInputs['utilisateur']['créer'];
