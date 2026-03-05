import { parseAsBoolean, parseAsStringLiteral, useQueryState } from "nuqs";
import { FunctionComponent } from "react";
import Bloc from "@/components/_commons/Bloc/Bloc";
import { MeteoPicto } from "@/components/_commons/Meteo/Picto/MeteoPicto";
import MétéoBadge from "@/components/_commons/Meteo/Badge/MétéoBadge";
import SynthèseDesRésultatsHistorique from "@/components/PageChantier/SynthèseDesRésultatsChantier/Historique/Historique";
import Alerte from "@/components/_commons/Alerte/Alerte";
import SynthèseDesRésultatsAffichage from "@/components/PageChantier/SynthèseDesRésultatsChantier/Affichage/Affichage";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import SyntheseDesResultatsFormulaire from "@/components/PageChantier/SynthèseDesRésultatsChantier/SyntheseDesResultatsFormulaire/SyntheseDesResultatsFormulaire";
import { BoutonNouvelleSyntheseDesResultats } from "@/components/PageChantier/SynthèseDesRésultatsChantier/BoutonNouvelleSyntheseDesResultats/BoutonNouvelleSyntheseDesResultats";
import BandeauInformation from "@/components/_commons/BandeauInformation/BandeauInformation";
import { formaterDate } from "@/client/utils/date/date";

export interface SyntheseDesResultatsProps {
  nomTerritoire: string;
  modeEcriture?: boolean;
}

const SyntheseDesResultats: FunctionComponent<SyntheseDesResultatsProps> = ({
  nomTerritoire,
  modeEcriture = false,
}) => {
  const { syntheseDesResultats, chantier } =
    pageChantier.useServerSidePropsContext();

  const [action] = useQueryState(
    "_action",
    parseAsStringLiteral(["creation-reussie", ""]),
  );
  const [modeÉdition, setModeÉdition] = useQueryState(
    "edition",
    parseAsBoolean.withDefault(false).withOptions({
      history: "push",
      shallow: false,
      clearOnDefault: true,
    }),
  );

  return (
    <div>
      <Bloc
        backgroundClassNameTitre={
          chantier.statut === "ARCHIVE"
            ? "bg-dsfr-grey-925"
            : "bg-dsfr-blue-france-925"
        }
        className="h-full"
        contenuClassesSupplémentaires=""
        titre={nomTerritoire}
      >
        {syntheseDesResultats?.dateDernierBrouillon ? (
          <BandeauInformation bandeauType="INFO">
            {`Vous avez enregistré un nouveau commentaire en tant que brouillon le ${formaterDate(syntheseDesResultats?.dateDernierBrouillon, "DD/MM/YYYY")}`}
          </BandeauInformation>
        ) : null}
        <div className="p-4">
          {modeÉdition && modeEcriture ? (
            <SyntheseDesResultatsFormulaire
              annulationCallback={() => setModeÉdition(false)}
            />
          ) : (
            <>
              {action === "creation-reussie" && (
                <div className="fr-mb-2w">
                  <Alerte
                    titre="Votre commentaire a bien été modifié"
                    type="succès"
                  />
                </div>
              )}
              <div className="flex gap-4 pt-2">
                <div className="flex flex-col gap-4 align-center">
                  <MétéoBadge
                    météo={syntheseDesResultats?.météo ?? "NON_RENSEIGNEE"}
                  />
                  {syntheseDesResultats ? (
                    <MeteoPicto meteo={syntheseDesResultats.météo} />
                  ) : null}
                </div>
                <div>
                  <SynthèseDesRésultatsAffichage
                    itemHistoriqueSyntheseDesResultats={syntheseDesResultats}
                    onModifier={
                      modeEcriture ? () => setModeÉdition(true) : undefined
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end items-center gap-4 mt-2">
                {!!syntheseDesResultats ? (
                  <SynthèseDesRésultatsHistorique />
                ) : null}
                {modeEcriture && <BoutonNouvelleSyntheseDesResultats />}
              </div>
            </>
          )}
        </div>
      </Bloc>
    </div>
  );
};

export default SyntheseDesResultats;
