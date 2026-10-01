import { FunctionComponent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Bloc from "@/components/_commons/Bloc/Bloc";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { PublicationSection } from "@/components/PageChantier/Publication/PublicationSection";
import {
  CONSIGNE_SYNTHÈSE_DES_RÉSULTATS,
  LIBELLÉ_SYNTHÈSE_DES_RÉSULTATS,
} from "@/client/constants/libellesSyntheseDesResultats";
import {
  LIMITE_CARACTÈRES_SYNTHÈSE_DES_RÉSULTATS,
  validationSynthèseDesRésultatsFormulaire,
} from "@/validation/synthèseDesRésultats";
import { MeteoField } from "./MeteoField";
import { HistoriqueSyntheseDesResultats } from "./HistoriqueSyntheseDesResultats";
import { MeteoSyntheseDesResultats } from "./MeteoSyntheseDesResultats";
import { useSyntheseDesResultatsActions } from "./useSyntheseDesResultatsActions";
import { toMeteoSaisissable } from "./SyntheseDesResultatsValues";

export interface SyntheseDesResultatsProps {
  nomTerritoire: string;
  modeEcriture?: boolean;
}

export const SyntheseDesResultats: FunctionComponent<
  SyntheseDesResultatsProps
> = ({ nomTerritoire, modeEcriture = false }) => {
  const {
    syntheseDesResultats,
    syntheseDesResultatsBrouillon,
    chantier,
    territoireCode,
  } = pageChantier.useServerSidePropsContext();

  const actions = useSyntheseDesResultatsActions({
    chantierId: chantier.id,
    territoireCode,
    syntheseId: syntheseDesResultats?.id,
    brouillonId: syntheseDesResultatsBrouillon?.id,
  });

  return (
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
      <PublicationSection
        actions={actions}
        showLabel={false}
        aside={
          <MeteoSyntheseDesResultats meteo={syntheseDesResultats?.meteo} />
        }
        brouillon={syntheseDesResultatsBrouillon}
        complementConsigneGenerique="à la météo et à la synthèse des résultats"
        consigne={CONSIGNE_SYNTHÈSE_DES_RÉSULTATS}
        formConfig={{
          resolver: zodResolver(validationSynthèseDesRésultatsFormulaire),
          maxLength: LIMITE_CARACTÈRES_SYNTHÈSE_DES_RÉSULTATS,
          editValues: {
            contenu: syntheseDesResultats?.contenu ?? "",
            meteo: toMeteoSaisissable(syntheseDesResultats?.meteo),
          },
          newValues: {
            contenu: syntheseDesResultatsBrouillon?.contenu ?? "",
            meteo: toMeteoSaisissable(syntheseDesResultatsBrouillon?.meteo),
          },
          extraFields: <MeteoField />,
        }}
        historiqueNode={<HistoriqueSyntheseDesResultats />}
        libelle={LIBELLÉ_SYNTHÈSE_DES_RÉSULTATS}
        emptyMessage="Aucune synthèse des résultats."
        modeEcriture={modeEcriture}
        publication={syntheseDesResultats}
      />
    </Bloc>
  );
};
