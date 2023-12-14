import styled from '@emotion/styled';

const SélecteurAvecRechercheStyled = styled.div`
  position: relative;
  
  div[role='menu'] {
    display: none;
  }

  div[role='menu'].visible {
    position: absolute;
    z-index: 2;
    display: block;
    width: 100%;
    max-height: 20rem;
    padding: 1rem;
    overflow: auto;
    background: white;
    border: 1px solid grey;
  }

  button.fr-select {
    text-align: left;
  }

  .groupe-label {
    color: var(--text-mention-grey);
  }

  .fr-option {
    font-size: 1rem;
    line-height: 1.5rem;
  }

  .fr-option:hover {
    background-color: #1967D2;
    color: white;
  }
`;

export default SélecteurAvecRechercheStyled;
