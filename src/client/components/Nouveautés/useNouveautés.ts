import { useState } from "react";

import { useEffect } from 'react';
import { useQueryState } from 'nuqs';
import { useRouter } from 'next/router';
import api from '@/server/infrastructure/api/trpc/api';
import { NouveauteContrat } from "@/server/parametrage-nouveautes/app/contrats/NouveauteContrat";
import { parseAsString } from "nuqs";

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
  const router = useRouter();
  const { data: listeNouveautes, isLoading: estChargementListeNouveautes, refetch: refetchListeNouveautes } = api.parametrageNouveautes.lister.useQuery(undefined, { keepPreviousData: true });

  const [estUnModeEdition, setEstUnModeEdition] = useState<boolean>(false);
  const [idAModifier, setIdAModifier] = useQueryState<string>('id', parseAsString.withDefault('').withOptions({
    shallow: false,
    history: 'push',
    clearOnDefault: true,
  }));

  const [majorVersion, minorVersion, patchVersion] = (listeNouveautes?.[0]?.version || '1.0.0').split('.');
  const nextVersion = [majorVersion, minorVersion, +patchVersion + 1].join('.');
  
  const [contenu, setContenu] = useState<string>(initialContenu);
  const [version, setVersion] = useState<string>(idAModifier ? listeNouveautes?.[0]?.version || nextVersion : nextVersion);

  useEffect(() => {
    setVersion(idAModifier ? listeNouveautes?.[0]?.version || nextVersion : nextVersion);
  }, [nextVersion, idAModifier]);

  const [date, setDate] = useState<string>(listeNouveautes?.[0]?.date || new Date().toISOString().split('T')[0]);

  const mutationSauvegarderContenuNouveautés = api.parametrageNouveautes.creer.useMutation({
    onSuccess: () => {
      refetchListeNouveautes();
      setIdAModifier('');
      setEstUnModeEdition(false);
      setContenu(initialContenu);
      setVersion(nextVersion);
      setDate(new Date().toISOString().split('T')[0]);
    },
  });

  const mutationModifierContenuNouveautés = api.parametrageNouveautes.modifier.useMutation({
    onSuccess: () => {
      refetchListeNouveautes();
      setIdAModifier('');
      setEstUnModeEdition(false);
      setContenu(initialContenu);
      setVersion(nextVersion);
      setDate(new Date().toISOString().split('T')[0]);
    },
  }); 

  const sauvegarderContenuNouveautés = ({ contenu, version, date }: { contenu: string, version: string, date: string }) => {
    mutationSauvegarderContenuNouveautés.mutate({
      contenu,
      version,
      date,
    });
  };

  const modifierContenuNouveautés = ({ id, contenu, version, date }: { id: string, contenu: string, version: string, date: string }) => {
    mutationModifierContenuNouveautés.mutate({
      id,
      contenu,
      version,
      date,
    });
    refetchListeNouveautes();
  };

  return { sauvegarderContenuNouveautés, modifierContenuNouveautés, listeNouveautes, estChargementListeNouveautes, contenu, estUnModeEdition, idAModifier, version, date, setContenu, setVersion, setDate, setEstUnModeEdition, setIdAModifier };
};
