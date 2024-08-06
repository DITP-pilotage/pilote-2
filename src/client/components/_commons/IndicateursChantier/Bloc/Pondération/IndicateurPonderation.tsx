import { convertitEnPondération } from '@/client/utils/ponderation/ponderation';
import IndicateurPondérationProps
  from '@/components/_commons/IndicateursChantier/Bloc/Pondération/IndicateurPonderation.interface';
import { MailleTerritoireSelectionne } from '@/server/domain/maille/Maille.interface';

const adjectifÀPartirDeLaMaille: Record<MailleTerritoireSelectionne, string> = {
  NAT: 'national',
  DEPT: 'régional',
  REG: 'départemental',
};

export function IndicateurPonderation({ indicateurPondération, mailleSélectionnée }: IndicateurPondérationProps) {
  return (
    <p className='fr-text--xs texte-gris'>
      {
        indicateurPondération === null
          ? `La pondération n'est pas disponible pour le taux d'avancement ${adjectifÀPartirDeLaMaille[mailleSélectionnée]}.`
          : (
            indicateurPondération === 0
              ? `Cet indicateur n’est pas pris en compte dans le taux d’avancement ${adjectifÀPartirDeLaMaille[mailleSélectionnée]} du chantier.`
              : (
                <>
                  Cet indicateur représente
                  {' '}
                  <span className='fr-text--bold'>
                    {convertitEnPondération(indicateurPondération)}
                    %
                  </span>
                  {' '}
                  du taux d’avancement
                  {' '}
                  {adjectifÀPartirDeLaMaille[mailleSélectionnée]}
                  {' '}
                  du chantier.
                </>
              )
          )
      }
    </p>
  );
}
