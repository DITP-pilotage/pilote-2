import styled from '@emotion/styled';

const AvancementChantierStyled = styled.section`
  .jauge > div {
    margin: auto;
  }
  
  .blocs {
    display: flex;
    flex-wrap: wrap;
    row-gap: 1.5rem;
    column-gap: 1.5rem;

    & > * {
      flex-grow: 1;
    }
  }
`;

export default AvancementChantierStyled;
