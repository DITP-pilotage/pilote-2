import { useState, useEffect } from "react";

import { useQueryState, parseAsString } from "nuqs";
import { keepPreviousData } from "@tanstack/react-query";
import api from "@/server/infrastructure/api/trpc/api";

const initialContenu = `
<h4>Nouvelles fonctionnalités</h4>
<ul>
  <li>Nouveautés 1</li>
  <li>Nouveautés 2</li>
</ul>
<h4>Correctifs</h4>
<ul>
  <li>Correctif 1</li>
  <li>Correctif 2</li>
</ul>
<h4>Mise à jour du centre d'aide</h4>
<ul>
  <li>Mise à jour du centre d'aide 1</li>
  <li>Mise à jour du centre d'aide 2</li>
</ul>
`;

export const useNouveautés = () => {
  const {
    data: listeNouveautes,
    isLoading: estChargementListeNouveautes,
    refetch: refetchListeNouveautes,
  } = api.parametrageNouveautes.lister.useQuery(undefined, {
    placeholderData: keepPreviousData,
  });

  const [estUnModeEdition, setEstUnModeEdition] = useState<boolean>(false);
  const [idAModifier, setIdAModifier] = useQueryState<string>(
    "id",
    parseAsString.withDefault("").withOptions({
      shallow: false,
      history: "push",
      clearOnDefault: true,
    }),
  );

  const [majorVersion, minorVersion, patchVersion] = (
    listeNouveautes?.[0]?.version || "1.0.0"
  ).split(".");
  const nextVersion = [majorVersion, minorVersion, +patchVersion + 1].join(".");

  const [contenu, setContenu] = useState<string>(initialContenu);
  const [version, setVersion] = useState<string>(
    idAModifier ? listeNouveautes?.[0]?.version || nextVersion : nextVersion,
  );

  useEffect(() => {
    setVersion(
      idAModifier ? listeNouveautes?.[0]?.version || nextVersion : nextVersion,
    );
  }, [nextVersion, idAModifier, listeNouveautes]);

  const [date, setDate] = useState<string>(
    listeNouveautes?.[0]?.date || new Date().toISOString().split("T")[0],
  );

  const mutationSauvegarderContenuNouveautés =
    api.parametrageNouveautes.creer.useMutation({
      onSuccess: () => {
        refetchListeNouveautes();
        setIdAModifier("");
        setEstUnModeEdition(false);
        setContenu(initialContenu);
        setVersion(nextVersion);
        setDate(new Date().toISOString().split("T")[0]);
      },
    });

  const mutationModifierContenuNouveautés =
    api.parametrageNouveautes.modifier.useMutation({
      onSuccess: () => {
        refetchListeNouveautes();
        setIdAModifier("");
        setEstUnModeEdition(false);
        setContenu(initialContenu);
        setVersion(nextVersion);
        setDate(new Date().toISOString().split("T")[0]);
      },
    });

  const sauvegarderContenuNouveautés = ({
    contenu: contenuAAjouter,
    version: versionAAjouter,
    date: dateAAjouter,
  }: {
    contenu: string;
    version: string;
    date: string;
  }) => {
    mutationSauvegarderContenuNouveautés.mutate({
      contenu: contenuAAjouter,
      version: versionAAjouter,
      date: dateAAjouter,
    });
  };

  const modifierContenuNouveautés = ({
    id,
    contenu: contenuAModifier,
    version: versionAModifier,
    date: dateAModifier,
  }: {
    id: string;
    contenu: string;
    version: string;
    date: string;
  }) => {
    mutationModifierContenuNouveautés.mutate({
      id,
      contenu: contenuAModifier,
      version: versionAModifier,
      date: dateAModifier,
    });
    refetchListeNouveautes();
  };

  return {
    sauvegarderContenuNouveautés,
    modifierContenuNouveautés,
    listeNouveautes,
    estChargementListeNouveautes,
    contenu,
    estUnModeEdition,
    idAModifier,
    version,
    date,
    setContenu,
    setVersion,
    setDate,
    setEstUnModeEdition,
    setIdAModifier,
  };
};
