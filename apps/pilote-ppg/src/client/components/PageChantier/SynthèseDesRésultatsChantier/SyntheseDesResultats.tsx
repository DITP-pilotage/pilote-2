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
import { ChampMeteo } from "./ChampMeteo";
import { HistoriqueSyntheseDesResultats } from "./HistoriqueSyntheseDesResultats";
import { MeteoSyntheseDesResultats } from "./MeteoSyntheseDesResultats";
import { useSyntheseDesResultatsActions } from "./useSyntheseDesResultatsActions";
import { meteoSaisissableOuRien } from "./ValeursSyntheseDesResultats";

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
        afficherLibelle={false}
        annexe={
          <MeteoSyntheseDesResultats meteo={syntheseDesResultats?.meteo} />
        }
        brouillon={syntheseDesResultatsBrouillon}
        complementConsigneGenerique="à la météo et à la synthèse des résultats"
        consigne={CONSIGNE_SYNTHÈSE_DES_RÉSULTATS}
        formulaire={{
          resolver: zodResolver(validationSynthèseDesRésultatsFormulaire),
          limiteCaracteres: LIMITE_CARACTÈRES_SYNTHÈSE_DES_RÉSULTATS,
          valeursModification: {
            contenu: syntheseDesResultats?.contenu ?? "",
            meteo: meteoSaisissableOuRien(syntheseDesResultats?.meteo),
          },
          valeursNouvellePublication: {
            contenu: syntheseDesResultatsBrouillon?.contenu ?? "",
            meteo: meteoSaisissableOuRien(syntheseDesResultatsBrouillon?.meteo),
          },
          champsAnnexes: <ChampMeteo />,
        }}
        historiqueNode={<HistoriqueSyntheseDesResultats />}
        libelle={LIBELLÉ_SYNTHÈSE_DES_RÉSULTATS}
        messageAbsence="Aucune synthèse des résultats."
        modeEcriture={modeEcriture}
        publication={syntheseDesResultats}
      />
    </Bloc>
  );
};
