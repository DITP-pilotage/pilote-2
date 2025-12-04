import { ReactNode } from "react";
import {
  FormCommentaireName,
  FormNoteName,
} from "@/components/Evaluation/form";
import { Icone } from "@/components/_commons/Icone";
import { LockIcon } from "@/components/_commons/Icones/LockIcon";
import { Tooltip } from "@/components/shared/Tooltip";
import { CommentaireTextareaEvaluation } from "./CommentaireTextareaEvaluation";
import { InputNoteEvaluation } from "./InputNoteEvaluation";

function IconeEvaluationBloquee() {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger>
        <Icone className="h-3 w-3" icone={LockIcon} />
      </Tooltip.Trigger>
      <Tooltip.Content>
        La DITP prend connaissance de vos appréciations sur ce formulaire. Le
        formulaire reste cependant consultable.
      </Tooltip.Content>
    </Tooltip.Root>
  );
}

export const LigneEtapeEvaluation = ({
  mode,
  commentaireLabel,
  commentaireName,
  noteName,
  commentaire,
  annexe,
  note,
  onAutosave,
  onAfficherFicheCadrage,
  traitement,
}: {
  mode: "editable" | "bloque" | "lecture-seule";
  commentaireLabel: string;
  commentaireName: FormCommentaireName;
  noteName: FormNoteName;
  commentaire?: string | null;
  annexe?: string | null;
  note?: number | null;
  onAutosave?: (fieldName: FormCommentaireName | FormNoteName) => void;
  onAfficherFicheCadrage?: () => void;
  traitement?: ReactNode;
}) => {
  return (
    <div className="flex !mb-0 !-mx-4 first:border-t-0">
      <div className="flex-1 border-r border-r-gray-200 p-4">
        {mode === "editable" || mode === "bloque" ? (
          <CommentaireTextareaEvaluation
            disabled={mode === "bloque"}
            label={
              <span className="flex items-center gap-1">
                {commentaireLabel}
                {mode === "bloque" && <IconeEvaluationBloquee />}
              </span>
            }
            name={commentaireName}
            onAutosave={() => onAutosave?.(commentaireName)}
            onFocus={onAfficherFicheCadrage}
          />
        ) : (
          <>
            <div>
              <span className="italic text-sm block !font-medium mb-2">
                {commentaireLabel}
              </span>
              <blockquote className="text-sm text-gray-700 pl-3 py-1 whitespace-pre-line">
                {commentaire || "Aucun commentaire"}
              </blockquote>
            </div>

            {annexe ? (
              <div className="mt-6">
                <span className="italic text-sm block !font-medium mb-2">
                  Annexe
                </span>

                <blockquote
                  className="[&_*]:!text-sm text-gray-700 pl-3 py-1 whitespace-pre-line"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: annexe }}
                />
              </div>
            ) : null}
          </>
        )}
      </div>
      <div className="flex-shrink-0 w-[8rem] p-4 flex flex-col text-center">
        {mode === "editable" || mode === "bloque" ? (
          <InputNoteEvaluation
            disabled={mode === "bloque"}
            label={
              <span className="flex items-center gap-1">
                Note / 100
                {mode === "bloque" && <IconeEvaluationBloquee />}
              </span>
            }
            name={noteName}
            onAutosave={() => onAutosave?.(noteName)}
            onFocus={onAfficherFicheCadrage}
          />
        ) : (
          <div className="flex flex-col mb-2">
            <strong className="text-sm block mb-1 italic">Note / 100</strong>
            <span className="font-medium">{note ?? "-"}</span>
          </div>
        )}

        {traitement}
      </div>
    </div>
  );
};
