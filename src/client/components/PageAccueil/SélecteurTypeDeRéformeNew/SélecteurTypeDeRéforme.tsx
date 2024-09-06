import Link from 'next/link';
import { FunctionComponent } from 'react';
import { TypeDeRéforme } from '@/client/stores/useTypeDeRéformeStore/useTypedeRéformeStore.interface';
import SélecteurRéformeStyled from './SélecteurTypeDeRéforme.styled';

interface SélecteurTypeDeRéformeProps {
  typeDeRéformeSélectionné: TypeDeRéforme
  territoireCode: string
}

const SélecteurTypeDeRéforme: FunctionComponent<SélecteurTypeDeRéformeProps> = ({ typeDeRéformeSélectionné, territoireCode }) => {
  const typesDeRéformeÀAfficher: { label: string, valeur: TypeDeRéforme, href: string }[] = [
    {
      label: 'Chantiers',
      valeur: 'chantier',
      href: 'chantier',
    },
    {
      label: 'Projets structurants',
      valeur: 'projet structurant',
      href: 'projet-structurant',
    },
  ];
      
  return (
    <SélecteurRéformeStyled className='fr-p-1v'>
      {
          typesDeRéformeÀAfficher.map(typeDeRéforme => (
            <Link 
              className={`${typeDeRéformeSélectionné === typeDeRéforme.valeur && 'sélectionné fr-text--bold'}`}
              href={`/accueil/${typeDeRéforme.href}/${territoireCode}`}
              key={typeDeRéforme.valeur}
            >
              <button
                type='button'
              >
                {typeDeRéforme.label}
              </button>
            </Link>
          ))
        }
    </SélecteurRéformeStyled>
  );
};

export default SélecteurTypeDeRéforme;
