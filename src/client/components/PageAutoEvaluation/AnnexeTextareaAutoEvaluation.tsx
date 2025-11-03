import { useState } from "react";
import { flushSync } from "react-dom";
import { Controller } from "react-hook-form";
import { useFormEvaluation } from "@/components/PageEvaluation/form";
import { Icone } from "@/components/_commons/Icone";
import { AddLineIcon } from "@/components/_commons/Icones/AddLineIcon";
import { pageEvaluation } from "@/components/PageEvaluation/PageEvaluationServerSideContext";
import { EditeurRiche } from "@/components/_commons/ÉditeurRiche/EditeurRiche";

export const AnnexeTextareaAutoEvaluation = ({
  name,
}: {
  name: `criteres.${number}.annexe` | `objectifs.${number}.annexe`;
}) => {
  const form = useFormEvaluation();
  const { autoEvaluation } = pageEvaluation.useServerSidePropsContext();
  const defaultOpen = form.getValues(name) !== "";
  const [displayAnnexe, setDisplayAnnexe] = useState(defaultOpen);

  if (!displayAnnexe) {
    return (
      <button
        className="-ml-4 !text-xs !text-dsfr-grey-200 inline-flex w-fit gap-1 items-center"
        onClick={() => {
          flushSync(() => {
            setDisplayAnnexe(true);
          });
        }}
        type="button"
      >
        <Icone className="w-3 h-3 text-current" icone={AddLineIcon} /> Ajouter
        une annexe
      </button>
    );
  }

  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <>
          <span className="bold">Annexe</span>
          <EditeurRiche
            contenu={field.value || ""}
            estEnLectureSeule={autoEvaluation.readOnly}
            onChange={field.onChange}
          />
        </>
      )}
    />
  );
};
