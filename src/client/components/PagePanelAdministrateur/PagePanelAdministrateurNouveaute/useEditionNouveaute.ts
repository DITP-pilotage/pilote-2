import { useState, useCallback } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/server/infrastructure/api/trpc/api";
import { ItemListe } from "@/components/_commons/EditeurContenu3Colonnes/EditeurContenu3Colonnes";

const templateInitial = `
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

const calculerProchaineVersion = (versionActuelle: string): string => {
  const [major, minor, patch] = versionActuelle.split(".");
  return [major, minor, +patch + 1].join(".");
};

export const useEditionNouveaute = () => {
  const {
    data: listeNouveautes,
    isLoading: estChargement,
    refetch: refetchListe,
  } = api.parametrageNouveautes.lister.useQuery(undefined, {
    placeholderData: keepPreviousData,
  });

  const [itemSelectionneId, setItemSelectionneId] = useState<string | null>(
    null,
  );
  const [contenu, setContenu] = useState(templateInitial);
  const [version, setVersion] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [estCreation, setEstCreation] = useState(true);

  const prochaineVersion = calculerProchaineVersion(
    listeNouveautes?.[0]?.version || "1.0.0",
  );

  const items: ItemListe[] = (listeNouveautes || []).map((nouveaute) => ({
    id: nouveaute.id,
    label: `Version ${nouveaute.version}`,
    sousTitre: new Date(nouveaute.date).toLocaleDateString("fr-FR"),
  }));

  const selectionnerItem = useCallback(
    (id: string) => {
      const nouveaute = listeNouveautes?.find((item) => item.id === id);
      if (!nouveaute) return;

      setItemSelectionneId(id);
      setContenu(nouveaute.contenu);
      setVersion(nouveaute.version);
      setDate(nouveaute.date);
      setEstCreation(false);
    },
    [listeNouveautes],
  );

  const creer = useCallback(() => {
    setItemSelectionneId(null);
    setContenu(templateInitial);
    setVersion(prochaineVersion);
    setDate(new Date().toISOString().split("T")[0]);
    setEstCreation(true);
  }, [prochaineVersion]);

  const mutationCreer = api.parametrageNouveautes.creer.useMutation({
    onSuccess: (_data, variables) => {
      refetchListe();
      setItemSelectionneId(variables.id!);
      setEstCreation(false);
      toast.success("Nouveauté créée avec succès", {
        duration: 3000,
        position: "top-right",
        richColors: true,
      });
    },
  });

  const mutationModifier = api.parametrageNouveautes.modifier.useMutation({
    onSuccess: () => {
      refetchListe();
      toast.success("Nouveauté modifiée avec succès", {
        duration: 3000,
        position: "top-right",
        richColors: true,
      });
    },
  });

  const sauvegarder = useCallback(() => {
    if (estCreation) {
      const id = crypto.randomUUID();
      mutationCreer.mutate({ id, contenu, version, date });
    } else if (itemSelectionneId) {
      mutationModifier.mutate({
        id: itemSelectionneId,
        contenu,
        version,
        date,
      });
    }
  }, [
    estCreation,
    itemSelectionneId,
    contenu,
    version,
    date,
    mutationCreer,
    mutationModifier,
  ]);

  return {
    items,
    itemSelectionneId,
    selectionnerItem,
    creer,
    estChargement,
    contenu,
    setContenu,
    version,
    setVersion,
    date,
    setDate,
    sauvegarder,
  };
};
