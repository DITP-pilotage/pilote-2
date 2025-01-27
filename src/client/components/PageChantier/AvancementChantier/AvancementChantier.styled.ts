import styled from '@emotion/styled';

const AvancementChantierStyled = styled.div`
  display: grid;
  grid-template-areas: "nat";
  gap: 0.7rem;

  &.layout--dept {
    @media (min-width: 1025px) {
      grid-template-areas: "dept reg nat nat";
      grid-template-columns: 2fr 2fr 2fr 2fr;
    }

    @media (min-width: 768px) and (max-width: 1024px) {
      grid-template-areas: "dept reg" "nat nat";
      grid-template-columns: 2fr 2fr;
    }

    grid-template-areas: "dept" "reg" "nat";
  }

  &.layout--reg {
    @media (min-width: 768px) {
      grid-template-areas: "reg nat  ";
      grid-template-columns: 2fr 2fr 2fr;
    }
  }

  &.layout--nat {
    @media (min-width: 768px) {
      grid-template-areas: "nat  ";
      grid-template-columns: 2fr 2fr;
    }
  }

  .jauge > div {
    margin: auto;
  }
  
  .text-bottom-jauge-progression {
    max-width: 17rem;
  }
  
  @media print {
    &.layout--dept {
      grid-template-areas: "dept reg nat nat";
      grid-template-columns: 2fr 2fr 2fr 2fr;
    }

    &.layout--reg {
      grid-template-areas: "reg nat  ";
      grid-template-columns: 2fr 2fr 2fr;
    }

    &.layout--nat {
      grid-template-areas: "nat  ";
      grid-template-columns: 2fr 2fr;
    }
  } 
`;

export default AvancementChantierStyled;
