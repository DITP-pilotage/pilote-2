import SélecteurRéformeProps, { TypeDeRéforme } from './SélecteurTypeDeRéforme.interface';
import SélecteurRéformeStyled from './SélecteurTypeDeRéforme.styled';

export default function SélecteurTypeDeRéforme({ modifierTypeDeRéformeSélectionné, typeDeRéformeSélectionné }: SélecteurRéformeProps) {
  const typesDeRéformeÀAfficher: { label: string, valeur: TypeDeRéforme }[] = [
    {
      label: 'Chantiers',
      valeur: 'chantier',
    },
    {
      label: 'Projets Structurants',
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
              onClick={() => modifierTypeDeRéformeSélectionné(typeDeRéforme.valeur)}
              type='button'
            >
              {typeDeRéforme.label}
            </button>
          ))
        }
    </SélecteurRéformeStyled>
  );
}
