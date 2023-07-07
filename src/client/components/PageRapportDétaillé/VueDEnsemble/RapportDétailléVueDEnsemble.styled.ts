import styled from '@emotion/styled';

const RapportDétailléVueDEnsembleStyled = styled.section`
  page-break-after: always;
  
  .avancements-météos-carto {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 62rem) {
    .avancements-météos-carto {
      grid-template-columns: 1fr 1fr;
    }
  }
  
  h2.titre-liste-chantiers {
    color: var(--text-title-grey);
  }

  .alertes {
    .titre-remontée-alertes {
      color: var(--text-default-warning);
    }

    .infobulle-bouton {
      color: var(--text-default-warning);
    }
  }
  
  @media print {
    .avancements-météos-carto {
      grid-template-columns: 1fr 1fr;
    }
  }
`;

export default RapportDétailléVueDEnsembleStyled;
