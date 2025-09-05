import { FunctionComponent } from "react";
import clsx from "clsx";
import IndicateurBloc from "@/components/_commons/IndicateursChantier/Bloc/IndicateurBloc";
import IndicateursChantierStyled from "@/components/_commons/IndicateursChantier/IndicateursChantier.styled";
import { comparerIndicateur } from "@/client/utils/indicateur/indicateur";
import Alerte from "@/components/_commons/Alerte/Alerte";
import {
  CategoriesIndicateur,
  listeRubriquesIndicateursChantier,
} from "@/client/utils/rubriques";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { TitreRubrique } from "./Bloc/Détails/TitreRubrique/TitreRubrique";

interface IndicateursProps {
  estAutoriseAProposerUneValeurAvancement: boolean;
  estAutoriseAAccepterLesPropositionsDeValeurAvancement: boolean;
  alerteMiseAJourIndicateur: boolean;
  categoriesIndicateurRepartition: Record<CategoriesIndicateur, Indicateur[]>;
}

const IndicateursChantier: FunctionComponent<IndicateursProps> = ({
  estAutoriseAProposerUneValeurAvancement,
  estAutoriseAAccepterLesPropositionsDeValeurAvancement,
  alerteMiseAJourIndicateur,
  categoriesIndicateurRepartition,
}) => {
  const { territoireCode, indicateurs, détailsIndicateurs, chantier } =
    pageChantier.useServerSidePropsContext();

  if (indicateurs.length === 0) {
    return null;
  }

  return (
    <IndicateursChantierStyled>
      {alerteMiseAJourIndicateur ? (
        <div className="fr-mb-2w">
          <Alerte titre="Mise à jour des données requise" type="warning" />
        </div>
      ) : null}
      {listeRubriquesIndicateursChantier.map((rubriqueIndicateur) => {
        const indicateursDeCetteRubrique =
          categoriesIndicateurRepartition[
            rubriqueIndicateur.categorieIndicateur
          ];

        if (indicateursDeCetteRubrique.length > 0) {
          return (
            <section
              className="fr-mb-3w sous-rubrique-indicateur"
              id={rubriqueIndicateur.ancre}
              key={rubriqueIndicateur.ancre}
            >
              <button
                aria-controls={`accordion-rubrique-${rubriqueIndicateur.categorieIndicateur}`}
                aria-expanded={rubriqueIndicateur.estAccordeonOuvert}
                className={clsx(
                  "fr-accordion__btn border-b rounded-t-lg fr-py-0 fr-px-3v fr-icon-black",
                  {
                    "!bg-dsfr-blue-france-925 !border-blue-france-sun-113": !(
                      chantier.statut === "ARCHIVE"
                    ),
                    "!bg-dsfr-grey-925 !border-dsfr-grey-200":
                      chantier.statut === "ARCHIVE",
                  },
                )}
                type="button"
              >
                <TitreRubrique
                  classNameTitre={
                    chantier.statut === "ARCHIVE"
                      ? "!text-dsfr-grey-200"
                      : undefined
                  }
                  nombreIndicateurRubrique={indicateursDeCetteRubrique.length}
                  rubriqueDescription={rubriqueIndicateur.description}
                  rubriqueNom={rubriqueIndicateur.nom}
                />
              </button>
              <div
                className="fr-collapse"
                id={`accordion-rubrique-${rubriqueIndicateur.categorieIndicateur}`}
              >
                {indicateursDeCetteRubrique
                  .sort((a, b) =>
                    comparerIndicateur(
                      a,
                      b,
                      détailsIndicateurs[a.id][territoireCode]?.pondération,
                      détailsIndicateurs[b.id][territoireCode]?.pondération,
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
    </IndicateursChantierStyled>
  );
};

export default IndicateursChantier;
