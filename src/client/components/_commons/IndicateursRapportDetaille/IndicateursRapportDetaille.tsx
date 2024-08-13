import Titre from '@/components/_commons/Titre/Titre';
import IndicateursProps from '@/components/_commons/IndicateursRapportDetaille/Indicateurs.interface';
import IndicateurBloc from '@/components/_commons/IndicateursRapportDetaille/Bloc/IndicateurBloc';
import IndicateursStyled from '@/components/_commons/IndicateursRapportDetaille/Indicateurs.styled';
import { comparerIndicateur } from '@/client/utils/indicateur/indicateur';

export default function IndicateursRapportDetaille({
  territoireCode,
  indicateurs,
  détailsIndicateurs,
  listeRubriquesIndicateurs,
  territoireProjetStructurant,
  typeDeRéforme,
  chantierEstTerritorialisé,
  mailleSelectionnee,
  estInteractif = false,
}: IndicateursProps) {
  const codeInseeSélectionnée = territoireCode?.split('-')[1];
  if (indicateurs.length === 0) {
    return null;
  }

  const listeIndicateursParent = indicateurs.filter(indicateur => !indicateur.parentId);

  return (
    <IndicateursStyled>
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
                  !!codeInseeSélectionnée && indicateursDeCetteRubrique
                    .sort((a, b) => comparerIndicateur(a, b, détailsIndicateurs[a.id][codeInseeSélectionnée]?.pondération, détailsIndicateurs[b.id][codeInseeSélectionnée]?.pondération))
                    .map(indicateur => (
                      <IndicateurBloc
                        chantierEstTerritorialisé={chantierEstTerritorialisé}
                        détailsIndicateurs={détailsIndicateurs}
                        estInteractif={estInteractif}
                        indicateur={indicateur}
                        key={indicateur.id}
                        listeSousIndicateurs={indicateurs.filter(ind => ind.parentId === indicateur.id)}
                        mailleSelectionnee={mailleSelectionnee}
                        territoireCode={territoireCode}
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
