import { FunctionComponent } from "react";
import { clsxm } from "@/utils/clsxm";

export type EtatIndicateur = "true" | "false";

interface SélecteurRéformeProps {
  value: string;
  onChange: (value: string) => void;
  estEnCoursDeModification: boolean;
}

export const SélecteurIndicateurActif: FunctionComponent<
  SélecteurRéformeProps
> = ({ onChange, value, estEnCoursDeModification }) => {
  const etatIndicateurÀAfficher: {
    label: string;
    valeur: EtatIndicateur;
    className: string;
  }[] = [
    {
      label: "Actif",
      valeur: "true",
      className: "actif",
    },
    {
      label: "Inactif",
      valeur: "false",
      className: "inactif",
    },
  ];

  return (
    <div className="flex rounded bg-dsfr-alt-blue-france !p-1 w-60 h-15 gap-2">
      {etatIndicateurÀAfficher.map((etatIndicateur) => (
        <button
          className={clsxm("w-1/2 rounded", {
            "!text-dsfr-grey-625 !bg-primary bold !text-white disabled:!bg-dsfr-grey-625":
              value === etatIndicateur.valeur,
            "!bg-error":
              value === etatIndicateur.valeur &&
              etatIndicateur.className === "inactif",
          })}
          disabled={!estEnCoursDeModification}
          key={etatIndicateur.valeur}
          onClick={() => onChange(etatIndicateur.valeur)}
          type="button"
        >
          {etatIndicateur.label} {estEnCoursDeModification}
        </button>
      ))}
    </div>
  );
};
