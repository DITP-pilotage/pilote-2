import { pagePilotage } from "@/components/PagePilotage/PagePilotageServerSideContext";

export const useObjectifsCount = () => {
  const { fichesEvaluation } =
    pagePilotage.useServerSidePropsContext().pilotage;
  return fichesEvaluation.reduce(
    (max, fiche) => Math.max(max, fiche.objectifs.length),
    0,
  );
};
