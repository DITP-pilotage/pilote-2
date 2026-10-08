import IndicateursProps from "@/components/PageRapportDétaillé/Chantier/IndicateursRapportDetaille/Indicateurs.interface";
import IndicateurBloc from "@/components/PageRapportDétaillé/Chantier/IndicateursRapportDetaille/Bloc/IndicateurBloc";
import { comparerIndicateur } from "@/client/utils/indicateur/indicateur";
import { listeRubriquesIndicateursChantier } from "@/client/utils/rubriques";

export default function IndicateursRapportDetaille({
  territoireCode,
  indicateurs,
  détailsIndicateurs,
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
              <h3 className="text-lg mb-2 mx-4 md:mx-0">
                {`${rubriqueIndicateur.nom} (${indicateursDeCetteRubrique.length})`}
              </h3>
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
