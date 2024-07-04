import styled from '@emotion/styled';

const SélecteurCustomStyled = styled.div`
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
    overflow: auto;
    background: var(--background-contrast-grey);
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
 
  .fr-option:nth-of-type(even) {
    background-color: var(--background-alt-grey);
  }

  .fr-option-disabled {
    font-size: 1rem;
    line-height: 1.5rem;
    color: var(--text-mention-grey);
  }

  .fr-option:hover {
    color: white;
    background-color: var(--background-active-blue-france);
  }
`;

export default SélecteurCustomStyled;
