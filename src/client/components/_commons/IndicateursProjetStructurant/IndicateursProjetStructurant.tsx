import Titre from '@/components/_commons/Titre/Titre';
import IndicateursProps
  from '@/components/_commons/IndicateursProjetStructurant/IndicateursProjetStructurant.interface';
import IndicateurBloc from '@/components/_commons/IndicateursProjetStructurant/Bloc/IndicateurBloc';
import IndicateursProjetStructurantStyled
  from '@/components/_commons/IndicateursProjetStructurant/IndicateursProjetStructurant.styled';
import { comparerIndicateur } from '@/client/utils/indicateur/indicateur';
import { territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';

export default function IndicateursProjetStructurant({
  indicateurs,
  détailsIndicateurs,
  listeRubriquesIndicateurs,
  territoireProjetStructurant,
  typeDeRéforme,
  chantierEstTerritorialisé,
  estInteractif = true,
}: IndicateursProps) {
  const CodeInseeSélectionnée = territoireSélectionnéTerritoiresStore()?.codeInsee;

  if (indicateurs.length === 0) {
    return null;
  }

  const listeIndicateursParent = indicateurs.filter(indicateur => !indicateur.parentId);

  return (
    <IndicateursProjetStructurantStyled>
      {
        listeRubriquesIndicateurs.map(rubriqueIndicateur => {
          const indicateursDeCetteRubrique = listeIndicateursParent.filter(ind => ind.type === rubriqueIndicateur.typeIndicateur);

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
                  !!CodeInseeSélectionnée && indicateursDeCetteRubrique
                    .sort((a, b) => comparerIndicateur(a, b, détailsIndicateurs[a.id][CodeInseeSélectionnée]?.pondération, détailsIndicateurs[b.id][CodeInseeSélectionnée]?.pondération))
                    .map(indicateur => (
                      <IndicateurBloc
                        chantierEstTerritorialisé={chantierEstTerritorialisé}
                        détailsIndicateurs={détailsIndicateurs}
                        estInteractif={estInteractif}
                        indicateur={indicateur}
                        key={indicateur.id}
                        listeSousIndicateurs={indicateurs.filter(ind => ind.parentId === indicateur.id)}
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
    </IndicateursProjetStructurantStyled>
  );
}
