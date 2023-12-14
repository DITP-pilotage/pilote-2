import styled from '@emotion/styled';

const SélecteurIndicateurActif = styled.div`
  display: flex;
  width: 15rem;
  height: 3rem;
  background: var(--background-alt-blue-france);
  border-radius: 0.25rem;

  &:not(:last-child) {
    margin-bottom: 1.5rem;
  }

  button {
    width: 50%;
    border-radius: 0.25rem;

    &.sélectionné {
      color: var(--text-inverted-grey);
      background-color: var(--background-active-blue-france);
        
      &:disabled {
        background-color: var(--text-disabled-grey);
      }
      
      &.inactif {
        background-color: var(--background-active-red-marianne);
          
          &:disabled {
              background-color: var(--text-disabled-grey);
          }
      }
    }
  }
`;

export default SélecteurIndicateurActif;
