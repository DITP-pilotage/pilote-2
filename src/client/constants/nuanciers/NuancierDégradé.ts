import { interpolerCouleurs } from '@/client/utils/couleur/couleur';
import Nuancier, { remplissageParDéfaut, NuancierRemplissage } from './Nuancier';

class NuancierDégradé implements Nuancier {

  private readonly valeurMin: number;

  private readonly valeurMax: number;

  readonly couleurDépart = '#8bcdb1';

  readonly couleurArrivé = '#083a25';

  constructor(valeurMin: number, valeurMax: number) {
    this.valeurMin = valeurMin;
    this.valeurMax = valeurMax;
  }

  déterminerRemplissage(valeur: number | null): NuancierRemplissage {
    if (valeur === null)
      return remplissageParDéfaut;

    const pourcentageInterpolation = 100 * (valeur - this.valeurMin) / (this.valeurMax - this.valeurMin);
    return {
      type: 'COULEUR',
      couleur: interpolerCouleurs(this.couleurDépart, this.couleurArrivé, pourcentageInterpolation),
    };
  }

}

export default NuancierDégradé;
