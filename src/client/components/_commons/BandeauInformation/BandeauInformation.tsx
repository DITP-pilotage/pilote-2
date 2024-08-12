import { FunctionComponent, PropsWithChildren } from 'react';
import BandeauInformationStyled from './BandeauInformation.styled';

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

const BandeauInformation: FunctionComponent<PropsWithChildren<{
  bandeauType: string,
  fermable?: boolean
}>> = ({ children, bandeauType, fermable = true }) => {
  return (
    <BandeauInformationStyled>
      <div className={`fr-notice ${getBandeauTypeClass(bandeauType)}`}>
        <div className='fr-container'>
          <div className='fr-notice__body flex'>
            <p className='fr-notice__title'>
              {children}
            </p>
            {
              fermable ? (
                <button
                  className='fr-btn--close fr-btn'
                  onClick={(event) => {
                    const notice = event.currentTarget?.parentNode?.parentNode?.parentNode;
                    notice?.parentNode?.removeChild(notice);
                  }}
                  title='Masquer le message'
                  type='button'
                >
                  Masquer le message
                </button>
              ) : null
            }
          </div>
        </div>
      </div>
    </BandeauInformationStyled>
  );
};

export default BandeauInformation;
