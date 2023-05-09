import SélecteurEntitéProps from './SélecteurEntité.interface';
import SélecteurEntitéStyled from './SélecteurEntité.styled';

export default function SélecteurEntité({ modifierEntitéSélectionnée, entitéSélectionnée }: SélecteurEntitéProps) {
  const entitéÀAfficher: { label: string, valeur: 'chantier' | 'projetStructurant' }[] = [
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
    <SélecteurEntitéStyled className='fr-p-1v'>
      {
          entitéÀAfficher.map(entité => (
            <button
              className={`${entitéSélectionnée === entité.valeur && 'sélectionné fr-text--bold'}`}
              key={entité.valeur}
              onClick={() => modifierEntitéSélectionnée(entité.valeur)}
              type='button'
            >
              {entité.label}
            </button>
          ))
        }
    </SélecteurEntitéStyled>
  );
}
