import styled from '@emotion/styled';

const BandeauInformationStyled = styled.section`
  .fr-notice--info {
    background-color: var(--background-contrast-warning);

    --idle: transparent;
    --hover: var(--background-contrast-info-hover);
    --active: var(--background-contrast-info-active);
    color: var(--background-flat-warning);
  }
`;

export function BandeauInformation({ children }: { children: React.ReactNode }) {
  return (
    <BandeauInformationStyled>
      <div className='fr-notice fr-notice--info'>
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
}
