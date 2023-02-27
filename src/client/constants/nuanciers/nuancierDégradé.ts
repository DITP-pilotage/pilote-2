import { interpolerCouleurs } from '@/client/utils/couleur/couleur';
import { remplissageParDéfaut, NuancierDégradé } from './nuancier';

const couleurDépart = '#8bcdb1';
const couleurArrivé = '#083a25';

const nuancierDégradé: NuancierDégradé = {
  couleurDépart,
  couleurArrivé,
  récupérerRemplissage: (valeurMin, valeurMax, valeur) => {
    if (valeur === null)
      return remplissageParDéfaut;

    const pourcentageInterpolation = 100 * (valeur - valeurMin) / (valeurMax - valeurMin);
    return {
      type: 'COULEUR',
      couleur: interpolerCouleurs(couleurDépart, couleurArrivé, pourcentageInterpolation),
    };
  },
};

export default nuancierDégradé;
