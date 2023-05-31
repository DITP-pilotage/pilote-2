import styled from '@emotion/styled';

const AvancementChantierStyled = styled.div`
  display: flex;
  flex-wrap: wrap;
  row-gap: 1.5rem;
  column-gap: 1.5rem;
  height: 100%;

  @media (width < 1350px) {
    column-gap: 1rem;
  }

  .jauge > div {
    margin: auto;
  }

  & > * {
    flex-grow: 1;
  }
`;

export default AvancementChantierStyled;
