import { useCallback } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import api from "@/server/infrastructure/api/trpc/api";
import { construireArbre } from "./types";

export const useLectureCentreAide = () => {
  const {
    data: listeArticles,
    isLoading: estChargement,
    refetch: refetchListe,
  } = api.parametrageCentreAide.lister.useQuery(undefined, {
    placeholderData: keepPreviousData,
  });

  const [itemSelectionneId, setItemSelectionneId] = useQueryState(
    "article",
    parseAsString.withOptions({
      history: "replace",
      clearOnDefault: true,
    }),
  );

  const articles = listeArticles ?? [];
  const arbre = construireArbre(articles);

  const itemSelectionne = articles.find(
    (article) => article.id === itemSelectionneId,
  );

  const selectionnerItem = useCallback(
    (id: string) => {
      const article = articles.find((item) => item.id === id);
      if (!article) return;
      setItemSelectionneId(id);
    },
    [articles, setItemSelectionneId],
  );

  return {
    arbre,
    articles,
    itemSelectionneId,
    itemSelectionne,
    selectionnerItem,
    estChargement,
    refetchListe,
    setItemSelectionneId,
  };
};
