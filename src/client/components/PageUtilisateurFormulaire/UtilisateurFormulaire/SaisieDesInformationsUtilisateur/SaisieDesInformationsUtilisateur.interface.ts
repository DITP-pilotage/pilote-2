import { Profil } from '@/server/domain/profil/Profil.interface';

export default interface SaisieDesInformationsUtilisateurProps {
  profils: Profil[]
  soumissionCallback: () => void
}
