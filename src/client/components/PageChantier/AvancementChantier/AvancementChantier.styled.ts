import styled from "@emotion/styled";

const AvancementChantierStyled = styled.div`
  display: grid;
  grid-template-areas: "nat";
  gap: 0.7rem;

  .fr-select-group,
  .fr-select {
    width: 3.5rem;
    height: 1.5rem;
    padding: 0.07rem 0 0 0.2rem;
    margin: 0 !important;
    font-size: 0.75rem !important;
    background-color: transparent;
    background-position: 100% 70% !important;
  }

  .fr-select {
    box-shadow: inset 0 -1px 0 0 var(--border-plain-grey);
  }

  .ecart-pourcentage-couleur {
    color: #8585f6;
  }

  .tendance-pourcentage-couleur {
    color: var(--background-active-blue-france);
  }

  &.layout--dept {
    @media (min-width: 1025px) {
      grid-template-areas: "dept reg nat";
      grid-template-columns: 4fr 4fr 4fr;
    }

    @media (min-width: 768px) and (max-width: 1024px) {
      grid-template-areas: "dept reg" "nat nat";
      grid-template-columns: 2fr 2fr;
    }

    grid-template-areas: "dept" "reg" "nat";
  }

  &.layout--reg {
    @media (min-width: 768px) {
      grid-template-areas: "reg nat";
      grid-template-columns: 6fr 6fr;
    }
  }

  &.layout--nat {
    @media (min-width: 768px) {
      grid-template-areas: "nat";
      grid-template-columns: 4fr 4fr;
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
      grid-template-areas: "dept reg nat";
      grid-template-columns: 4fr 4fr 4fr;
    }

    &.layout--reg {
      grid-template-areas: "reg nat";
      grid-template-columns: 6fr 6fr;
    }

    &.layout--nat {
      grid-template-areas: "nat";
      grid-template-columns: 4fr 4fr;
    }
  }
`;

export default AvancementChantierStyled;
