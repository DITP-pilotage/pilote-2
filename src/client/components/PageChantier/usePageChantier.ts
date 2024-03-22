/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  actionsTerritoiresStore,
  mailleSélectionnéeTerritoiresStore,
  territoiresComparésTerritoiresStore,
  territoiresTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import api from '@/server/infrastructure/api/trpc/api';
import calculerChantierAvancements from '@/client/utils/chantier/avancement/calculerChantierAvancements';
import { Commentaire } from '@/server/domain/chantier/commentaire/Commentaire.interface';
import Objectif from '@/server/domain/chantier/objectif/Objectif.interface';
import {
  actionsTypeDeRéformeStore,
  typeDeRéformeSélectionnéeStore,
} from '@/client/stores/useTypeDeRéformeStore/useTypeDeRéformeStore';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { IndicateurPondération } from '@/components/PageChantier/PageChantier.interface';
import { comparerIndicateur, estAutoriséAImporterDesIndicateurs } from '@/client/utils/indicateur/indicateur';
import { estAutoriséAConsulterLaFicheConducteur } from '@/client/utils/fiche-conducteur/fiche-conducteur';

export default function usePageChantier(chantierId: string, indicateurs: Indicateur[]) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const territoiresComparés = territoiresComparésTerritoiresStore();
  const territoires = territoiresTerritoiresStore();
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();
  const territoireParent = territoireSélectionné?.codeParent ? récupérerDétailsSurUnTerritoire(territoireSélectionné.codeParent) : null;
  const { data: session } = useSession();

  const { modifierTypeDeRéformeSélectionné } = actionsTypeDeRéformeStore();
  const typeDeRéformeSélectionné = typeDeRéformeSélectionnéeStore();

  useEffect(() => {
    if (typeDeRéformeSélectionné === 'projet structurant') modifierTypeDeRéformeSélectionné();
  }, [modifierTypeDeRéformeSélectionné, typeDeRéformeSélectionné]);
  
  const saisieIndicateurAutorisée = estAutoriséAImporterDesIndicateurs(session!.profil) && !!session?.habilitations['saisieIndicateur'].chantiers.includes(chantierId);
  const { data: variableContenuFFFicheConducteur } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_FF_FICHE_CONDUCTEUR' });

  const afficheLeBoutonFicheConducteur = (variableContenuFFFicheConducteur as boolean) && estAutoriséAConsulterLaFicheConducteur(session!.profil);

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

  const indicateurPondérations = !détailsIndicateurs || !territoireSélectionné
  ? []
  : (
    indicateurs
      .sort((a, b) => comparerIndicateur(a, b, mailleSélectionnée))
      .map(indicateur => ({
        pondération: détailsIndicateurs[indicateur.id][territoireSélectionné.codeInsee]?.pondération?.toFixed(0),
        nom: indicateur.nom,
      }))
      .filter((indPond): indPond is IndicateurPondération => indPond.pondération !== null && indPond.pondération !== '0')
  );


  let modeÉcriture = !!territoireSélectionné!.accèsSaisiePublication && !!session?.habilitations['saisieCommentaire'].chantiers.includes(chantierId);
  if (session && ['DIR_PROJET', 'EQUIPE_DIR_PROJET', 'SECRETARIAT_GENERAL'].includes(session.profil) && territoireSélectionné?.maille != 'nationale') {
    modeÉcriture = modeÉcriture && chantier?.ate === 'hors_ate_centralise';
  }
  const modeÉcritureObjectifs = territoires.some(t => t.maille === 'nationale' && t.accèsSaisiePublication === true) && !!session?.habilitations['saisieCommentaire'].chantiers.includes(chantierId);    

  const chantierTerritoireSélectionné = chantier?.mailles[territoireSélectionné?.maille ?? 'nationale'][territoireSélectionné?.codeInsee ?? 'FR'];
  const responsableLocal = chantierTerritoireSélectionné?.responsableLocal ?? [];
  const referentTerritorial = chantierTerritoireSélectionné?.référentTerritorial ?? [];

  return {
    détailsIndicateurs: détailsIndicateurs ?? null,
    commentaires: commentaires ? commentaires[chantierId] as Commentaire[] : null,
    objectifs: objectifs ? objectifs[chantierId] as Objectif[] : null,
    synthèseDesRésultats: synthèseDesRésultats ?? null,
    décisionStratégique: décisionStratégique ?? null,
    chantier: chantier ?? null,
    rechargerChantier,
    territoireSélectionné,
    modeÉcriture,
    modeÉcritureObjectifs,
    profil: session!.profil,
    avancements,
    indicateurPondérations,
    saisieIndicateurAutorisée,
    afficheLeBoutonFicheConducteur: afficheLeBoutonFicheConducteur as boolean,
    responsableLocal,
    referentTerritorial,
  };
}
