import styled from '@emotion/styled';
import { TypeDeRéforme } from '@/client/stores/useTypeDeRéformeStore/useTypedeRéformeStore.interface';

interface RépartitionMétéosÉlémentStyledProps {
  typeDeRéforme: TypeDeRéforme
  estArchive?: boolean
}

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
    filter: ${({ estArchive }) => estArchive ? 'grayscale(100%)' : undefined};
  }

  .nombre-de-chantiers {
    color: ${({ typeDeRéforme, estArchive }) => estArchive ? 'var(--text-disabled-grey)' : couleurs[typeDeRéforme]};
  }

  .label {
    color: var(--text-action-high-grey);

    @media print {
      font-size: smaller;
    }
  }
`;

export default RépartitionMétéoÉlémentStyled;
