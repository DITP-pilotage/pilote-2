import { GetServerSidePropsContext } from 'next';
import { getServerSession } from 'next-auth';
import assert from 'node:assert/strict';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { configuration } from '@/config';
import { MailleInterne } from '@/server/chantiers/domain/Maille';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';
import { CartographieType } from '@/components/PageChantier/Cartes/Cartes';
import { CartographieIndicateurType } from '@/components/_commons/IndicateursChantier/Bloc/Détails/IndicateurDétails';
import { getAnneeDateDeBascule } from '@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule';
import { RécupérerChantierUseCase } from '@/server/chantiers/usecases/page-accueil/RécupérerChantierUseCase';
import { RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase } from '@/server/chantiers/usecases/page-accueil/RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase';
import { RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase } from '@/server/chantiers/usecases/page-accueil/RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase';
import { RécupérerVariableContenuUseCase } from '@/server/gestion-contenu/usecases/RécupérerVariableContenuUseCase';
import { RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase } from '@/server/chantiers/usecases/page-accueil/RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase';
import { RécupérerDétailsIndicateursUseCase } from '@/server/chantiers/usecases/page-accueil/RécupérerDétailsIndicateursUseCase';
import { calculerChantierAvancements } from '@/client/utils/chantier/avancement/calculerChantierAvancementsNew';
import { ChantierRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';
import { comparerIndicateur } from '@/client/utils/indicateur/indicateur';
import { convertitEnPondération } from '@/client/utils/ponderation/ponderation';
import { RécupérerDécisionStratégiqueLaPlusRécenteUseCase } from '@/server/chantiers/usecases/page-accueil/RécupérerDécisionStratégiqueLaPlusRécenteUseCase';
import { ListerDétailsIndicateurTerritoireUseCase } from '@/server/chantiers/usecases/page-accueil/ListerDétailsIndicateurTerritoireUseCase';
import { presenterEnAvancementsStatistiquesAccueilContrat } from '@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat';
import { RécupérerStatistiquesAvancementChantiersUseCase } from '@/server/chantiers/usecases/page-accueil/RécupérerStatistiquesAvancementChantiersUseCase';
import logger from '@/server/infrastructure/Logger';
import { IndicateurPondération } from '@/components/PageChantier/PageChantier.interface';
import { DonneesComparaisonDuTauxDAvancementType } from '@/server/domain/territoire/Territoire.interface';

type Dependencies = {
  recupererChantierUseCase: RécupérerChantierUseCase;
  recupererSynthèseDesRésultatsLaPlusRécenteUseCase: RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase;
  recupererCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase: RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase;
  recupererObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase: RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase;
  recupererDécisionStratégiqueLaPlusRécenteUseCase: RécupérerDécisionStratégiqueLaPlusRécenteUseCase;
  recupererDétailsIndicateursUseCase: RécupérerDétailsIndicateursUseCase;
  recupererStatistiquesAvancementChantiersUseCase: RécupérerStatistiquesAvancementChantiersUseCase;
  recupererVariableContenuUseCase: RécupérerVariableContenuUseCase;
  listerDetailsIndicateurTerritoireUseCase: ListerDétailsIndicateurTerritoireUseCase;
};

export class PageAccueilHandler {
  private recupererChantierUseCase: RécupérerChantierUseCase;

  private recupererSynthèseDesRésultatsLaPlusRécenteUseCase: RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase;

  private recupererCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase: RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase;

  private recupererObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase: RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase;

  private recupererDécisionStratégiqueLaPlusRécenteUseCase: RécupérerDécisionStratégiqueLaPlusRécenteUseCase;

  private recupererDétailsIndicateursUseCase: RécupérerDétailsIndicateursUseCase;

  private recupererStatistiquesAvancementChantiersUseCase: RécupérerStatistiquesAvancementChantiersUseCase;

  private listerDetailsIndicateurTerritoireUseCase: ListerDétailsIndicateurTerritoireUseCase;

  private recupererVariableContenuUseCase: RécupérerVariableContenuUseCase;

  constructor({
    recupererChantierUseCase,
    recupererSynthèseDesRésultatsLaPlusRécenteUseCase,
    recupererCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase,
    recupererObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase,
    recupererDécisionStratégiqueLaPlusRécenteUseCase,
    recupererDétailsIndicateursUseCase,
    recupererStatistiquesAvancementChantiersUseCase,
    recupererVariableContenuUseCase,
    listerDetailsIndicateurTerritoireUseCase,
  }: Dependencies) {
    this.recupererChantierUseCase = recupererChantierUseCase;
    this.recupererSynthèseDesRésultatsLaPlusRécenteUseCase = recupererSynthèseDesRésultatsLaPlusRécenteUseCase;
    this.recupererCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase = recupererCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase;
    this.recupererObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase = recupererObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase;
    this.recupererDécisionStratégiqueLaPlusRécenteUseCase = recupererDécisionStratégiqueLaPlusRécenteUseCase;
    this.recupererDétailsIndicateursUseCase = recupererDétailsIndicateursUseCase;
    this.recupererStatistiquesAvancementChantiersUseCase = recupererStatistiquesAvancementChantiersUseCase;
    this.listerDetailsIndicateurTerritoireUseCase = listerDetailsIndicateurTerritoireUseCase;
    this.recupererVariableContenuUseCase = recupererVariableContenuUseCase;
  }

  async handle(context: GetServerSidePropsContext) {
    const { query, req, res } = context;

    if (!query?.id) {
      return {
        notFound: true,
      };
    }

    const chantierId = query.id as string;
    const jalon = Number.parseInt(query.jalon as string) || getAnneeDateDeBascule(new Date(), configuration.dateBasculeAffichageValeursAnneePrecedente);
    const cartographieGaucheChantier = query.carteChG as CartographieType || 'avancementMandat';
    const cartographieDroiteChantier = query.carteChD as CartographieType || 'meteo';
    const cartographieGaucheIndicateur = query.carteIndG as CartographieIndicateurType || 'avancementMandat';
    const cartographieDroiteIndicateur = query.carteIndD as CartographieIndicateurType || 'valeurActuelle';

    const session = await getServerSession(req, res, authOptions);

    assert(query.territoireCode, 'Le territoire code est obligatoire pour afficher la page d\'accueil');
    assert(session, 'Vous devez être authentifié pour accéder a cette page');
    assert(session.habilitations, 'La session ne dispose d\'aucune habilitation');

    const territoireCode = query.territoireCode as string;
    const territoiresCompares = (query.territoiresCompares || '').length > 0 ? (query.territoiresCompares as string).split(',').filter(Boolean) : [];

    const {
      maille: mailleTerritoireSelectionnee,
    } = territoireCodeVersMailleCodeInsee(territoireCode);

    const mailleQuery = query.maille as MailleInterne || 'departementale';

    const mailleSelectionnee = mailleTerritoireSelectionnee === 'NAT'
      ? mailleQuery
      : mailleTerritoireSelectionnee === 'DEPT' ? 'departementale' : 'regionale';

    const territoireRepository = dependencies.getTerritoireRepository();
    const territoireSélectionné = await territoireRepository.récupérer(territoireCode);
    const territoireCodes = territoiresCompares.length > 0 ? [...territoiresCompares, territoireCode] : [territoireCode];

    try {
      const [
        chantier,
        indicateurs,
        synthèseDesRésultats,
        commentaires,
        objectifs,
        décisionStratégique,
        détailsIndicateurs,
        avancementsAgrégés,
        valeurFFPpgArchive,
      ] = await Promise.all([
        this.recupererChantierUseCase.run(chantierId, session.habilitations, session.profil, jalon),
        dependencies.getIndicateurRepository().récupérerParChantierId(chantierId),
        this.recupererSynthèseDesRésultatsLaPlusRécenteUseCase.run(chantierId, territoireCode, session.habilitations),
        this.recupererCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase.run([chantierId], territoireCode, session.habilitations),
        this.recupererObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase.run([chantierId], session.habilitations),
        this.recupererDécisionStratégiqueLaPlusRécenteUseCase.run(chantierId, session.habilitations),
        this.recupererDétailsIndicateursUseCase.run(chantierId, territoireCodes, session.habilitations, jalon),
        this.recupererStatistiquesAvancementChantiersUseCase.run([chantierId], mailleQuery, session.habilitations).then(presenterEnAvancementsStatistiquesAccueilContrat),
        this.recupererVariableContenuUseCase.run({ nomVariableContenu: 'NEXT_PUBLIC_FF_PPG_ARCHIVE' }),
      ]);

      assert(valeurFFPpgArchive || chantier.statut !== 'ARCHIVE', 'La page n\'est pas disponible');

      const chantierTerritoireSélectionné = chantier.mailles[territoireSélectionné.maille ?? 'nationale'][territoireCode];

      if (!chantierTerritoireSélectionné.estApplicable || (!chantier.estTerritorialisé && mailleTerritoireSelectionnee !== 'NAT')) {
        const destination = mailleTerritoireSelectionnee === 'DEPT'
          ? `/chantier/${chantierId}/${territoireSélectionné.codeParent}?maille=regionale`
          : `/chantier/${chantierId}/NAT-FR`;

        return {
          redirect: {
            destination,
            permanent: true,
          },
        };
      }

      const avancements = calculerChantierAvancements(
        chantier as unknown as ChantierRapportDetailleContrat,
        mailleSelectionnee,
        territoireCode,
        territoireSélectionné.codeParent,
        avancementsAgrégés ?? null,
      );

      const indicateurPondérations = !détailsIndicateurs || !territoireSélectionné
        ? []
        : (
          indicateurs
            .sort((indicateurA, indicateurB) => comparerIndicateur(indicateurA, indicateurB, détailsIndicateurs[indicateurA.id][territoireCode]?.pondération ?? null, détailsIndicateurs[indicateurB.id][territoireCode]?.pondération ?? null))
            .map(indicateur => ({
              pondération: convertitEnPondération(détailsIndicateurs[indicateur.id][territoireCode]?.pondération),
              nom: indicateur.nom,
              type: indicateur.type,
            }))
            .filter((indPond): indPond is IndicateurPondération => indPond.pondération !== null && indPond.pondération !== '0')
        );

      const listeResponsablesLocaux = chantierTerritoireSélectionné?.responsableLocal ?? [];
      const listeCoordinateursTerritorials = chantierTerritoireSélectionné?.coordinateurTerritorial ?? [];

      const donneesComparaisonDuTauxDAvancement: DonneesComparaisonDuTauxDAvancementType = {
        ppgEcartMedian: chantierTerritoireSélectionné?.écart,
        ppgTendanceChantier: chantierTerritoireSélectionné?.tendance,
        ppgTauxDAvancementValeurPrecedente: chantierTerritoireSélectionné?.avancementPrécédent.global,
        ppgDateTauxDAvancementValeurPrecedente: chantierTerritoireSélectionné?.dateTauxAvancementPrecedent,
      };

      const listeIndicateurId = indicateurs.map(indicateur => indicateur.id);

      const detailsIndicateursTerritoire = await this.listerDetailsIndicateurTerritoireUseCase.run(listeIndicateurId, chantierId, session.habilitations, session.profil, jalon);

      return {
        props: {
          chantier,
          indicateurs,
          synthèseDesRésultats,
          commentaires,
          objectifs,
          décisionStratégique,
          détailsIndicateurs,
          avancements,
          indicateurPondérations,
          listeResponsablesLocaux,
          listeCoordinateursTerritorials,
          donneesComparaisonDuTauxDAvancement,
          detailsIndicateursTerritoire,
          cartographieGaucheChantier,
          cartographieDroiteChantier,
          cartographieGaucheIndicateur,
          cartographieDroiteIndicateur,
          mailleSelectionnee,
          territoireCode,
          territoiresCompares,
        },
      };
    } catch (error) {
      logger.error('Error in PageAccueilHandler:', error);
      return {
        notFound: true,
      };
    }
  }
} 
