import Titre from '@/components/_commons/Titre/Titre';
import IndicateursProps from '@/components/_commons/Indicateurs/Indicateurs.interface';
import IndicateurBloc from '@/components/_commons/Indicateurs/Bloc/IndicateurBloc';
import IndicateursStyled from '@/components/_commons/Indicateurs/Indicateurs.styled';
import { comparerIndicateur } from '@/client/utils/indicateur/indicateur';
import { territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';


export default function Indicateurs({ indicateurs, détailsIndicateurs, listeRubriquesIndicateurs, territoireProjetStructurant, typeDeRéforme, chantierEstTerritorialisé, estDisponibleALImport = false, estInteractif = true }: IndicateursProps) {
  const mailleSélectionnée = territoireSélectionnéTerritoiresStore()?.maille ?? 'nationale';
  if (indicateurs.length === 0) {
    return null;
  }

  return (
    <IndicateursStyled>
      {
        listeRubriquesIndicateurs.map(rubriqueIndicateur => {
          const indicateursDeCetteRubrique = indicateurs.filter(ind => ind.type === rubriqueIndicateur.typeIndicateur);

          if (indicateursDeCetteRubrique.length > 0) {
            return (
              <section
                className='fr-mb-3w sous-rubrique-indicateur'
                id={rubriqueIndicateur.ancre}
                key={rubriqueIndicateur.ancre}
              >
                <Titre
                  baliseHtml='h3'
                  className='fr-text--lg fr-mb-1w fr-mx-2w fr-mx-md-0'
                >
                  {rubriqueIndicateur.nom}
                </Titre>
                {
                  indicateursDeCetteRubrique.sort((a, b) => comparerIndicateur(a, b, mailleSélectionnée)).map(indicateur => (
                    <IndicateurBloc
                      chantierEstTerritorialisé={chantierEstTerritorialisé}
                      détailsIndicateur={détailsIndicateurs[indicateur.id]}
                      estDisponibleALImport={estDisponibleALImport}
                      estInteractif={estInteractif}
                      indicateur={indicateur}
                      key={indicateur.id}
                      territoireProjetStructurant={territoireProjetStructurant}
                      typeDeRéforme={typeDeRéforme}
                    />
                  ))
                }
              </section>
            );
          }
        })
      }
    </IndicateursStyled>
  );
}
