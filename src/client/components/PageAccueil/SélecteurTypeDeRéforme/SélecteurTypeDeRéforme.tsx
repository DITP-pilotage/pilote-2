import { FunctionComponent } from 'react';
import { TypeDeRéforme } from '@/client/stores/useTypeDeRéformeStore/useTypedeRéformeStore.interface';
import SélecteurRéformeStyled from './SélecteurTypeDeRéforme.styled';

interface SélecteurTypeDeRéformeProps {
  typeDeRéformeSélectionné: TypeDeRéforme
  modifierTypeDeRéformeSélectionné: () => void
}

const SélecteurTypeDeRéforme: FunctionComponent<SélecteurTypeDeRéformeProps> = ({ modifierTypeDeRéformeSélectionné, typeDeRéformeSélectionné }) => {
  const typesDeRéformeÀAfficher: { label: string, valeur: TypeDeRéforme }[] = [
    {
      label: 'Chantiers',
      valeur: 'chantier',
    },
    {
      label: 'Projets structurants',
      valeur: 'projet structurant',
    },
  ];
      
  return (
    <SélecteurRéformeStyled className='fr-p-1v'>
      {
        typesDeRéformeÀAfficher.map(typeDeRéforme => (
          <button
            className={`${typeDeRéformeSélectionné === typeDeRéforme.valeur && 'sélectionné fr-text--bold'}`}
            key={typeDeRéforme.valeur}
            onClick={() => modifierTypeDeRéformeSélectionné()}
            type='button'
          >
            {typeDeRéforme.label}
          </button>
        ))
      }
    </SélecteurRéformeStyled>
  );
};

export default SélecteurTypeDeRéforme;
