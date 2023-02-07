import styled from '@emotion/styled';

const SélecteurDeNiveauDeMailleStyled = styled.div`
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
`;

export default SélecteurDeNiveauDeMailleStyled;
