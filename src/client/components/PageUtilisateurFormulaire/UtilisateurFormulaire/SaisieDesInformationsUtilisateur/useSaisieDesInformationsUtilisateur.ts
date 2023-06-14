import { Profil } from '@/server/domain/profil/Profil.interface';

export default function useSaisieDesInformationsUtilisateur(profils: Profil[]) {
  const listeProfils = profils.map(profil => ({
    libellé: profil.nom,
    valeur: profil.code,
  }));

  return {
    listeProfils,
  };
}
