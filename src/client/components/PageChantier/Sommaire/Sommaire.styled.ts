import styled from '@emotion/styled';

const SommaireStyled = styled.div`
  position: sticky;
  top: 0;
  max-width: 20rem;

  li {
    color: var(--text-action-high-blue-france);
    list-style: none;

    a:not(:hover, :active) {
      --underline-idle-width: 0;
    }
  }
`;

export default SommaireStyled;
