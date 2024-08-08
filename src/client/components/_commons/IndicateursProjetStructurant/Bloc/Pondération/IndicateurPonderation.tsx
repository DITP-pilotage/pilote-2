import { FunctionComponent } from 'react';
import { convertitEnPondération } from '@/client/utils/ponderation/ponderation';
import { Maille } from '@/server/domain/maille/Maille.interface';

interface IndicateurPondérationProps {
  indicateurPondération: number | null;
  mailleSélectionnée: Maille;
}

const adjectifÀPartirDeLaMaille: Record<Maille, string> = {
  nationale: 'national',
  régionale: 'régional',
  départementale: 'départemental',
};

const IndicateurPonderation: FunctionComponent<IndicateurPondérationProps> = ({ indicateurPondération, mailleSélectionnée }) => {
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
};

export default IndicateurPonderation;
