import SousIndicateurBloc from './Bloc/SousIndicateurBloc';
import SousIndicateursProps from './SousIndicateurs.interface';


export default function SousIndicateurs({
  listeSousIndicateurs,
  chantierEstTerritorialisé,
  détailsIndicateurs,
  detailsIndicateursTerritoire,
  estInteractif,
  territoireCode,
  mailleSelectionnee,
}: SousIndicateursProps) {

  const listeClassesCouleursFond = [
    'fr-background-contrast--grey',
    'fr-background-alt--grey',
  ];

  return (
    <>
      {
        listeSousIndicateurs.map((sousIndicateur, index) => (
          <SousIndicateurBloc
            chantierEstTerritorialisé={chantierEstTerritorialisé}
            classeCouleurFond={listeClassesCouleursFond[index % 2]}
            detailsIndicateursTerritoire={detailsIndicateursTerritoire}
            détailsIndicateurs={détailsIndicateurs}
            estDisponibleALImport={false}
            estInteractif={estInteractif}
            indicateur={sousIndicateur}
            key={sousIndicateur.id}
            mailleSelectionnee={mailleSelectionnee}
            territoireCode={territoireCode}
          />
        ))
      }
    </>
  );
}
