/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import {
  checkAuthorizationChantierScope,
  Habilitation,
  SCOPE_SAISIE_INDICATEURS,
} from '@/server/domain/identité/Habilitation';
import {
  mailleAssociéeAuTerritoireSélectionnéTerritoiresStore,
  mailleSélectionnéeTerritoiresStore, territoiresComparésTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import api from '@/server/infrastructure/api/trpc/api';
import calculerChantierAvancements from '@/client/utils/chantier/avancement/calculerChantierAvancements';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';

export default function usePageChantier(chantierId: string, habilitation: Habilitation) {
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

  const modeÉcriture = checkAuthorizationChantierScope(habilitation, chantierId, SCOPE_SAISIE_INDICATEURS);

  const { data: chantier, refetch: rechargerChantier } = api.chantier.récupérer.useQuery(
    {
      chantierId,
    },
    { refetchOnWindowFocus: false },
  );

  const avancements = !chantier
    ? null
    : (
      calculerChantierAvancements(
        chantier,
        mailleSélectionnée,
        territoireSélectionné,
        mailleAssociéeAuTerritoireSélectionné,
      )
    );

  return {
    détailsIndicateurs, 
    commentaires: commentaires ?? null,
    objectifs: objectifs ?? null,
    synthèseDesRésultats: synthèseDesRésultats ?? null,
    décisionStratégique: décisionStratégique ?? null,
    modeÉcriture,
    chantier: chantier ?? null,
    rechargerChantier,
    avancements,
  };
}
