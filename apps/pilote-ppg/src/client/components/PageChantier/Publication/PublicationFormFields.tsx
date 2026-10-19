import {
  ERROR_GROUP_CLASSES,
  ERROR_TEXT_CLASSES,
} from "@/components/shared/fieldTextClasses";
import { ReactNode } from "react";
import { useController, useWatch } from "react-hook-form";
import CompteurCaractères from "@/components/_commons/CompteurCaractères/CompteurCaractères";
import { EditeurSimple } from "@/components/_commons/EditeurRiche/EditeurSimple";
import { extractVisibleText } from "@/utils/extractVisibleText";
import { clsxm } from "@/utils/clsxm";
import { PublicationValues } from "./Publication.interface";

const ContentField = ({
  maxLength,
  label,
  className,
  editorClassName,
}: {
  maxLength: number;
  label?: string;
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
        fieldState.error && ERROR_GROUP_CLASSES,
        className,
      )}
    >
      {label ? <p className="text-sm mb-2">{label}</p> : null}
      <div
        className={clsxm("flex flex-auto flex-col min-h-0", editorClassName)}
      >
        <EditeurSimple
          contenu={field.value}
          onBlur={field.onBlur}
          onChange={field.onChange}
        />
      </div>
      <div className="flex justify-between mt-1">
        <div>
          {fieldState.error ? (
            <p className={clsxm(ERROR_TEXT_CLASSES, "mt-0 mr-4")}>
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
  contentLabel,
  extraFields,
  editorClassName,
}: {
  maxLength: number;
  contentLabel?: string;
  extraFields?: ReactNode;
  editorClassName?: string;
}) =>
  extraFields ? (
    <div className="flex gap-4 items-stretch">
      <div className="flex-none w-60">{extraFields}</div>
      {/* Positionnée en absolu, la colonne du texte prend la hauteur des champs annexes sans l'agrandir : l'éditeur défile. */}
      <div className="relative flex-1">
        <ContentField
          className="absolute inset-0"
          editorClassName={editorClassName}
          label={contentLabel}
          maxLength={maxLength}
        />
      </div>
    </div>
  ) : (
    <ContentField
      editorClassName={editorClassName}
      label={contentLabel}
      maxLength={maxLength}
    />
  );
