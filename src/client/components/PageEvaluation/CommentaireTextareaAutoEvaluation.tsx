import { useState } from "react";
import { useFormEvaluation } from "@/components/PageEvaluation/form";
import { Icone } from "@/components/_commons/Icone";
import { AddLineIcon } from "@/components/_commons/Icones/AddLineIcon";
import { pageEvaluation } from "@/components/PageEvaluation/PageEvaluationServerSideContext";
import { Textarea } from "@/components/_commons/Textarea";

export function CommentaireTextareaAutoEvaluation({
  name,
}: {
  name:
    | `criteres.${number}.sousCriteres.${number}.commentaire`
    | `objectifs.${number}.commentaire`;
}) {
  const form = useFormEvaluation();
  const { autoEvaluation } = pageEvaluation.useServerSidePropsContext();
  const defaultOpen = form.getValues(name) != "";
  const [displayComment, setDisplayComment] = useState(defaultOpen);

  if (!displayComment) {
    return (
      <button
        className="-ml-4 !text-xs !text-dsfr-grey-200 inline-flex w-fit gap-1 items-center"
        onClick={() => setDisplayComment(true)}
        type="button"
      >
        <Icone className="w-3 h-3 text-current" icone={AddLineIcon} /> Ajouter
        un commentaire
      </button>
    );
  }

  return (
    <Textarea
      control={form.control}
      name={name}
      readOnly={autoEvaluation.readOnly}
    />
  );
}
