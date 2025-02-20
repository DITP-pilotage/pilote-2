import styled from '@emotion/styled';

const SommaireStyled = styled.div`
  position: sticky;
  top: 0;
  max-width: 20rem;

  li {
    line-height: 2rem;
    color: var(--text-action-high-blue-france);
    list-style: none;

    a:not(:hover, :active) {
      --underline-idle-width: 0;
    }
    
    .line-height-xs {
      padding-bottom: 0.75rem;
      line-height: 1.25rem;
    }
  }
`;

export default SommaireStyled;
