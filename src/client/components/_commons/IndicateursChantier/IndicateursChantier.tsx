import { FunctionComponent } from "react";
import IndicateurBloc from "@/components/_commons/IndicateursChantier/Bloc/IndicateurBloc";
import IndicateursChantierStyled from "@/components/_commons/IndicateursChantier/IndicateursChantier.styled";
import { comparerIndicateur } from "@/client/utils/indicateur/indicateur";
import Alerte from "@/components/_commons/Alerte/Alerte";
import {
  CategoriesIndicateur,
  listeRubriquesIndicateursChantier,
} from "@/client/utils/rubriques";
import {
  DétailsIndicateurs,
  DétailsIndicateurTerritoire,
} from "@/server/domain/indicateur/DétailsIndicateur.interface";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { CartographieIndicateurType } from "./Bloc/Détails/IndicateurDétails";
import TitreRubrique from "./Bloc/Détails/TitreRubrique/TitreRubrique";

interface IndicateursProps {
  indicateurs: Indicateur[];
  détailsIndicateurs: DétailsIndicateurs;
  detailsIndicateursTerritoire: Record<string, DétailsIndicateurTerritoire>;
  chantierEstTerritorialisé: boolean;
  estInteractif?: boolean;
  estAutoriseAProposerUneValeurAvancement?: boolean;
  territoireCode: string;
  territoiresCompares: string[];
  mailleQuery: MailleInterne;
  mailleSelectionnee: MailleInterne;
  alerteMiseAJourIndicateur: boolean;
  mailsDirecteursProjets: string[];
  jalon: number;
  cartographieDroiteIndicateur: CartographieIndicateurType;
  cartographieGaucheIndicateur: CartographieIndicateurType;
  categoriesIndicateurRepartition: Record<CategoriesIndicateur, Indicateur[]>;
  sousIndicateursDisponibles: boolean;
}

const IndicateursChantier: FunctionComponent<IndicateursProps> = ({
  indicateurs,
  détailsIndicateurs,
  detailsIndicateursTerritoire,
  chantierEstTerritorialisé,
  estInteractif = true,
  estAutoriseAProposerUneValeurAvancement:
    estAutoriseAProposerUneValeurAvancement = false,
  territoireCode,
  territoiresCompares,
  mailleQuery,
  mailleSelectionnee,
  alerteMiseAJourIndicateur,
  mailsDirecteursProjets,
  jalon,
  cartographieDroiteIndicateur,
  cartographieGaucheIndicateur,
  categoriesIndicateurRepartition,
  sousIndicateursDisponibles,
}) => {
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
                className="fr-accordion__btn fr-accordion_custom fr-py-0 fr-px-3v fr-icon-black"
                type="button"
              >
                <TitreRubrique
                  nombreIndicateurRubrique={indicateursDeCetteRubrique.length}
                  rubriqueAncre={rubriqueIndicateur.ancre}
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
                    const listeSousIndicateurs = !!sousIndicateursDisponibles
                      ? indicateurs.filter(
                          (ind) => ind.parentId === indicateur.id,
                        )
                      : [];
                    return (
                      <IndicateurBloc
                        cartographieDroiteIndicateur={
                          cartographieDroiteIndicateur
                        }
                        cartographieGaucheIndicateur={
                          cartographieGaucheIndicateur
                        }
                        chantierEstTerritorialisé={chantierEstTerritorialisé}
                        detailsIndicateursTerritoire={
                          detailsIndicateursTerritoire
                        }
                        détailsIndicateurs={détailsIndicateurs}
                        estAutoriseAProposerUneValeurAvancement={
                          estAutoriseAProposerUneValeurAvancement
                        }
                        estInteractif={estInteractif}
                        indicateur={indicateur}
                        jalon={jalon}
                        key={indicateur.id}
                        listeSousIndicateurs={listeSousIndicateurs}
                        mailleQuery={mailleQuery}
                        mailleSelectionnee={mailleSelectionnee}
                        mailsDirecteursProjets={mailsDirecteursProjets}
                        territoireCode={territoireCode}
                        territoiresCompares={territoiresCompares}
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
