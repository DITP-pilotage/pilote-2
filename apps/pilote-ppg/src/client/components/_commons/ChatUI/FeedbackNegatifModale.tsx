import { useState } from "react";
import { Dialog } from "radix-ui";
import { $Enums } from "@prisma/client";
import { Modale } from "@/components/shared/Modale";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { FeedbackCategorieCard } from "@/components/_commons/ChatUI/FeedbackCategorieCard";
import { FEEDBACK_CATEGORIES } from "@/components/_commons/ChatUI/feedbackCategories";
import api from "@/server/infrastructure/api/trpc/api";

export const FeedbackNegatifModale = ({
  chatId,
  disabled,
  onSuccess,
}: {
  chatId: string;
  disabled: boolean;
  onSuccess: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<
    $Enums.llm_call_categorie_probleme[]
  >([]);
  const [commentaire, setCommentaire] = useState("");

  const evaluerMutation = api.albert.evaluer.useMutation({
    onSuccess: () => {
      setOpen(false);
      onSuccess();
    },
  });

  const toggleCategorie = (valeur: $Enums.llm_call_categorie_probleme) => {
    setCategories((actuelles) =>
      actuelles.includes(valeur)
        ? actuelles.filter((categorie) => categorie !== valeur)
        : [...actuelles, valeur],
    );
  };

  const autreSelectionneeSansCommentaire =
    categories.includes($Enums.llm_call_categorie_probleme.AUTRE) &&
    commentaire.trim().length === 0;

  const envoiImpossible =
    categories.length === 0 ||
    autreSelectionneeSansCommentaire ||
    evaluerMutation.isPending;

  const handleEnvoyer = () => {
    evaluerMutation.mutate({
      chatId,
      evaluation: $Enums.llm_call_evaluation.NEGATIVE,
      categories,
      commentaire: commentaire.trim() || undefined,
    });
  };

  return (
    <Modale
      onOpenChange={(ouvert) => {
        setOpen(ouvert);
        if (!ouvert) {
          setCategories([]);
          setCommentaire("");
        }
      }}
      open={open}
      titleClassName="!mb-2"
      size="sm"
      sousTitre="Dites-nous ce qui n'a pas fonctionné"
      sousTitreClassName="mb-2"
      title="Aidez-nous à nous améliorer"
      trigger={
        <button
          className="rounded-full border border-gray-300 px-3 py-1 hover:bg-gray-100 transition-colors disabled:opacity-50"
          disabled={disabled}
          type="button"
        >
          Non
        </button>
      }
    >
      <fieldset className="border-0 p-0 m-0">
        <legend className="text-sm font-medium text-gray-900 mb-2">
          <span className="block">
            Quel(s) type(s) de problème avez-vous rencontré ?
          </span>
          <span className="font-normal text-gray-500">
            (Vous pouvez sélectionner plusieurs options)
          </span>
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {FEEDBACK_CATEGORIES.map((categorie) => (
            <FeedbackCategorieCard
              categorie={categorie}
              key={categorie.valeur}
              onToggle={() => toggleCategorie(categorie.valeur)}
              selectionnee={categories.includes(categorie.valeur)}
            />
          ))}
        </div>
      </fieldset>

      <div className="mt-4">
        <label
          className="text-sm font-medium text-gray-900"
          htmlFor="feedback-negatif-commentaire"
        >
          Décrivez le problème{" "}
          <span className="font-normal text-gray-500">(optionnel)</span>
        </label>
        <textarea
          className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm h-22 resize-none"
          id="feedback-negatif-commentaire"
          onChange={(event) => setCommentaire(event.target.value)}
          placeholder="Décrivez ce qui n'a pas fonctionné..."
          value={commentaire}
        />
      </div>

      <div className="flex justify-end gap-2 mt-3">
        <Dialog.Close asChild>
          <Bouton label="Annuler" variant="secondary" />
        </Dialog.Close>
        <Bouton
          disabled={envoiImpossible}
          label="Envoyer"
          onClick={handleEnvoyer}
          variant="primary"
        />
      </div>
    </Modale>
  );
};
