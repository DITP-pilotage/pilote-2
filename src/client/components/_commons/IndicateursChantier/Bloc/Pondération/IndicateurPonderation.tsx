import { FunctionComponent } from 'react';
import { convertitEnPondération } from '@/client/utils/ponderation/ponderation';
import { MailleTerritoireSelectionne } from '@/server/domain/maille/Maille.interface';

interface IndicateurPondérationProps {
  indicateurPondération: number | null;
  mailleSélectionnée: 'NAT' | 'REG' | 'DEPT';
}

const adjectifÀPartirDeLaMaille: Record<MailleTerritoireSelectionne, string> = {
  NAT: 'national',
  DEPT: 'régional',
  REG: 'départemental',
};

const IndicateurPonderation: FunctionComponent<IndicateurPondérationProps> = ({ indicateurPondération, mailleSélectionnée }) => {
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
                    {convertitEnPondération(indicateurPondération)}
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

export default IndicateurPonderation;
