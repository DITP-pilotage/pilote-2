import styled from '@emotion/styled';

const FiltresSélecteursStyled = styled.div`
  .maille {
    background: var(--background-alt-blue-france);
    border-radius: 0.25rem;

    button {
      width: 50%;
      height: 3rem;
      border-radius: 0.25rem;

      &.séléctionné {
        color: var(--text-inverted-grey);
        background-color: var(--background-active-blue-france);
      }
    }
  }

  select {
    background-color: var(--background-alt-blue-france);
  }
`;

export default FiltresSélecteursStyled;
