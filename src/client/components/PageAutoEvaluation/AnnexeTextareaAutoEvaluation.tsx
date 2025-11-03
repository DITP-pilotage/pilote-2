import { useState } from "react";
import { flushSync } from "react-dom";
import { Icone } from "@/components/_commons/Icone";
import { AddLineIcon } from "@/components/_commons/Icones/AddLineIcon";
import { pageEvaluation } from "@/components/PageEvaluation/PageEvaluationServerSideContext";
import { EditeurRiche } from "@/components/_commons/ÉditeurRiche/EditeurRiche";

export function AnnexeTextareaAutoEvaluation(
  {
    /* name, */
  }: {
    /* name: `criteres.${number}.annexe` | `objectifs.${number}.annexe`; */
  },
) {
  const { autoEvaluation } = pageEvaluation.useServerSidePropsContext();
  const [displayAnnexe, setDisplayAnnexe] = useState(false);
  const [contenu, setContenu] = useState("");

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
    <EditeurRiche
      contenu={contenu}
      estEnLectureSeule={autoEvaluation.readOnly}
      onChange={setContenu}
    />
  );
}
