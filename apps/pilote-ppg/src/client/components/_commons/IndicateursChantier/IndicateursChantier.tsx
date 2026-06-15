import { FunctionComponent } from "react";
import IndicateurBloc from "@/components/_commons/IndicateursChantier/Bloc/IndicateurBloc";
import { comparerIndicateur } from "@/client/utils/indicateur/indicateur";
import Alerte from "@/components/_commons/Alerte/Alerte";
import {
  CategoriesIndicateur,
  listeRubriquesIndicateursChantier,
} from "@/client/utils/rubriques";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { clsxm } from "@/utils/clsxm";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import { TitreRubrique } from "./Bloc/Détails/TitreRubrique/TitreRubrique";

interface IndicateursProps {
  estAutoriseAProposerUneValeurAvancement: boolean;
  estAutoriseAAccepterLesPropositionsDeValeurAvancement: boolean;
  alerteMiseAJourIndicateur: boolean;
  categoriesIndicateurRepartition: Record<CategoriesIndicateur, Indicateur[]>;
  indicateursApplicablesIds: string[];
}

const IndicateursChantier: FunctionComponent<IndicateursProps> = ({
  estAutoriseAProposerUneValeurAvancement,
  estAutoriseAAccepterLesPropositionsDeValeurAvancement,
  alerteMiseAJourIndicateur,
  categoriesIndicateurRepartition,
  indicateursApplicablesIds,
}) => {
  const { territoireCode, indicateurs, détailsIndicateurs, chantier } =
    pageChantier.useServerSidePropsContext();

  if (indicateurs.length === 0) {
    return null;
  }

  if (indicateursApplicablesIds.length === 0) {
    return (
      <Alerte
        titre="Aucun indicateur n'est applicable pour les territoires sélectionnés"
        type="info"
      />
    );
  }

  return (
    <section>
      {alerteMiseAJourIndicateur && chantier.statut !== "ARCHIVE" ? (
        <div className="fr-mb-2w">
          <Alerte titre="Mise à jour des données requise" type="warning" />
        </div>
      ) : null}
      {listeRubriquesIndicateursChantier.map((rubriqueIndicateur) => {
        const indicateursDeCetteRubrique = categoriesIndicateurRepartition[
          rubriqueIndicateur.categorieIndicateur
        ].filter((indicateur) =>
          indicateursApplicablesIds.includes(indicateur.id),
        );

        if (indicateursDeCetteRubrique.length > 0) {
          return (
            <section
              className="mb-6 last-of-type:mb-0"
              id={rubriqueIndicateur.ancre}
              key={rubriqueIndicateur.ancre}
            >
              <div className="flex items-center">
                <button
                  aria-controls={`accordion-rubrique-${rubriqueIndicateur.categorieIndicateur}`}
                  aria-expanded={rubriqueIndicateur.estAccordeonOuvert}
                  className={clsxm(
                    "fr-accordion__btn border-b rounded-t-lg fr-py-0 fr-px-3v !text-black flex-1",
                    {
                      "!bg-dsfr-blue-france-925 !border-dsfr-blue-france-sun-113":
                        chantier.statut !== "ARCHIVE",
                      "!bg-dsfr-grey-925 !border-dsfr-grey-200":
                        chantier.statut === "ARCHIVE",
                    },
                  )}
                  type="button"
                >
                  <TitreRubrique
                    classNameTitre={
                      chantier.statut === "ARCHIVE"
                        ? "!m-0 !text-dsfr-grey-200"
                        : "!m-0"
                    }
                    nombreIndicateurRubrique={indicateursDeCetteRubrique.length}
                    rubriqueNom={rubriqueIndicateur.nom}
                  />
                </button>
                {rubriqueIndicateur.description ? (
                  <Infobulle classNameIcone="w-5 h-5 ml-1">
                    {rubriqueIndicateur.description}
                  </Infobulle>
                ) : null}
              </div>
              <div
                className="fr-collapse"
                id={`accordion-rubrique-${rubriqueIndicateur.categorieIndicateur}`}
              >
                {indicateursDeCetteRubrique
                  .sort((a, b) =>
                    comparerIndicateur(
                      a,
                      b,
                      détailsIndicateurs[a.id][territoireCode]?.ponderation,
                      détailsIndicateurs[b.id][territoireCode]?.ponderation,
                    ),
                  )
                  .map((indicateur) => {
                    return (
                      <IndicateurBloc
                        estAutoriseAAccepterLesPropositionsDeValeurAvancement={
                          estAutoriseAAccepterLesPropositionsDeValeurAvancement
                        }
                        estAutoriseAProposerUneValeurAvancement={
                          estAutoriseAProposerUneValeurAvancement
                        }
                        indicateur={indicateur}
                        key={indicateur.id}
                      />
                    );
                  })}
              </div>
            </section>
          );
        }
      })}
    </section>
  );
};

export default IndicateursChantier;
