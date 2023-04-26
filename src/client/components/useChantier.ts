/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { mailleSélectionnéeTerritoiresStore, territoireSélectionnéTerritoiresStore, mailleAssociéeAuTerritoireSélectionnéTerritoiresStore, territoiresComparésTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import api from '@/server/infrastructure/api/trpc/api';

export default function useChantier(chantierId: string) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const mailleAssociéeAuTerritoireSélectionné = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const territoiresComparés = territoiresComparésTerritoiresStore();

  const [détailsIndicateurs, setDétailsIndicateurs] = useState<DétailsIndicateurs | null>(null);

  const { data: synthèseDesRésultats } = api.synthèseDesRésultats.récupérerLaPlusRécente.useQuery(
    {
      chantierId,
      maille: mailleAssociéeAuTerritoireSélectionné,
      codeInsee: territoireSélectionné.codeInsee,
    },
    { refetchOnWindowFocus: false },
  );

  const { data: commentaires } = api.publication.récupérerLaPlusRécenteParType.useQuery(
    {
      chantierId,
      maille: mailleAssociéeAuTerritoireSélectionné,
      codeInsee: territoireSélectionné.codeInsee,
      entité: 'commentaires',
    },
    { refetchOnWindowFocus: false },
  );

  const { data: objectifs } = api.publication.récupérerLaPlusRécenteParType.useQuery(
    {
      chantierId,
      maille: 'nationale',
      codeInsee: 'FR',
      entité: 'objectifs',
    },
    { refetchOnWindowFocus: false },
  );

  const { data: décisionStratégique } = api.publication.récupérerLaPlusRécente.useQuery(
    {
      chantierId,
      maille: 'nationale',
      codeInsee: 'FR',
      entité: 'décisions stratégiques',
      type: 'suivi_des_decisions',
    },
    { refetchOnWindowFocus: false },
  );

  useEffect(() => {
    if (territoiresComparés.length > 0) return;
    fetch(`/api/chantier/${chantierId}/indicateurs?codesInsee=${territoireSélectionné.codeInsee}&maille=${mailleAssociéeAuTerritoireSélectionné}`)
      .then(réponse => réponse.json() as Promise<DétailsIndicateurs>)
      .then(données => setDétailsIndicateurs(données));
  }, [chantierId, mailleAssociéeAuTerritoireSélectionné, territoireSélectionné.codeInsee, mailleSélectionnée]);

  useEffect(() => {
    const codesInsee = territoiresComparés.map(territoire => `codesInsee=${territoire.codeInsee}`).join('&');
    if (codesInsee === '' || codesInsee === 'codesInsee=FR') return;
    fetch(`/api/chantier/${chantierId}/indicateurs?${codesInsee}&maille=${mailleSélectionnée}`)
      .then(réponse => réponse.json() as Promise<DétailsIndicateurs>)
      .then(données => setDétailsIndicateurs(données));
  }, [territoiresComparés]);

  return {
    détailsIndicateurs,
    commentaires: commentaires ?? null,
    objectifs: objectifs ?? null,
    synthèseDesRésultats: synthèseDesRésultats ?? null,
    décisionStratégique: décisionStratégique ?? null,
  };
}
