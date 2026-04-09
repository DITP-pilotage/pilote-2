import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { $Enums } from "@prisma/client";
import api from "@/server/infrastructure/api/trpc/api";
import { ArticleCentreAideContrat } from "@/server/parametrage-centre-aide/app/contrats/ArticleCentreAideContrat";
import { useLectureCentreAide } from "@/components/_commons/CentreAide/useLectureCentreAide";
import {
  NoeudArbre,
  aDesModificationsNonPubliees as calculerModificationsNonPubliees,
} from "@/components/_commons/CentreAide/types";

export type { NoeudArbre } from "@/components/_commons/CentreAide/types";

const trouverPremierArticle = (
  noeuds: NoeudArbre[],
): NoeudArbre | undefined => {
  for (const noeud of noeuds) {
    if (noeud.contenuBrouillon !== null || noeud.contenu !== null) return noeud;
    const trouve = trouverPremierArticle(noeud.enfants);
    if (trouve) return trouve;
  }
  return undefined;
};

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
  const [titreAffiche, setTitreAffiche] = useState("");
  const [contenu, setContenu] = useState<string | null>(templateInitial);
  const [type, setType] = useState<$Enums.TypeArticleCentreAide>("PAGE");

  const aInitialise = useRef(false);

  useEffect(() => {
    if (estChargement || articles.length === 0 || aInitialise.current) return;
    aInitialise.current = true;

    const article = itemSelectionneId
      ? articles.find((item) => item.id === itemSelectionneId)
      : trouverPremierArticle(arbre);

    if (!article) return;

    setItemSelectionneId(article.id);
    setTitre(article.titreBrouillon ?? article.titre);
    setTitreAffiche(
      article.titreAfficheBrouillon ?? article.titreAffiche ?? "",
    );
    setContenu(article.contenuBrouillon ?? article.contenu);
    setType(article.type);
  }, [estChargement, articles, arbre, itemSelectionneId, setItemSelectionneId]);

  const selectionnerItem = useCallback(
    (id: string) => {
      const article = articles.find((item) => item.id === id);
      if (!article) return;

      setItemSelectionneId(id);
      setTitre(article.titreBrouillon ?? article.titre);
      setTitreAffiche(
        article.titreAfficheBrouillon ?? article.titreAffiche ?? "",
      );
      setContenu(article.contenuBrouillon ?? article.contenu);
      setType(article.type);
    },
    [articles, setItemSelectionneId],
  );

  const mutationCreer = api.parametrageCentreAide.creer.useMutation({
    onSuccess: (_data, variables) => {
      refetchListe();
      setItemSelectionneId(variables.id);
      setTitre(variables.titre);
      setTitreAffiche("");
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
      toast.success("Brouillon sauvegardé", {
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

  const mutationPublier = api.parametrageCentreAide.publier.useMutation({
    onSuccess: () => {
      refetchListe();
      toast.success("Article publié", {
        duration: 3000,
        position: "top-right",
        richColors: true,
      });
    },
  });

  const mutationDepublier = api.parametrageCentreAide.depublier.useMutation({
    onSuccess: () => {
      refetchListe();
      toast.success("Article dépublié", {
        duration: 3000,
        position: "top-right",
        richColors: true,
      });
    },
  });

  const mutationBasculerVisibilite =
    api.parametrageCentreAide.basculerVisibilite.useMutation({
      onSuccess: () => {
        refetchListe();
        toast.success("Visibilité modifiée", {
          duration: 3000,
          position: "top-right",
          richColors: true,
        });
      },
    });

  const mutationDeplacer = api.parametrageCentreAide.deplacer.useMutation({
    onSuccess: () => {
      refetchListe();
      toast.success("Article déplacé", {
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
        contenuPublie: itemSelectionne.contenu,
        titrePublie: itemSelectionne.titre,
        titreAffiche,
        titreAffichePublie: itemSelectionne.titreAffiche,
        estPublie: itemSelectionne.estPublie,
        estMasque: itemSelectionne.estMasque,
      });
    }
  }, [
    itemSelectionneId,
    itemSelectionne,
    titre,
    titreAffiche,
    contenu,
    mutationModifier,
  ]);

  const publier = useCallback(() => {
    if (itemSelectionneId) {
      mutationPublier.mutate({ id: itemSelectionneId });
    }
  }, [itemSelectionneId, mutationPublier]);

  const depublier = useCallback(() => {
    if (itemSelectionneId) {
      mutationDepublier.mutate({ id: itemSelectionneId });
    }
  }, [itemSelectionneId, mutationDepublier]);

  const basculerVisibilite = useCallback(() => {
    if (itemSelectionneId) {
      mutationBasculerVisibilite.mutate({ id: itemSelectionneId });
    }
  }, [itemSelectionneId, mutationBasculerVisibilite]);

  const deplacerArticle = useCallback(
    (id: string, action: "monter" | "descendre" | "sortir" | "entrer") => {
      mutationDeplacer.mutate({ id, action });
    },
    [mutationDeplacer],
  );

  const supprimer = useCallback(() => {
    if (itemSelectionneId) {
      mutationSupprimer.mutate({ id: itemSelectionneId });
    }
  }, [itemSelectionneId, mutationSupprimer]);

  const aDesModificationsNonPubliees = itemSelectionne
    ? calculerModificationsNonPubliees(itemSelectionne)
    : false;

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
    titreAffiche,
    setTitreAffiche,
    contenu,
    setContenu,
    type,
    sauvegarder,
    supprimer,
    publier,
    depublier,
    basculerVisibilite,
    deplacerArticle,
    aDesModificationsNonPubliees,
  };
};
