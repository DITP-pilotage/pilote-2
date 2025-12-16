import { PropsWithChildren, ReactNode } from "react";
import { $Enums } from "@prisma/client";
import {
  FormCommentaireName,
  FormNoteName,
} from "@/components/Evaluation/form";
import { Icone } from "@/components/_commons/Icone";
import { LockIcon } from "@/components/_commons/Icones/LockIcon";
import { Tooltip } from "@/components/shared/Tooltip";
import { CommentaireTextareaEvaluation } from "./CommentaireTextareaEvaluation";
import { InputNoteAppreciation } from "./InputNoteAppreciation";
import { InputNoteDefault } from "./InputNoteDefault";

const IconeEvaluationBloquee = ({ children }: PropsWithChildren) => (
  <Tooltip.Root>
    <Tooltip.Trigger>
      <Icone className="h-3 w-3" icone={LockIcon} />
    </Tooltip.Trigger>
    <Tooltip.Content>{children}</Tooltip.Content>
  </Tooltip.Root>
);

export const LigneEtapeEvaluation = ({
  mode,
  formulaireBloqueLabel,
  commentaireLabel,
  commentaireName,
  noteName,
  commentaire,
  annexe,
  note,
  onAutosave,
  traitement,
  etape,
}: {
  mode: "editable" | "bloque" | "lecture-seule";
  formulaireBloqueLabel?: string;
  commentaireLabel: string;
  commentaireName: FormCommentaireName;
  noteName: FormNoteName;
  commentaire?: string | null;
  annexe?: string | null;
  note?: number | null;
  onAutosave?: (fieldName: FormCommentaireName | FormNoteName) => void;
  traitement?: ReactNode;
  etape?: $Enums.etape_evaluation_enum;
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
                {mode === "bloque" && (
                  <IconeEvaluationBloquee>
                    {formulaireBloqueLabel}
                  </IconeEvaluationBloquee>
                )}
              </span>
            }
            name={commentaireName}
            onAutosave={() => onAutosave?.(commentaireName)}
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
        {etape === $Enums.etape_evaluation_enum.CONSOLIDATION ? (
          <InputNoteAppreciation
            label={
              <span className="flex items-center gap-1">
                Résultat
                {mode === "bloque" && (
                  <IconeEvaluationBloquee>
                    {formulaireBloqueLabel}
                  </IconeEvaluationBloquee>
                )}
              </span>
            }
            mode={mode}
            name={noteName}
            note={note}
            onAutosave={() => onAutosave?.(noteName)}
          />
        ) : (
          <InputNoteDefault
            label={
              <span className="flex items-center gap-1">
                Résultat / 100
                {mode === "bloque" && (
                  <IconeEvaluationBloquee>
                    {formulaireBloqueLabel}
                  </IconeEvaluationBloquee>
                )}
              </span>
            }
            mode={mode}
            name={noteName}
            note={note}
            onAutosave={() => onAutosave?.(noteName)}
          />
        )}

        {traitement}
      </div>
    </div>
  );
};
