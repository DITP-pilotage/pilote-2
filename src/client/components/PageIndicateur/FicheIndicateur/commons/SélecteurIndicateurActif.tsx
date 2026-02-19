import { FunctionComponent } from "react";
import { SegmentedControl } from "@/components/shared/SegmentedControl";

export type EtatIndicateur = "true" | "false";

interface SélecteurRéformeProps {
  value: string;
  onChange: (value: string) => void;
  estEnCoursDeModification: boolean;
}

const etatIndicateurÀAfficher: {
  label: string;
  valeur: EtatIndicateur;
}[] = [
  { label: "Actif", valeur: "true" },
  { label: "Inactif", valeur: "false" },
];

export const SélecteurIndicateurActif: FunctionComponent<
  SélecteurRéformeProps
> = ({ onChange, value, estEnCoursDeModification }) => {
  return (
    <SegmentedControl.Root
      className="w-60 h-15"
      disabled={!estEnCoursDeModification}
      onValueChange={(newValue) => {
        if (newValue) onChange(newValue);
      }}
      type="single"
      value={value}
    >
      {etatIndicateurÀAfficher.map((etatIndicateur) => (
        <SegmentedControl.Item
          className={
            value === etatIndicateur.valeur && etatIndicateur.valeur === "false"
              ? "data-[state=on]:bg-error"
              : undefined
          }
          key={etatIndicateur.valeur}
          value={etatIndicateur.valeur}
        >
          {etatIndicateur.label}
        </SegmentedControl.Item>
      ))}
    </SegmentedControl.Root>
  );
};
