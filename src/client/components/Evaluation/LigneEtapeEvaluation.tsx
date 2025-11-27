import { InputNote } from "@/components/_commons/InputNote";
import {
  FormCommentaireName,
  FormNoteName,
} from "@/components/Evaluation/form";
import { CommentaireTextareaEvaluation } from "./CommentaireTextareaEvaluation";
import { InputNoteEvaluation } from "./InputNoteEvaluation";

export const LigneEtapeEvaluation = ({
  isEditable,
  commentaireLabel,
  noteLabel,
  commentaireName,
  noteName,
  commentaire,
  note,
  onAutosave,
}: {
  isEditable: boolean;
  commentaireLabel: string;
  noteLabel: string;
  commentaireName: FormCommentaireName;
  noteName: FormNoteName;
  commentaire?: string | null;
  note?: number | null;
  onAutosave?: (fieldName: FormCommentaireName | FormNoteName) => void;
}) => {
  return (
    <div className="flex !mb-0 !-mx-4 first:border-t-0">
      <div className="flex-1 border-r border-r-gray-200 p-4">
        {isEditable ? (
          <CommentaireTextareaEvaluation
            disabled={false}
            label={commentaireLabel}
            name={commentaireName}
            onAutosave={() => onAutosave?.(commentaireName)}
          />
        ) : (
          <>
            <strong className="text-sm block mb-2">{commentaireLabel}</strong>
            <blockquote className="text-sm text-gray-700 italic border-l-4 border-gray-300 pl-3 py-1 whitespace-pre-line">
              {commentaire || "Aucun commentaire"}
            </blockquote>
          </>
        )}
      </div>
      <div className="flex-shrink-0 w-[12rem] p-4">
        <strong className="text-sm block mb-1">{noteLabel}</strong>
        <div className="flex justify-end">
          {isEditable ? (
            <InputNoteEvaluation
              disabled={false}
              name={noteName}
              onAutosave={() => onAutosave?.(noteName)}
            />
          ) : (
            <InputNote disabled value={note ?? ""} />
          )}
        </div>
      </div>
    </div>
  );
};
