import { useRouter } from 'next/router';
import { TypeDeRéforme } from '@/client/stores/useTypeDeRéformeStore/useTypedeRéformeStore.interface';
import SélecteurRéformeProps from './SélecteurTypeDeRéforme.interface';
import SélecteurRéformeStyled from './SélecteurTypeDeRéforme.styled';

export default function SélecteurTypeDeRéforme({ modifierTypeDeRéformeSélectionné, typeDeRéformeSélectionné }: SélecteurRéformeProps) {
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

  const router = useRouter();

  return (
    <SélecteurRéformeStyled className='fr-p-1v'>
      {
          typesDeRéformeÀAfficher.map(typeDeRéforme => (
            <button
              className={`${typeDeRéformeSélectionné === typeDeRéforme.valeur && 'sélectionné fr-text--bold'}`}
              key={typeDeRéforme.valeur}
              onClick={() => router.push('', { query: { ...router.query, reformeType: typeDeRéforme.valeur } }, { shallow: true } )}
              type='button'
            >
              {typeDeRéforme.label}
            </button>
          ))
        }
    </SélecteurRéformeStyled>
  );
}
