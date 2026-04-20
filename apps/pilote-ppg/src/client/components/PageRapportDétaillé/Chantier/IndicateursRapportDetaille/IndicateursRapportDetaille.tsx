import Titre from "@/components/_commons/Titre/Titre";
import IndicateursProps from "@/components/PageRapportDétaillé/Chantier/IndicateursRapportDetaille/Indicateurs.interface";
import IndicateurBloc from "@/components/PageRapportDétaillé/Chantier/IndicateursRapportDetaille/Bloc/IndicateurBloc";
import { comparerIndicateur } from "@/client/utils/indicateur/indicateur";
import { listeRubriquesIndicateursChantier } from "@/client/utils/rubriques";

export default function IndicateursRapportDetaille({
  territoireCode,
  indicateurs,
  détailsIndicateurs,
  typeDeRéforme,
  categoriesIndicateurRepartition,
  jalon,
}: IndicateursProps) {
  const codeInseeSélectionnée = territoireCode?.split("-")[1];
  if (indicateurs.length === 0) {
    return null;
  }

  return (
    <section>
      {listeRubriquesIndicateursChantier.map((rubriqueIndicateur) => {
        const indicateursDeCetteRubrique =
          categoriesIndicateurRepartition[
            rubriqueIndicateur.categorieIndicateur
          ];

        if (indicateursDeCetteRubrique.length > 0) {
          return (
            <section
              className="mb-6 last-of-type:mb-0"
              id={rubriqueIndicateur.ancre}
              key={rubriqueIndicateur.ancre}
            >
              <Titre
                baliseHtml="h3"
                className="fr-text--lg fr-mb-1w fr-mx-2w fr-mx-md-0"
              >
                {`${rubriqueIndicateur.nom} (${indicateursDeCetteRubrique.length})`}
              </Titre>
              {!!codeInseeSélectionnée &&
                indicateursDeCetteRubrique
                  .sort((a, b) =>
                    comparerIndicateur(
                      a,
                      b,
                      détailsIndicateurs[a.id][codeInseeSélectionnée]
                        ?.ponderation,
                      détailsIndicateurs[b.id][codeInseeSélectionnée]
                        ?.ponderation,
                    ),
                  )
                  .map((indicateur) => {
                    return (
                      <IndicateurBloc
                        détailsIndicateurs={détailsIndicateurs}
                        indicateur={indicateur}
                        jalon={jalon}
                        key={indicateur.id}
                        territoireCode={territoireCode}
                        typeDeRéforme={typeDeRéforme}
                      />
                    );
                  })}
            </section>
          );
        }
      })}
    </section>
  );
}
