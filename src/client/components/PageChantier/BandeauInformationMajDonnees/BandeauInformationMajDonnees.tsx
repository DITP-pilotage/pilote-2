import { FunctionComponent } from 'react';
import BandeauInformationMajDonneesStyled from './BandeauInformationMajDonneesStyled';

const getBandeauTypeClass = (bandeauType: string) => {
  switch (bandeauType) {
    case 'INFO': {
      return 'fr-notice--info';
    }
    case 'WARNING': {
      return 'fr-notice--info fr-notice--warning';
    }
    default: {
      return 'fr-notice--info fr-notice--warning';
    }
  }
};

const BandeauInformationMajDonnees: FunctionComponent<{
  bandeauType: string,
  titre: string,
  message: string,
}> = ({ bandeauType, titre, message }) => {
  return (
    <BandeauInformationMajDonneesStyled>
      <div className={`fr-notice ${getBandeauTypeClass(bandeauType)}`}>
        <div className='fr-notice__body flex fr-mx-3w'>
          <p className='fr-notice__desc fr-ml-1v'>
            <span className='fr-text--bold'>
              {titre}
            </span>
            {message}
          </p>
        </div>
      </div>
    </BandeauInformationMajDonneesStyled>
  );
};

export default BandeauInformationMajDonnees;
