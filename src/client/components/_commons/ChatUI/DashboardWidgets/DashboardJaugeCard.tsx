import JaugeDeProgression from "@/components/_commons/JaugeDeProgression/JaugeDeProgression";
import { JaugeDeProgressionCouleur } from "@/components/_commons/JaugeDeProgression/JaugeDeProgression.interface";
import { DashboardCardShell } from "./DashboardCardShell";

export const DashboardJaugeCard = ({
  label,
  footer,
  couleur,
  pourcentage,
}: {
  label: string;
  footer: string;
  couleur: JaugeDeProgressionCouleur;
  pourcentage: number | null | undefined;
}) => (
  <DashboardCardShell label={label} footer={footer}>
    <JaugeDeProgression
      couleur={couleur}
      libellé=""
      pourcentage={pourcentage}
      taille="md"
    />
  </DashboardCardShell>
);
