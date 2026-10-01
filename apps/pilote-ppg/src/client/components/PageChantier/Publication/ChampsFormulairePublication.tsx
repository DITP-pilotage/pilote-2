import { ReactNode } from "react";
import { useController, useWatch } from "react-hook-form";
import CompteurCaractères from "@/components/_commons/CompteurCaractères/CompteurCaractères";
import { EditeurSimple } from "@/components/_commons/EditeurRiche/EditeurSimple";
import { extractVisibleText } from "@/utils/extractVisibleText";
import { clsxm } from "@/utils/clsxm";
import { ValeursPublication } from "./Publication.interface";

const ChampContenu = ({
  limiteCaracteres,
  className,
  classNameEditeur,
}: {
  limiteCaracteres: number;
  className?: string;
  classNameEditeur?: string;
}) => {
  const { field, fieldState } = useController<ValeursPublication, "contenu">({
    name: "contenu",
  });
  const contenu = useWatch<ValeursPublication>({ name: "contenu" });

  return (
    <div
      className={clsxm(
        "flex flex-col",
        fieldState.error && "fr-input-group--error",
        className,
      )}
    >
      <div className={classNameEditeur}>
        <EditeurSimple
          contenu={field.value}
          onBlur={field.onBlur}
          onChange={field.onChange}
        />
      </div>
      <div className="flex justify-between mt-1">
        <div>
          {fieldState.error ? (
            <p className="fr-error-text mt-0 mr-4">
              {fieldState.error.message}
            </p>
          ) : null}
        </div>
        <CompteurCaractères
          compte={extractVisibleText(contenu ?? "").length}
          limiteDeCaractères={limiteCaracteres}
        />
      </div>
    </div>
  );
};

export const ChampsFormulairePublication = ({
  limiteCaracteres,
  champsAnnexes,
  classNameEditeur,
}: {
  limiteCaracteres: number;
  champsAnnexes?: ReactNode;
  classNameEditeur?: string;
}) =>
  champsAnnexes ? (
    <div className="flex gap-4 items-stretch">
      <div className="flex-none w-60">{champsAnnexes}</div>
      <ChampContenu
        className="flex-1"
        classNameEditeur={classNameEditeur}
        limiteCaracteres={limiteCaracteres}
      />
    </div>
  ) : (
    <ChampContenu
      classNameEditeur={classNameEditeur}
      limiteCaracteres={limiteCaracteres}
    />
  );
