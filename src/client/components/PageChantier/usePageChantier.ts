/* eslint-disable react-hooks/exhaustive-deps */
import {
  mailleAssociéeAuTerritoireSélectionnéTerritoiresStore,
  mailleSélectionnéeTerritoiresStore, territoiresComparésTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import api from '@/server/infrastructure/api/trpc/api';
import calculerChantierAvancements from '@/client/utils/chantier/avancement/calculerChantierAvancements';
import { Commentaire } from '@/server/domain/commentaire/Commentaire.interface';
import Objectif from '@/server/domain/objectif/Objectif.interface';

export default function usePageChantier(chantierId: string) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const mailleAssociéeAuTerritoireSélectionné = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const territoiresComparés = territoiresComparésTerritoiresStore();

  const { data: synthèseDesRésultats } = api.synthèseDesRésultats.récupérerLaPlusRécente.useQuery(
    {
      chantierId,
      maille: mailleAssociéeAuTerritoireSélectionné,
      codeInsee: territoireSélectionné.codeInsee,
    },
    { refetchOnWindowFocus: false },
  );

  const { data: commentaires } = api.publication.récupérerLesPlusRécentesParTypeGroupéesParChantiers.useQuery(
    {
      chantierId,
      maille: mailleAssociéeAuTerritoireSélectionné,
      codeInsee: territoireSélectionné.codeInsee,
      entité: 'commentaires',
    },
    { refetchOnWindowFocus: false },
  );

  const { data: objectifs } = api.publication.récupérerLesPlusRécentesParTypeGroupéesParChantiers.useQuery(
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

  const { data: détailsIndicateurs } = api.indicateur.récupererDétailsIndicateurs.useQuery(
    {
      chantierId,
      maille: territoiresComparés.length > 0 ? mailleSélectionnée : mailleAssociéeAuTerritoireSélectionné,
      codesInsee: territoiresComparés.length > 0 ? territoiresComparés.map(territoire => territoire.codeInsee) : [territoireSélectionné.codeInsee],
    },
    { refetchOnWindowFocus: false, keepPreviousData: true },
  );

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
    détailsIndicateurs: détailsIndicateurs ?? null,
    commentaires: commentaires ? commentaires[chantierId] as Commentaire[] : null,
    objectifs: objectifs ? objectifs[chantierId] as Objectif[] : null,
    synthèseDesRésultats: synthèseDesRésultats ?? null,
    décisionStratégique: décisionStratégique ?? null,
    chantier: chantier ?? null,
    rechargerChantier,
    avancements,
  };
}
