import Link from 'next/link';
import { TypeDeRéforme } from '@/client/stores/useTypeDeRéformeStore/useTypedeRéformeStore.interface';
import SélecteurRéformeStyled from './SélecteurTypeDeRéforme.styled';

interface SélecteurTypeDeRéformeProps {
  typeDeRéformeSélectionné: TypeDeRéforme
  territoireCode: string
}

export default function SélecteurTypeDeRéforme({ typeDeRéformeSélectionné, territoireCode }: SélecteurTypeDeRéformeProps) {
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
              type='button'
            >
              {typeDeRéforme.label}
            </Link>
          ))
        }
    </SélecteurRéformeStyled>
  );
}
