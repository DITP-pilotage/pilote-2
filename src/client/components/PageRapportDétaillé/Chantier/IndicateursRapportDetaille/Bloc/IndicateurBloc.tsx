import { FunctionComponent } from "react";
import Bloc from "@/components/_commons/Bloc/Bloc";
import Titre from "@/components/_commons/Titre/Titre";
import Tableau from "@/components/_commons/Tableau/Tableau";
import { PictoBaromètre } from "@/components/_commons/PictoBaromètre/PictoBaromètre";
import { IndicateurDétailsParTerritoire } from "@/components/PageRapportDétaillé/Chantier/IndicateursRapportDetaille/Bloc/IndicateurBloc.interface";
import { actionsTerritoiresStore } from "@/client/stores/useTerritoiresStore/useTerritoiresStore";
import { DétailsIndicateurs } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { IndicateurTendance } from "@/components/_commons/IndicateurTendance/IndicateurTendance";
import { IndicateurPonderation } from "@/components/_commons/IndicateursChantier/Bloc/Pondération/IndicateurPonderation";
import useIndicateurBloc from "./useIndicateurBloc";
import IndicateurBlocStyled from "./IndicateurBloc.styled";

interface IndicateurBlocProps {
  indicateur: Indicateur;
  détailsIndicateurs: DétailsIndicateurs;
  territoireCode: string;
  typeDeRéforme: "chantier";
}

const IndicateurBloc: FunctionComponent<IndicateurBlocProps> = ({
  indicateur,
  détailsIndicateurs,
  territoireCode,
  typeDeRéforme,
}) => {
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const détailsIndicateur = détailsIndicateurs[indicateur.id];
  const territoireSélectionné = récupérerDétailsSurUnTerritoire(territoireCode);
  const { tableau, dateDeMiseAJourIndicateur } = useIndicateurBloc(
    détailsIndicateur,
    typeDeRéforme,
    territoireSélectionné,
  );

  return (
    <IndicateurBlocStyled
      className="fr-mb-2w impression-section"
      key={indicateur.id}
    >
      <Bloc>
        <section>
          <div className="flex justify-between">
            <div>
              <Titre
                baliseHtml="h4"
                className="fr-text--xl fr-mb-1w flex gap-2 items-center"
              >
                {indicateur.estIndicateurDuBaromètre ? (
                  <PictoBaromètre />
                ) : null}
                {indicateur.nom +
                  (indicateur.unité === null || indicateur.unité === ""
                    ? ""
                    : ` (en ${indicateur.unité?.toLocaleLowerCase()})`)}
              </Titre>
              <div className="fr-ml-2w fr-mb-3w">
                <p className="fr-mb-0 fr-text--xs !text-dsfr-mention-grey">
                  Dernière mise à jour des données (de l'indicateur, toutes
                  zones confondues) :{" "}
                  <span className="fr-text--bold">
                    {dateDeMiseAJourIndicateur}
                  </span>
                </p>
                <IndicateurPonderation
                  indicateurPondération={
                    détailsIndicateur[territoireCode].pondération ?? null
                  }
                  territoireCode={territoireCode}
                />
                <IndicateurTendance
                  tendance={détailsIndicateur[territoireCode].tendance}
                />
              </div>
            </div>
          </div>
          <Tableau<IndicateurDétailsParTerritoire>
            tableau={tableau}
            titre={`Tableau de l'indicateur : ${indicateur.nom}`}
          />
        </section>
      </Bloc>
    </IndicateurBlocStyled>
  );
};

export default IndicateurBloc;
