import { FunctionComponent } from "react";
import JaugeDeProgression from "@/components/_commons/JaugeDeProgression/JaugeDeProgression";
import { clsxm } from "@/utils/clsxm";
import { getLabelTerritoire } from "@/client/constants/territoires";
import api from "@/server/infrastructure/api/trpc/api";
import { WIDGET_STALE_TIME } from "@/components/_commons/Widget/constants";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { useMesureWidget } from "@/components/_commons/Widget/TuileWidget/useMesureWidget";

const MAILLE_ORDER: Record<string, number> = {
  DEPT: 0,
  REG: 1,
  NAT: 2,
};

export const ColonneTauxAvancement: FunctionComponent = () => {
  const { chantierInformations, territoireCode, jalon } =
    pageChantier.useServerSidePropsContext();
  const widget = useMesureWidget();

  const chantierId = chantierInformations.id;

  const [avancements] =
    api.chantier.recupererAvancementChantier.useSuspenseQuery(
      { chantierId, jalon, territoireCode },
      { staleTime: WIDGET_STALE_TIME },
    );

  const sorted = [...avancements].sort(
    (a, b) => (MAILLE_ORDER[a.maille] ?? 99) - (MAILLE_ORDER[b.maille] ?? 99),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="text-center flex flex-col">
        <strong className="fr-mb-0">Taux d'avancement du chantier</strong>
        <span className="fr-mb-0">{jalon}</span>
      </div>
      <div
        className={clsxm("flex", {
          "flex-wrap": widget.largeur < 400,
          "items-center": widget.largeur >= 400,
        })}
      >
        {sorted.map((avancement, index) => {
          const isSelected = avancement.territoireCode === territoireCode;
          const couleur = isSelected ? "bleu" : "bleu-clair";

          return (
            <div
              key={avancement.territoireCode}
              className={clsxm("px-2 py-1", {
                grow: widget.largeur >= 400,
                "basis-full": widget.largeur < 400 && index === 0,
                "basis-1/2": widget.largeur < 400 && index > 0,
              })}
            >
              <JaugeDeProgression
                couleur={couleur}
                date={avancement.dateTauxAvancement}
                libellé={getLabelTerritoire(avancement.territoireCode)}
                pourcentage={avancement.tauxAvancement}
                taille={isSelected ? "lg" : "sm"}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
