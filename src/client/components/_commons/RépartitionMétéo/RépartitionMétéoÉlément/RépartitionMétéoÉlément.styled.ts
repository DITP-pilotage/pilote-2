import styled from '@emotion/styled';
import { RépartitionMétéosÉlémentStyledProps } from './RépartitionMétéoÉlément.interface';

const couleurs = {
  chantier: 'var(--text-title-blue-france)',
  'projet structurant': 'var(--text-action-high-pink-tuile)',
};

const RépartitionMétéoÉlémentStyled = styled.div<RépartitionMétéosÉlémentStyledProps>`
  height: 100%;
  padding: 1rem 0.5rem;
  border: 1px solid #e3e3fd;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgb(0 0 18 / 16%);
  
  .météo-picto {
    width: auto;
    height: auto;
  }

  .nombre-de-chantiers {
    color: ${(props) => couleurs[props.typeDeRéforme]};
  }

  .label {
    color: var(--text-action-high-grey);
  }
`;

export default RépartitionMétéoÉlémentStyled;
