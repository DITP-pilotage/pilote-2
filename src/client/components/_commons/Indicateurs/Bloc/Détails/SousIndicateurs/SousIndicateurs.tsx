import SousIndicateurBloc from './Bloc/SousIndicateurBloc';
import SousIndicateursProps from './SousIndicateurs.interface';


export default function SousIndicateurs({
  listeSousIndicateurs,
  chantierEstTerritorialisé,
  détailsIndicateurs,
  estAutoriseAVoirLesAlertesMAJIndicateurs = false,
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
            détailsIndicateurs={détailsIndicateurs}
            estAutoriseAVoirLesAlertesMAJIndicateurs={estAutoriseAVoirLesAlertesMAJIndicateurs}
            estDisponibleALImport={false}
            estInteractif
            indicateur={sousIndicateur}
            key={sousIndicateur.id}
          />   
        ))
      }
    </>
  );
}
