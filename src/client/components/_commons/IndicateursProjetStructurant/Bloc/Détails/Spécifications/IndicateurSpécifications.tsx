import { FunctionComponent } from 'react';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import IndicateurSpécificationsStyled from './IndicateurSpécifications.styled';

interface IndicateurSpécificationsProps {
  description: Indicateur['description']
  modeDeCalcul: Indicateur['modeDeCalcul']
  source: Indicateur['source']
}

const IndicateurSpécifications: FunctionComponent<IndicateurSpécificationsProps> = ({ description, modeDeCalcul, source }) => {
  const libelléValeurNull = 'Non renseignée';

  return (
    <IndicateurSpécificationsStyled className='fr-px-7w fr-py-2w'>
      <span
        aria-hidden='true'
        className='fr-icon-information-fill fr-ml-n4w fr-mr-1w icone-information'
      />
      <p className='fr-text--md sous-titre'>
        Description de l'indicateur
      </p>
      <p className='fr-text--xs'>
        {description ?? libelléValeurNull}
      </p>
      <p className='fr-text--md sous-titre fr-mt-2w'>
        Méthode de calcul
      </p>
      <p className='fr-text--xs'>
        {modeDeCalcul ?? libelléValeurNull}
      </p>
      <p className='fr-text--md sous-titre fr-mt-2w'>
        Source
      </p>
      <p className='fr-text--xs'>
        {source ?? libelléValeurNull}
      </p>
    </IndicateurSpécificationsStyled>
  );
};

export default IndicateurSpécifications;
