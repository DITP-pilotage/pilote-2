/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from 'react';
import {
  actionsTerritoiresStore,
  mailleSélectionnéeTerritoiresStore, territoiresComparésTerritoiresStore,
  territoiresTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import api from '@/server/infrastructure/api/trpc/api';
import calculerChantierAvancements from '@/client/utils/chantier/avancement/calculerChantierAvancements';
import { Commentaire } from '@/server/domain/chantier/commentaire/Commentaire.interface';
import Objectif from '@/server/domain/chantier/objectif/Objectif.interface';
import { actionsTypeDeRéformeStore, typeDeRéformeSélectionnéeStore } from '@/client/stores/useTypeDeRéformeStore/useTypeDeRéformeStore';

export default function usePageChantier(chantierId: string) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const territoiresComparés = territoiresComparésTerritoiresStore();
  const territoires = territoiresTerritoiresStore();
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();
  const territoireParent = territoireSélectionné?.codeParent ? récupérerDétailsSurUnTerritoire(territoireSélectionné.codeParent) : null;

  const { modifierTypeDeRéformeSélectionné } = actionsTypeDeRéformeStore();
  const typeDeRéformeSélectionné = typeDeRéformeSélectionnéeStore();

  useEffect(() => {
    if (typeDeRéformeSélectionné === 'projet structurant') modifierTypeDeRéformeSélectionné();
  }, [modifierTypeDeRéformeSélectionné, typeDeRéformeSélectionné]);
  

  const { data: synthèseDesRésultats } = api.synthèseDesRésultats.récupérerLaPlusRécente.useQuery(
    {
      réformeId: chantierId,
      territoireCode: territoireSélectionné!.code,
      typeDeRéforme: 'chantier',
    },
  );

  const { data: commentaires } = api.publication.récupérerLesPlusRécentesParTypeGroupéesParRéformes.useQuery(
    {
      réformeId: chantierId,
      territoireCode: territoireSélectionné!.code,
      entité: 'commentaires',
      typeDeRéforme: 'chantier',
    },
  );

  const { data: objectifs } = api.publication.récupérerLesPlusRécentesParTypeGroupéesParRéformes.useQuery(
    {
      réformeId: chantierId,
      territoireCode: 'NAT-FR',
      entité: 'objectifs',
      typeDeRéforme: 'chantier',
    },
  );

  const { data: décisionStratégique } = api.publication.récupérerLaPlusRécente.useQuery(
    {
      réformeId: chantierId,
      territoireCode: 'NAT-FR',
      entité: 'décisions stratégiques',
      type: 'suiviDesDécisionsStratégiques',
      typeDeRéforme: 'chantier',
    },
  );

  const { data: détailsIndicateurs } = api.indicateur.récupererDétailsIndicateurs.useQuery(
    {
      chantierId,
      territoireCodes: territoiresComparés.length > 0 ? territoiresComparés.map(territoire => territoire.code) : [territoireSélectionné!.code],
    },
    { keepPreviousData: true },
  );

  const { data: chantier, refetch: rechargerChantier } = api.chantier.récupérer.useQuery(
    {
      chantierId,
    },
  );

  const { data: avancementsAgrégés } = api.chantier.récupérerStatistiquesAvancements.useQuery(
    {
      chantiers: [chantierId],
      maille: mailleSélectionnée,
    },
    { refetchOnWindowFocus: false, keepPreviousData: true },
  );

  const avancements = !chantier
    ? null
    : (
      calculerChantierAvancements(
        chantier,
        mailleSélectionnée,
        territoireSélectionné!,
        territoireParent,
        avancementsAgrégés ?? null,
      )
    );

  return {
    détailsIndicateurs: détailsIndicateurs ?? null,
    commentaires: commentaires ? commentaires[chantierId] as Commentaire[] : null,
    objectifs: objectifs ? objectifs[chantierId] as Objectif[] : null,
    synthèseDesRésultats: synthèseDesRésultats ?? null,
    décisionStratégique: décisionStratégique ?? null,
    chantier: chantier ?? null,
    rechargerChantier,
    territoireSélectionné,
    territoires,
    avancements,
  };
}
