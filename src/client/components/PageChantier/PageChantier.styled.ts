import styled from '@emotion/styled';

const PageChantierStyled = styled.div`
  background: var(--background-contrast-grey);

  .contenu-principal {
    flex: 1;
    background: var(--background-alt-blue-france);
  }

  h2 {
    color: var(--text-title-blue-france);
  }

  tbody {
    background: none;
  }
  
  .texte-impression{
    display: none;
  }
  
@media print{
  @page {
    size: 1800px 2545px;
  }
  
  .texte-impression{
    position: fixed;
    left: 50%;
    display: block;
    transform: translate(-50%, 0);
  }

  section {
    break-inside: avoid;
  }
  
  .contenu-principal {
    background: #FFF;
  }

  .barre-latérale, .fr-btn, .fr-link {
    display: none;
  }
}
  
`;

export default PageChantierStyled;
