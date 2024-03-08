import styled from '@emotion/styled';
import { FunctionComponent, PropsWithChildren } from 'react';

const BandeauInformationStyled = styled.section`
  .fr-notice--info.fr-notice--warning {
    background-color: var(--background-contrast-warning);

    --idle: transparent;
    --hover: var(--background-contrast-info-hover);
    --active: var(--background-contrast-info-active);
    color: var(--background-flat-warning);
  }
`;

const getBandeauTypeClass = (bandeauType: string) => {
  switch (bandeauType) {
    case 'INFO': {
      return 'fr-notice--info';
    }
    case 'WARNING': {
      return 'fr-notice--info fr-notice--warning';
    }
    default:  {
      return 'fr-notice--info fr-notice--warning';
    }
  }
};

export const BandeauInformation: FunctionComponent<PropsWithChildren<{ bandeauType: string }>> = ({ children, bandeauType }) => {
  return (
    <BandeauInformationStyled>
      <div className={`fr-notice ${getBandeauTypeClass(bandeauType)}`}>
        <div className='fr-container'>
          <div className='fr-notice__body flex'>
            <p className='fr-notice__title'>              
              {children}
            </p>
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
          </div>
        </div>
      </div>
    </BandeauInformationStyled>
  );
};
