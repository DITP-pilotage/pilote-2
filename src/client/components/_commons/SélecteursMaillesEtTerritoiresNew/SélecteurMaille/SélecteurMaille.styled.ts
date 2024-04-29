import styled from '@emotion/styled';

const SélecteurMailleStyled = styled.div`
  display: flex;
  background: var(--background-alt-blue-france);
  border-radius: 0.25rem;

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

    &.sélectionné {
      color: var(--text-inverted-grey);
      background-color: var(--background-active-blue-france);
    }
  }
`;

export default SélecteurMailleStyled;
