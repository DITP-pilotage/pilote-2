import { ReactNode } from "react";
import { useController, useWatch } from "react-hook-form";
import CompteurCaractères from "@/components/_commons/CompteurCaractères/CompteurCaractères";
import { EditeurSimple } from "@/components/_commons/EditeurRiche/EditeurSimple";
import { extractVisibleText } from "@/utils/extractVisibleText";
import { clsxm } from "@/utils/clsxm";
import { PublicationValues } from "./Publication.interface";

const ContentField = ({
  maxLength,
  className,
  editorClassName,
}: {
  maxLength: number;
  className?: string;
  editorClassName?: string;
}) => {
  const { field, fieldState } = useController<PublicationValues, "contenu">({
    name: "contenu",
  });
  const contenu = useWatch<PublicationValues>({ name: "contenu" });

  return (
    <div
      className={clsxm(
        "flex flex-col",
        fieldState.error && "fr-input-group--error",
        className,
      )}
    >
      <div className={editorClassName}>
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
          limiteDeCaractères={maxLength}
        />
      </div>
    </div>
  );
};

export const PublicationFormFields = ({
  maxLength,
  extraFields,
  editorClassName,
}: {
  maxLength: number;
  extraFields?: ReactNode;
  editorClassName?: string;
}) =>
  extraFields ? (
    <div className="flex gap-4 items-stretch">
      <div className="flex-none w-60">{extraFields}</div>
      <ContentField
        className="flex-1"
        editorClassName={editorClassName}
        maxLength={maxLength}
      />
    </div>
  ) : (
    <ContentField editorClassName={editorClassName} maxLength={maxLength} />
  );
