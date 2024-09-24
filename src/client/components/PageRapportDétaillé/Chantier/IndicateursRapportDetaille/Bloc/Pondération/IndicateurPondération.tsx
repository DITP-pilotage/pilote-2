import { FunctionComponent } from 'react';
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

const IndicateurPondération: FunctionComponent<IndicateurPondérationProps> = ({ indicateurPondération, mailleSélectionnée }) => {
  return (
    <p className='fr-text--xs texte-gris'>
      {
        indicateurPondération === null
          ? `La pondération n'est pas disponible pour le taux d'avancement ${adjectifÀPartirDeLaMaille[mailleSélectionnée]}.`
          : (
            indicateurPondération === 0
              ? `Cet indicateur n’est pas pris en compte dans le taux d’avancement ${adjectifÀPartirDeLaMaille[mailleSélectionnée]} de la politique prioritaire.`
              : (
                <>
                  Cet indicateur représente
                  {' '}
                  <span className='fr-text--bold'>
                    {indicateurPondération.toFixed(0)}
                    %
                  </span>
                  {' '}
                  du taux d’avancement
                  {' '}
                  {adjectifÀPartirDeLaMaille[mailleSélectionnée]}
                  {' '}
                  de la politique prioritaire.
                </>
              )
          )
      }
    </p>
  );
};

export default IndicateurPondération;
