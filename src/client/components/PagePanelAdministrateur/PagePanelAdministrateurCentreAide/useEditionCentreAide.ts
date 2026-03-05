import { useState, useCallback } from "react";
import { toast } from "sonner";
import { $Enums } from "@prisma/client";
import api from "@/server/infrastructure/api/trpc/api";
import { ArticleCentreAideContrat } from "@/server/parametrage-centre-aide/app/contrats/ArticleCentreAideContrat";
import { useLectureCentreAide } from "@/components/_commons/CentreAide/useLectureCentreAide";

export type { NoeudArbre } from "@/components/_commons/CentreAide/types";

const compterEnfants = (
  parentId: string | null,
  articles: ArticleCentreAideContrat[],
): number => {
  return articles.filter((article) => article.parentId === parentId).length;
};

const templateInitial = `
  <h4>Contenu de l'article</h4>
  <p>Saisissez le contenu de votre article ici.</p>
`;

export const useEditionCentreAide = () => {
  const {
    arbre,
    articles,
    itemSelectionneId,
    itemSelectionne,
    estChargement,
    refetchListe,
    setItemSelectionneId,
  } = useLectureCentreAide();

  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState<string | null>(templateInitial);
  const [type, setType] = useState<$Enums.TypeArticleCentreAide>("PAGE");

  const selectionnerItem = useCallback(
    (id: string) => {
      const article = articles.find((item) => item.id === id);
      if (!article) return;

      setItemSelectionneId(id);
      setTitre(article.titre);
      setContenu(article.contenu);
      setType(article.type);
    },
    [articles, setItemSelectionneId],
  );

  const mutationCreer = api.parametrageCentreAide.creer.useMutation({
    onSuccess: (_data, variables) => {
      refetchListe();
      setItemSelectionneId(variables.id);
      setTitre(variables.titre);
      setContenu(variables.contenu ?? null);
      setType(variables.type);
      toast.success("Article créé avec succès", {
        duration: 3000,
        position: "top-right",
        richColors: true,
      });
    },
  });

  const mutationModifier = api.parametrageCentreAide.modifier.useMutation({
    onSuccess: () => {
      refetchListe();
      toast.success("Article modifié avec succès", {
        duration: 3000,
        position: "top-right",
        richColors: true,
      });
    },
  });

  const mutationSupprimer = api.parametrageCentreAide.supprimer.useMutation({
    onSuccess: () => {
      refetchListe();
      setItemSelectionneId(null);
      setTitre("");
      setContenu(null);
      toast.success("Article supprimé avec succès", {
        duration: 3000,
        position: "top-right",
        richColors: true,
      });
    },
  });

  const creerGroupe = useCallback(
    (avecContenu: boolean) => {
      const parentId =
        itemSelectionne?.type === "GROUPE"
          ? itemSelectionne.id
          : (itemSelectionne?.parentId ?? null);
      const ordre = compterEnfants(parentId, articles);
      const id = crypto.randomUUID();

      mutationCreer.mutate({
        id,
        titre: "(Sans titre)",
        contenu: avecContenu ? templateInitial : null,
        type: "GROUPE",
        ordre,
        parentId,
      });
    },
    [itemSelectionne, articles, mutationCreer],
  );

  const creerPage = useCallback(() => {
    const parentId =
      itemSelectionne?.type === "GROUPE"
        ? itemSelectionne.id
        : (itemSelectionne?.parentId ?? null);
    const ordre = compterEnfants(parentId, articles);
    const id = crypto.randomUUID();

    mutationCreer.mutate({
      id,
      titre: "(Sans titre)",
      contenu: templateInitial,
      type: "PAGE",
      ordre,
      parentId,
    });
  }, [itemSelectionne, articles, mutationCreer]);

  const sauvegarder = useCallback(() => {
    if (itemSelectionneId && itemSelectionne) {
      mutationModifier.mutate({
        id: itemSelectionneId,
        titre,
        contenu,
        type: itemSelectionne.type,
        ordre: itemSelectionne.ordre,
        parentId: itemSelectionne.parentId,
      });
    }
  }, [itemSelectionneId, itemSelectionne, titre, contenu, mutationModifier]);

  const supprimer = useCallback(() => {
    if (itemSelectionneId) {
      mutationSupprimer.mutate({ id: itemSelectionneId });
    }
  }, [itemSelectionneId, mutationSupprimer]);

  return {
    arbre,
    articles,
    itemSelectionneId,
    itemSelectionne,
    selectionnerItem,
    creerGroupe,
    creerPage,
    estChargement,
    titre,
    setTitre,
    contenu,
    setContenu,
    type,
    sauvegarder,
    supprimer,
  };
};
