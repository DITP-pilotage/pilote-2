import styled from '@emotion/styled';
import { UtilisateurStyledProps } from './Utilisateur.interface';

const UtilisateurStyled = styled.div<UtilisateurStyledProps>`
  color: var(--text-action-high-blue-france);

  .fr-icon-arrow-right-s-line {
    ::before {
      transition: transform ease-in-out 0.2s;
      transform: ${(props) => props.estDéplié ? 'rotate(90deg)' : 'rotate(0)'};
    }
  }
`;

export default UtilisateurStyled;
