import styled from '@emotion/styled';
import {  breakpointSm } from '@/client/components/_commons/MiseEnPage/MiseEnPage.styled';

const PublicationStyled = styled.section`
break-inside: avoid;

  .boutons-commentaire  {
    @media screen and (max-width: ${breakpointSm}) {
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 100%;
    }
  }

  .bouton-modifier {
    border-radius: 0.25rem;
    margin-left: 1rem;
    
      @media screen and (max-width: ${breakpointSm}) {
        justify-content: center;
        width: 100%;
        margin-top: 1rem;
        margin-left: 0;
      }
  }
  `;

export default PublicationStyled;
