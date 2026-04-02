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
          <div className="py-2 flex flex-col gap-3 flex-wrap justify-center align-center">
            <div className="flex flex-col items-center">
              <strong className="fr-mb-0 text-center">
                Situation par rapport aux autres{" "}
                {getLabelMaille(territoireCode)}
              </strong>
              <span>{jalon}</span>
            </div>
            <EcartTauxAvancementPPG
              ecart={situation.ecart}
              estArchive={estArchive}
            />
            {situation.mediane !== null && (
              <p className="text-sm text-center fr-mb-0">
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
      <div className="py-2 flex flex-col gap-3 justify-center align-center">
        <div className="flex flex-col items-center">
          <strong className="fr-mb-0 text-center">Evolution temporelle</strong>
          <span>{jalon}</span>
        </div>
        <BadgeTendance
          estArchive={estArchive}
          tendance={situation.tendance as ChantierTendance | null}
        />
        <div className="text-sm text-center">
          <strong className="mr-1">tendance</strong>
          du taux d'avancement par rapport au taux précédemment mesuré
          {situation.tauxAvancementPrecedent !== null &&
          situation.dateTauxAvancementPrecedent !== null ? (
            <>
              {" "}
              (
              <strong className="text-primary">
                {situation.tauxAvancementPrecedent.toFixed(0)}%
              </strong>
              {", "}
              <span className="fr-text-mention--grey">
                {formaterDate(situation.dateTauxAvancementPrecedent, "MM/YYYY")}
              </span>
              )
            </>
          ) : (
            <span className="fr-m-0 bold text-primary">(Non défini)</span>
          )}
        </div>
      </div>
    </div>
  );
};
