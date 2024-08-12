import styled from '@emotion/styled';
import {
  TableauChantiersMétéoTaille,
} from '@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo.interface';

interface TableauRéformesMétéoStyledProps {
  taille: TableauChantiersMétéoTaille;
}

const hauteurMétéoPictoÀPartirDeLaTaille = {
  'sm': '1.65rem',
  'md': '1.75rem',
};

const TableauRéformesMétéoStyled = styled.div<TableauRéformesMétéoStyledProps>`
  display: grid;
  grid-template-rows: 2rem 0.75rem;
  align-items: center;
  width: 100%;
  font-size: 0.625rem;
  
  .météo-picto {
    width: auto;
    height: ${({ taille }) => hauteurMétéoPictoÀPartirDeLaTaille[taille]};
  }
`;

export default TableauRéformesMétéoStyled;
