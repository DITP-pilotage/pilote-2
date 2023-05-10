import SélecteurRéformeProps, { Réforme } from './SélecteurRéforme.interface';
import SélecteurRéformeStyled from './SélecteurRéforme.styled';

export default function SélecteurRéforme({ modifierRéformeSélectionnée, réformeSélectionnée }: SélecteurRéformeProps) {
  const réformesÀAfficher: { label: string, valeur: Réforme }[] = [
    {
      label: 'Chantiers',
      valeur: 'chantier',
    },
    {
      label: 'Projets Structurants',
      valeur: 'projetStructurant',
    },
  ];
      
  return (
    <SélecteurRéformeStyled className='fr-p-1v'>
      {
          réformesÀAfficher.map(réforme => (
            <button
              className={`${réformeSélectionnée === réforme.valeur && 'sélectionné fr-text--bold'}`}
              key={réforme.valeur}
              onClick={() => modifierRéformeSélectionnée(réforme.valeur)}
              type='button'
            >
              {réforme.label}
            </button>
          ))
        }
    </SélecteurRéformeStyled>
  );
}
