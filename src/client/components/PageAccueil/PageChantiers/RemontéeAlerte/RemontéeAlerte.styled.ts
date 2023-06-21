import styled from '@emotion/styled';

const RemontéeAlerteStyled = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  height: 100%;
  background-color: white;
  border: 1px solid var(--border-default-grey);
  border-radius: 8px;
  box-shadow: 0 2px 6px 0 #00001229;
  
  &.est-activée {
    border-color: var(--text-default-warning);
  }
  
  .nombre {
    color: var(--text-default-warning);
  }
  
  .libellé {
    font-size: .75rem;
    color: var(--text-title-grey);

    @media (min-width: 48rem) {
      font-size: 1rem;
    }
  }
`;

export default RemontéeAlerteStyled;
