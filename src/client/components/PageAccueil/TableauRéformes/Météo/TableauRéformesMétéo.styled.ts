import styled from '@emotion/styled';
import {
  TableauRéformesMétéoStyledProps,
} from '@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo.interface';

const hauteurMétéoPictoÀPartirDeLaTaille = {
  'sm': '1.65rem',
  'md': '1.75rem',
};

const TableauRéformesMétéoStyled = styled.div<TableauRéformesMétéoStyledProps>`
  display: grid;
  grid-template-rows: 2rem 0.75rem;
  align-items: center;
  font-size: 0.625rem;
  
  .météo-picto {
    height: ${({ taille }) => hauteurMétéoPictoÀPartirDeLaTaille[taille]};
  }
`;

export default TableauRéformesMétéoStyled;
