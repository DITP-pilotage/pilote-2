import ResponsablesLigneProps from './ResponsablesLigne.interface';

export default function ResponsablesLigne({ label, contenu }: ResponsablesLigneProps) {
  return (
    <div className='fr-pl-2w fr-grid-row'>
      <p className='fr-text--sm fr-text--bold fr-col fr-mr-4w'>
        {label}
      </p>
      <p className='fr-text--sm fr-col'>
        { 
          contenu.length > 0 
            ? contenu.map((élément, i) => {
              return i === contenu.length - 1 ? élément : élément + ', ';
            })
            : 'Non Renseigné' 
          }
      </p>
    </div>
  );
}
