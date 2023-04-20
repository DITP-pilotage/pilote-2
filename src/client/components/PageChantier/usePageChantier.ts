/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { AgrégateurChantiersParTerritoire } from '@/client/utils/chantier/agrégateur/agrégateur';
import { mailleSélectionnéeTerritoiresStore, territoireSélectionnéTerritoiresStore, mailleAssociéeAuTerritoireSélectionnéTerritoiresStore, territoiresComparésTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import api from '@/server/infrastructure/api/trpc/api';
import {
  checkAuthorizationChantierScope,
  Habilitation,
  SCOPE_SAISIE_INDICATEURS,
} from '@/server/domain/identité/Habilitation';

export default function usePageChantier(habilitation: Habilitation) {
  const chantierId = useRouter().query.id as string;
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const mailleAssociéeAuTerritoireSélectionné = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const territoiresComparés = territoiresComparésTerritoiresStore();  
  
  const [détailsIndicateurs, setDétailsIndicateurs] = useState<DétailsIndicateurs | null>(null);

  const { data: chantier, refetch: rechargerChantier } = api.chantier.récupérer.useQuery(
    {
      chantierId,
    },
    { refetchOnWindowFocus: false },

  );

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

  const avancements = useMemo(() => {
    if (!chantier)
      return null;

    const donnéesTerritoiresAgrégées = new AgrégateurChantiersParTerritoire([chantier]).agréger();

    const avancementRégional = () => {
      if (mailleAssociéeAuTerritoireSélectionné === 'régionale')
        return donnéesTerritoiresAgrégées.régionale.territoires[territoireSélectionné.codeInsee].répartition.avancements.global.moyenne;

      if (mailleAssociéeAuTerritoireSélectionné === 'départementale' && territoireSélectionné.codeInseeParent)
        return donnéesTerritoiresAgrégées.régionale.territoires[territoireSélectionné.codeInseeParent].répartition.avancements.global.moyenne;
    };

    const avancementDépartemental = () => {
      if (mailleAssociéeAuTerritoireSélectionné === 'départementale')
        return donnéesTerritoiresAgrégées[mailleSélectionnée].territoires[territoireSélectionné.codeInsee].répartition.avancements.global.moyenne;
    };

    return {
      nationale: {
        global: {
          moyenne: donnéesTerritoiresAgrégées.nationale.répartition.avancements.global.moyenne,
          médiane: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.global.médiane,
          minimum: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.global.minimum,
          maximum: donnéesTerritoiresAgrégées[mailleSélectionnée].répartition.avancements.global.maximum,
        },
        annuel: {
          moyenne: donnéesTerritoiresAgrégées.nationale.répartition.avancements.annuel.moyenne,
        },
      },
      départementale: {
        moyenne: avancementDépartemental(),
      },
      régionale: {
        moyenne: avancementRégional(),
      },
    };
  }, [chantier]);

  const modeÉcriture = checkAuthorizationChantierScope(habilitation, chantierId, SCOPE_SAISIE_INDICATEURS);

  return {
    chantier: chantier ?? null,
    rechargerChantier,
    avancements, 
    détailsIndicateurs, 
    commentaires: commentaires ?? null,
    objectifs: objectifs ?? null,
    synthèseDesRésultats: synthèseDesRésultats ?? null,
    décisionStratégique: décisionStratégique ?? null,
    modeÉcriture,
  };
}
