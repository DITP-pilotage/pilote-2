import { FunctionComponent } from "react";
import EcartTauxAvancementPPG from "@/components/PageChantier/AvancementChantier/EcartTauxAvancementPPG/EcartTauxAvancementPPG";
import { BadgeTendance } from "@/components/PageAccueil/PageChantiers/TableauChantiers/Tendance/BadgeTendance";
import { ChantierTendance } from "@/server/domain/chantier/Chantier.interface";
import { formaterDate } from "@/client/utils/date/date";
import api from "@/server/infrastructure/api/trpc/api";
import { WIDGET_STALE_TIME } from "@/components/_commons/Widget/constants";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";

const getLabelMaille = (territoireCode: string): string => {
  if (territoireCode.startsWith("DEPT-")) return "départements";
  if (territoireCode.startsWith("REG-")) return "régions";
  return "territoires";
};

export const ColonneSituation: FunctionComponent = () => {
  const { chantierInformations, territoireCode, jalon, chantier } =
    pageChantier.useServerSidePropsContext();

  const chantierId = chantierInformations.id;
  const estArchive = chantier.statut === "ARCHIVE";
  const isNational = territoireCode === "NAT-FR";

  const [situation] = api.chantier.recupererSituationChantier.useSuspenseQuery(
    { chantierId, jalon, territoireCode },
    { staleTime: WIDGET_STALE_TIME },
  );

  return (
    <div className="flex flex-col flex-wrap justify-center align-center">
      {!isNational && (
        <>
          <div className="py-2 flex flex-col flex-wrap justify-center align-center">
            <strong className="text-xs fr-mb-0 text-center">
              Situation par rapport aux autres {getLabelMaille(territoireCode)}
            </strong>
            <span className="text-sm ml-1 mb-2">{jalon}</span>
            <EcartTauxAvancementPPG
              ecart={situation.ecart}
              estArchive={estArchive}
            />
            {situation.mediane !== null && (
              <p className="text-xs mt-2 text-center">
                <strong className="mr-1">écart</strong>
                du taux d'avancement par rapport à la médiane (
                <strong className="text-pilote-ecart-blue">
                  {situation.mediane.toFixed(0)}%
                </strong>
                )
              </p>
            )}
          </div>
          <hr className="fr-hr py-2" />
        </>
      )}
      <div className="py-2 flex flex-col flex-wrap justify-center align-center">
        <strong className="text-xs fr-mb-0 text-center">
          Evolution temporelle
        </strong>
        <p className="text-sm ml-1 mb-2">{jalon}</p>
        <BadgeTendance
          estArchive={estArchive}
          tendance={situation.tendance as ChantierTendance | null}
        />
        <div className="text-xs fr-mb-0 mt-2 text-center">
          <strong className="mr-1">tendance</strong>
          du taux d'avancement par rapport au taux précédemment mesuré
          {situation.tauxAvancementPrecedent !== null &&
          situation.dateTauxAvancementPrecedent !== null ? (
            <div className="flex justify-center">
              ({" "}
              <strong className="text-primary">
                {situation.tauxAvancementPrecedent.toFixed(0)}%
              </strong>
              {", "}
              <p className="text-xs fr-text-mention--grey fr-mb-0 ml-1">
                {formaterDate(situation.dateTauxAvancementPrecedent, "MM/YYYY")}
              </p>
              )
            </div>
          ) : (
            <p className="text-xs fr-m-0 bold text-primary">(Non défini)</p>
          )}
        </div>
      </div>
    </div>
  );
};
