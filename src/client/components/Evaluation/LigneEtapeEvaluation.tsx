import {
  FormCommentaireName,
  FormNoteName,
} from "@/components/Evaluation/form";
import { CommentaireTextareaEvaluation } from "./CommentaireTextareaEvaluation";
import { InputNoteEvaluation } from "./InputNoteEvaluation";

export const LigneEtapeEvaluation = ({
  isEditable,
  commentaireLabel,
  commentaireName,
  noteName,
  commentaire,
  note,
  onAutosave,
  onAfficherFicheCadrage,
}: {
  isEditable: boolean;
  commentaireLabel: string;
  commentaireName: FormCommentaireName;
  noteName: FormNoteName;
  commentaire?: string | null;
  note?: number | null;
  onAutosave?: (fieldName: FormCommentaireName | FormNoteName) => void;
  onAfficherFicheCadrage?: () => void;
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
            onFocus={onAfficherFicheCadrage}
          />
        ) : (
          <>
            <span className="italic text-sm block !font-medium mb-2">
              {commentaireLabel}
            </span>
            <blockquote className="text-sm text-gray-700 italic pl-3 py-1 whitespace-pre-line">
              {commentaire || "Aucun commentaire"}
            </blockquote>
          </>
        )}
      </div>
      <div className="flex-shrink-0 w-[8rem] p-4 flex flex-col text-center">
        {isEditable ? (
          <InputNoteEvaluation
            disabled={false}
            label="Note / 100"
            name={noteName}
            onAutosave={() => onAutosave?.(noteName)}
            onFocus={onAfficherFicheCadrage}
          />
        ) : (
          <>
            <strong className="text-sm block mb-1 italic">Note / 100</strong>
            <span className="font-medium">{note ?? "-"}</span>
          </>
        )}
      </div>
    </div>
  );
};
