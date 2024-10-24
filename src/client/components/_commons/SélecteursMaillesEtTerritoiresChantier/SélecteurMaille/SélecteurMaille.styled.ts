import styled from '@emotion/styled';
import { breakpointL } from '@/client/components/_commons/MiseEnPage/MiseEnPage.styled';

const SélecteurMailleStyled = styled.div`
  display: flex;
  background: var(--background-alt-blue-france);
  border-radius: 0.25rem;

    @media screen and (max-width: ${breakpointL}) {
          border-radius: 0;
    }

    &:not(:last-child) {
      margin-bottom: 1.5rem;
    }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 50%;
    min-height: 2.625rem;
    font-size: 0.9rem;
    text-align: center;
    background-image: none;
    border-radius: 0.25rem;

      @media screen and (max-width: ${breakpointL}) {
        margin: 0.2rem;
        font-size: 12px;
        border-radius: 0;
      }

      &.sélectionné {
        color: var(--text-inverted-grey);
        background-color: var(--background-active-blue-france);
      }
  }
`;

export default SélecteurMailleStyled;
