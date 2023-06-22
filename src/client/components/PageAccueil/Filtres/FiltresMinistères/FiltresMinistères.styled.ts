import styled from '@emotion/styled';

const FiltresMinistèresStyled = styled.div`

  button:focus {
    outline-offset: -2px;
  }
  
  button {
    width: 100%;
    text-align: left;
  }

  ul {
    list-style-type: none;
  }

  ul.ministères-liste {
    overflow-y: auto;
  }

  ul.périmètres-liste {
    max-height: 0;
    overflow-y: hidden;
    transition: max-height 0.5s cubic-bezier(0, 1.05, 0, 1);
  }

  .ministère-déroulé + ul.périmètres-liste {
    max-height: 100vh;
    transition: max-height 2s;
  }

  .tuile {
    border-radius: 0.25rem;
    
    .tuile-ministère-contenu {
      display: grid;
      grid-template-columns: 2rem auto;
    }
  }

  .icône {
    color: var(--background-active-blue-france);
  }

  .actif {
    font-weight: bold;
    color: var(--background-default-grey);
    background-color: var(--background-active-blue-france);

    .icône {
      color: white;
    }

    :focus {
      outline-color: var(--warning-425-625);
    }
  }

  .actif:hover {
    background-color: var(--background-active-blue-france-hover);
  }
`;

export default FiltresMinistèresStyled;
