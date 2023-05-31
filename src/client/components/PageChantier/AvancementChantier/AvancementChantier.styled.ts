import styled from '@emotion/styled';

const AvancementChantierStyled = styled.div`
  .jauge > div {
    margin: auto;
  }
  
  .blocs {
    display: flex;
    flex-wrap: wrap;
    row-gap: 1.5rem;
    column-gap: 1.5rem;

    @media (width < 1350px) {
      column-gap: 1rem;
    }

    & > * {
      flex-grow: 1;
    }
  }
`;

export default AvancementChantierStyled;
