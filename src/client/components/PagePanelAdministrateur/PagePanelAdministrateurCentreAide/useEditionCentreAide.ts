import { useState, useCallback } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { $Enums } from "@prisma/client";
import api from "@/server/infrastructure/api/trpc/api";
import { ArticleCentreAideContrat } from "@/server/parametrage-centre-aide/app/contrats/ArticleCentreAideContrat";

export type NoeudArbre = ArticleCentreAideContrat & {
  enfants: NoeudArbre[];
};

const construireArbre = (
  articles: ArticleCentreAideContrat[],
): NoeudArbre[] => {
  const map = new Map<string, NoeudArbre>();

  for (const article of articles) {
    map.set(article.id, { ...article, enfants: [] });
  }

  const racines: NoeudArbre[] = [];

  for (const article of articles) {
    const noeud = map.get(article.id)!;
    if (article.parentId) {
      const parent = map.get(article.parentId);
      if (parent) {
        parent.enfants.push(noeud);
      }
    } else {
      racines.push(noeud);
    }
  }

  return racines;
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
    data: listeArticles,
    isLoading: estChargement,
    refetch: refetchListe,
  } = api.parametrageCentreAide.lister.useQuery(undefined, {
    placeholderData: keepPreviousData,
  });

  const [itemSelectionneId, setItemSelectionneId] = useState<string | null>(
    null,
  );
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState<string | null>(templateInitial);
  const [type, setType] = useState<$Enums.TypeArticleCentreAide>("PAGE");
  const [estCreation, setEstCreation] = useState(false);
  const [groupesOuverts, setGroupesOuverts] = useState<Set<string>>(new Set());

  const articles = listeArticles ?? [];
  const arbre = construireArbre(articles);

  const itemSelectionne = articles.find(
    (article) => article.id === itemSelectionneId,
  );

  const toggleGroupe = useCallback((id: string) => {
    setGroupesOuverts((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectionnerItem = useCallback(
    (id: string) => {
      const article = articles.find((item) => item.id === id);
      if (!article) return;

      setItemSelectionneId(id);
      setTitre(article.titre);
      setContenu(article.contenu);
      setType(article.type);
      setEstCreation(false);
    },
    [articles],
  );

  const creerGroupe = useCallback(
    (avecContenu: boolean) => {
      const parentId =
        itemSelectionne?.type === "GROUPE"
          ? itemSelectionne.id
          : (itemSelectionne?.parentId ?? null);
      const ordre = compterEnfants(parentId, articles);

      setItemSelectionneId(null);
      setTitre("");
      setContenu(avecContenu ? templateInitial : null);
      setType("GROUPE");
      setEstCreation(true);

      return { parentId, ordre };
    },
    [itemSelectionne, articles],
  );

  const creerPage = useCallback(() => {
    const parentId =
      itemSelectionne?.type === "GROUPE"
        ? itemSelectionne.id
        : (itemSelectionne?.parentId ?? null);
    const ordre = compterEnfants(parentId, articles);

    setItemSelectionneId(null);
    setTitre("");
    setContenu(templateInitial);
    setType("PAGE");
    setEstCreation(true);

    return { parentId, ordre };
  }, [itemSelectionne, articles]);

  const [parentIdCreation, setParentIdCreation] = useState<string | null>(null);
  const [ordreCreation, setOrdreCreation] = useState(0);

  const preparerCreationGroupe = useCallback(
    (avecContenu: boolean) => {
      const { parentId, ordre } = creerGroupe(avecContenu);
      setParentIdCreation(parentId);
      setOrdreCreation(ordre);
    },
    [creerGroupe],
  );

  const preparerCreationPage = useCallback(() => {
    const { parentId, ordre } = creerPage();
    setParentIdCreation(parentId);
    setOrdreCreation(ordre);
  }, [creerPage]);

  const mutationCreer = api.parametrageCentreAide.creer.useMutation({
    onSuccess: (_data, variables) => {
      refetchListe();
      setItemSelectionneId(variables.id);
      setEstCreation(false);
      if (variables.parentId) {
        setGroupesOuverts(
          (previous) => new Set([...previous, variables.parentId!]),
        );
      }
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
      setEstCreation(false);
      toast.success("Article supprimé avec succès", {
        duration: 3000,
        position: "top-right",
        richColors: true,
      });
    },
  });

  const sauvegarder = useCallback(() => {
    if (estCreation) {
      const id = crypto.randomUUID();
      mutationCreer.mutate({
        id,
        titre,
        contenu,
        type,
        ordre: ordreCreation,
        parentId: parentIdCreation,
      });
    } else if (itemSelectionneId && itemSelectionne) {
      mutationModifier.mutate({
        id: itemSelectionneId,
        titre,
        contenu,
        type: itemSelectionne.type,
        ordre: itemSelectionne.ordre,
        parentId: itemSelectionne.parentId,
      });
    }
  }, [
    estCreation,
    itemSelectionneId,
    itemSelectionne,
    titre,
    contenu,
    type,
    ordreCreation,
    parentIdCreation,
    mutationCreer,
    mutationModifier,
  ]);

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
    preparerCreationGroupe,
    preparerCreationPage,
    estChargement,
    estCreation,
    titre,
    setTitre,
    contenu,
    setContenu,
    type,
    sauvegarder,
    supprimer,
    groupesOuverts,
    toggleGroupe,
  };
};
