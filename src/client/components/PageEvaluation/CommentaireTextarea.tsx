import { useState } from "react";
import { Controller } from "react-hook-form";
import { useFormEvaluation } from "@/components/PageEvaluation/form";
import { Icone } from "@/components/_commons/Icone";
import { AddLineIcon } from "@/components/_commons/Icones/AddLineIcon";
import { clsxm } from "@/utils/clsxm";
import { MessageErreur } from "@/components/PageEvaluation/MessageErreur";
import { pageEvaluation } from "@/components/PageEvaluation/PageEvaluationServerSideContext";

export function CommentaireTextarea({
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
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => {
        const fieldId = `${name}.commentaire`;
        return (
          <div className="flex flex-col gap-1">
            <label
              className={clsxm("font-bold text-sm", {
                "text-error": !!fieldState.error,
              })}
              htmlFor={fieldId}
            >
              Commentaire
            </label>
            <textarea
              className={clsxm("border !rounded-md !bg-white py-2 px-4", {
                "!border-error": !!fieldState.error,
              })}
              id={fieldId}
              {...field}
              disabled={autoEvaluation.readOnly}
              onBlur={(e) => {
                field.onBlur();
                if (!e.target.value) setDisplayComment(false);
              }}
              ref={(node) => {
                node?.focus();
                field.ref(node);
              }}
            />
            <div className="flex justify-between mt-1">
              {fieldState.error ? (
                <MessageErreur>{fieldState.error.message}</MessageErreur>
              ) : null}

              <span className="text-xs ml-auto">
                {field.value.length} / 600
              </span>
            </div>
          </div>
        );
      }}
    />
  );
}
