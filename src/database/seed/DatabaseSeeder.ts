/* eslint-disable sonarjs/no-unused-collection,no-console */
import {
  axe,
  chantier,
  indicateur,
  ministere,
  perimetre,
  ppg,
  Prisma,
  PrismaClient,
  synthese_des_resultats,
  territoire,
} from '@prisma/client';
import { faker } from '@faker-js/faker/locale/fr';

import assert from 'node:assert/strict';
import SynthèseDesRésultatsSQLRowBuilder
  from '@/server/infrastructure/test/builders/sqlRow/SynthèseDesRésultatsSQLRow.builder';
import ChantierSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ChantierSQLRow.builder';
import AxeRowBuilder from '@/server/infrastructure/test/builders/sqlRow/AxeSQLRow.builder';
import PpgRowBuilder from '@/server/infrastructure/test/builders/sqlRow/PpgSQLRow.builder';
import PérimètreMinistérielRowBuilder
  from '@/server/infrastructure/test/builders/sqlRow/PérimètreMinistérielSQLRow.builder';
import MétéoBuilder from '@/server/domain/météo/Météo.builder';
import CommentaireRowBuilder from '@/server/infrastructure/test/builders/sqlRow/CommentaireSQLRow.builder';
import IndicateurRowBuilder from '@/server/infrastructure/test/builders/sqlRow/IndicateurSQLRow.builder';
import ObjectifSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ObjectifSQLRow.builder';
import DécisionStratégiqueSQLRowBuilder
  from '@/server/infrastructure/test/builders/sqlRow/DécisionStratégiqueSQLRow.builder';
import { UtilisateurÀCréerOuMettreÀJour } from '@/server/domain/utilisateur/Utilisateur.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import UtilisateurÀCréerOuMettreÀJourBuilder from '@/server/domain/utilisateur/UtilisateurÀCréerOuMettreÀJour.builder';
import { générerTableau, générerUnLibellé, répéter } from '@/server/infrastructure/test/builders/utils';
import { typesCommentaireMailleNationale } from '@/server/domain/commentaire/Commentaire.interface';
import { formaterId } from './format';

const chantierStatiqueId123 = new ChantierSQLRowBuilder()
  .avecAxe('axe chantier')
  .avecCodeInsee('FR')
  .avecDirecteursAdminCentrale(['Alain Térieur', 'Alex Térieur'])
  .avecDirectionsAdminCentrale(['Intérieur', 'Extérieur'])
  .avecDirecteursProjet(['John Doe'])
  .avecDirecteursProjetMails(['john-doe@test.fr'])
  .avecEstBaromètre(null)
  .avecEstTerritorialisé(null)
  .avecId('CH-123')
  .avecMaille('NAT')
  .avecMétéo('SOLEIL')
  .avecNom('CH-123 Chantier test')
  .avecPpg('ppg chantier')
  .avecPérimètreIds([])
  .avecTauxAvancement(66)
  .avecMinistères(['Agriculture et Alimentation'])
  .avecTerritoireNom(null);

const prisma = new PrismaClient();

class DatabaseSeeder {
  private _territoires: territoire[] = [];

  private _territoiresDept: territoire[] = [];

  private _territoiresReg: territoire[] = [];

  private _compteur: number = 1;


  private _axes: axe[] = [];

  private _ppgs: ppg[] = [];

  private _périmètresMinistériels: perimetre[] = [];

  private _synthèsesDesRésultats: synthese_des_resultats[] = [];

  private _indicateurs: indicateur[] = [];

  private _commentaires: Prisma.commentaireCreateArgs['data'][] = [];

  private _objectifs: Prisma.objectifCreateArgs['data'][] = [];

  private _décisions_stratégiques: Prisma.decision_strategiqueCreateArgs['data'][] = [];

  private _chantiers: chantier[] = [];

  private _chantiersDonnéesCommunes: chantier[] = [];

  async init() {
    this._territoires = await prisma.territoire.findMany();
    this._territoiresDept = this._territoires.filter(t => t.maille === 'DEPT');
    this._territoiresReg = this._territoires.filter(t => t.maille === 'REG');
  }

  compter() {
    return this._compteur++;
  }

  async seed() {
    console.log('---- Génération des fausses données ----');
    faker.seed(2023);
    await this.init();
    console.log('  Axes...');
    await this._créerAxes();
    console.log('  Ppgs...');
    await this._créerPpgs();
    console.log('  MinistèresEtPérimètresMinistériels...');
    await this._créerMinistèresEtPérimètresMinistériels();
    console.log('  Chantiers...');
    await this._créerChantiers();
    console.log('  SynthèsesDesRésultats...');
    await this._créerSynthèsesDesRésultats();
    console.log('  Commentaires...');
    await this._créerCommentaires();
    console.log('  Objectifs...');
    await this._créerObjectifs();
    console.log('  DécisionsStratégiques...');
    await this._créerDécisionsStratégiques();
    console.log('  Indicateurs...');
    await this._créerIndicateurs();
    console.log('  UtilisateursEtDroits...');
    await this._créerUtilisateursEtDroits();
    console.log('----------------- Fin ------------------');
  }

  private async _créerAxes() {
    this._axes = générerTableau<axe>(5, 5, () => new AxeRowBuilder().build());

    await prisma.axe.createMany({ data: this._axes });
  }

  private async _créerPpgs() {
    this._ppgs = générerTableau<ppg>(5, 5, () => new PpgRowBuilder().build());

    await prisma.ppg.createMany({ data: this._ppgs });
  }

  private async _créerMinistèresEtPérimètresMinistériels() {
    this._périmètresMinistériels = générerTableau<perimetre>(15, 15, () => new PérimètreMinistérielRowBuilder().build())
      .filter(périmètre => périmètre.ministere !== null);

    const donnéesMinistères: ministere[] = this._périmètresMinistériels
      .filter(it => Boolean(it.ministere_id))
      .map(it => {
        assert(it.ministere_id, 'Id ministère manquant pour périmètre ' + it.id);
        assert(it.ministere, 'Description ministère manquante pour périmètre ' + it.id);
        return { id: it.ministere_id, nom: it.ministere };
      });

    await prisma.ministere.createMany({ data: donnéesMinistères });
    await prisma.perimetre.createMany({ data: this._périmètresMinistériels });
  }

  private async _créerChantiers() {

    const CHANTIERS_STATIQUES = [chantierStatiqueId123];

    for (let i = 0; i < 100; i++) {
      const périmètres = faker.helpers.arrayElements(this._périmètresMinistériels, faker.datatype.number({
        min: 0,
        max: 2,
      }));
      const ministères = périmètres.map(périmètreMinistériel => périmètreMinistériel.ministere!);

      // On souhaite rendre des chantiers statiques avec des valeurs controllées afin de pouvoir créer des jeux de données de bout en bout maitrisés
      const c = i <= CHANTIERS_STATIQUES.length - 1
        ? CHANTIERS_STATIQUES[i]
        : new ChantierSQLRowBuilder()
          .avecId(`CH-${formaterId(this.compter())}`)
          .avecAxe(faker.helpers.arrayElement(this._axes).nom)
          .avecPpg(faker.helpers.arrayElement(this._ppgs).nom)
          .avecPérimètreIds(périmètres.map(périmètreMinistériel => périmètreMinistériel.id))
          .avecMinistères(ministères);

      const chantierNational = c.avecMaille('NAT').build();

      const chantiersDépartementaux = this._territoiresDept.map(terr => {
        const météo = new MétéoBuilder().build();
        const avancement = faker.datatype.number({ min: 0, max: 100, precision: 0.01 });

        return c.avecTauxAvancement(avancement).avecMétéo(météo).avecMaille('DEPT')
          .avecCodeInsee(terr.code_insee).avecTerritoireNom(terr.nom).build();
      });

      const chantiersRégionaux = this._territoiresReg.map(terr => {
        const météo = new MétéoBuilder().build();
        const avancement = faker.datatype.number({ min: 0, max: 100, precision: 0.01 });

        return c.avecTauxAvancement(avancement).avecMétéo(météo).avecMaille('REG')
          .avecCodeInsee(terr.code_insee).avecTerritoireNom(terr.nom).build();
      });

      this._chantiers.push(chantierNational, ...chantiersDépartementaux, ...chantiersRégionaux);
      this._chantiersDonnéesCommunes = [...new Map(this._chantiers.map((ch) => [ch.id, ch])).values()];
    }

    await prisma.chantier.createMany({ data: this._chantiers });
  }

  private async _créerSynthèsesDesRésultats() {
    this._chantiers.forEach(c => {
      répéter(1, 5, () => {
        const possèdeCommentaireEtMétéo = c.meteo !== 'NON_RENSEIGNEE';
        if (possèdeCommentaireEtMétéo) {
          this._synthèsesDesRésultats.push(
            new SynthèseDesRésultatsSQLRowBuilder(possèdeCommentaireEtMétéo)
              .avecChantierId(c.id)
              .avecMaille(c.maille)
              .avecCodeInsee(c.code_insee)
              .avecMétéo(c.meteo)
              .build(),
          );
        }
      });
    });

    await prisma.synthese_des_resultats.createMany({ data: this._synthèsesDesRésultats });
  }

  private async _créerCommentaires() {
    this._chantiers.forEach(c => {
      répéter(0, 12, () => {
        this._commentaires.push(new CommentaireRowBuilder().avecChantierId(c.id)
          .avecMaille(c.maille).avecCodeInsee(c.code_insee)
          .build());
      });
    });

    await prisma.commentaire.createMany({ data: this._commentaires });
  }

  private async _créerObjectifs() {
    this._chantiersDonnéesCommunes.forEach(c => {
      répéter(0, 9, () => {
        this._objectifs.push(new ObjectifSQLRowBuilder().avecChantierId(c.id).build());
      });
    });

    await prisma.objectif.createMany({ data: this._objectifs });
  }

  private async _créerDécisionsStratégiques() {
    this._chantiersDonnéesCommunes.forEach(c => {
      répéter(0, 9, () => {
        this._décisions_stratégiques.push(new DécisionStratégiqueSQLRowBuilder().avecChantierId(c.id).build());
      });
    });

    await prisma.decision_strategique.createMany({ data: this._décisions_stratégiques });
  }

  private async _créerIndicateurs() {
    const indicateursDonnéesCommunes: any[] = [];

    for (const c of this._chantiersDonnéesCommunes) {
      répéter(0, 4, () => {
        const id = `IND-${formaterId(this.compter())}`;
        indicateursDonnéesCommunes.push({
          id,
          nom: `${générerUnLibellé(5, 15)} ${id}`,
          chantier_id: c.id,
        });
      });
    }

    for (const ind of indicateursDonnéesCommunes) {
      for (const terr of this._territoires) {
        this._indicateurs.push(
          new IndicateurRowBuilder()
            .avecId(ind.id)
            .avecNom(ind.nom)
            .avecChantierId(ind.chantier_id)
            .avecMaille(terr.maille)
            .avecCodeInsee(terr.code_insee)
            .avecTerritoireNom(terr.nom)
            .build(),
        );
      }
    }
    await prisma.indicateur.createMany({ data: this._indicateurs });
  }

  private async _créerUtilisateursEtDroits() {
    const chantierIds = await this._getSomeChantierIds();

    const utilisateurs: UtilisateurÀCréerOuMettreÀJour[] = [
      new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('ditp.admin@example.com').avecProfil('DITP_ADMIN').build(),
      new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('ditp.pilotage@example.com').avecProfil('DITP_PILOTAGE').build(),
      new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('premiere.ministre@example.com').avecProfil('PM_ET_CABINET').build(),
      new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('presidence@example.com').avecProfil('PR').build(),
      new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('cabinet.mtfp@example.com').avecProfil('CABINET_MTFP').build(),
      new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('cabinet.ministeriel@example.com').avecProfil('CABINET_MINISTERIEL').build(),
      new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('direction.admin.centrale@example.com').avecProfil('DIR_ADMIN_CENTRALE').build(),
      new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('secretariat.general@example.com').avecProfil('SECRETARIAT_GENERAL').build(),
      new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('directeur.projet@example.com').avecProfil('DIR_PROJET').avecHabilitationLecture(chantierIds).build(),
      new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('equipe.dir.projet@example.com').avecProfil('EQUIPE_DIR_PROJET').avecHabilitationLecture(chantierIds).build(),
      new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('referent.region@example.com').avecProfil('REFERENT_REGION').avecHabilitationLecture([], ['REG-53', 'DEPT-56', 'DEPT-29', 'DEPT-35', 'DEPT-22']).avecHabilitationsaisieCommentaire([], ['REG-53', 'DEPT-56', 'DEPT-29', 'DEPT-35', 'DEPT-22']).build(),
      new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('prefet.region@example.com').avecProfil('PREFET_REGION').avecHabilitationLecture([], ['REG-53', 'DEPT-56', 'DEPT-29', 'DEPT-35', 'DEPT-22']).avecHabilitationsaisieCommentaire([], ['REG-53', 'DEPT-56', 'DEPT-29', 'DEPT-35', 'DEPT-22']).build(),
      new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('services.deconcentres.region@example.com').avecProfil('SERVICES_DECONCENTRES_REGION').avecHabilitationLecture(chantierIds, ['REG-53', 'DEPT-56', 'DEPT-29', 'DEPT-35', 'DEPT-22']).avecHabilitationsaisieCommentaire(chantierIds, ['REG-53', 'DEPT-56', 'DEPT-29', 'DEPT-35', 'DEPT-22']).build(),
      new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('referent.departement@example.com').avecProfil('REFERENT_DEPARTEMENT').avecHabilitationLecture([], ['DEPT-22']).avecHabilitationsaisieCommentaire([], ['DEPT-22']).build(),
      new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('prefet.departement@example.com').avecProfil('PREFET_DEPARTEMENT').avecHabilitationLecture([], ['DEPT-22']).avecHabilitationsaisieCommentaire([], ['DEPT-22']).build(),
      new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('services.deconcentres.departement@example.com').avecProfil('SERVICES_DECONCENTRES_DEPARTEMENT').avecHabilitationLecture(chantierIds, ['DEPT-22']).avecHabilitationsaisieCommentaire([], ['DEPT-22']).build(),
      new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('drom@example.com').avecProfil('DROM').avecHabilitationLecture(chantierIds).build(),
    ];

    for (const utilisateur of utilisateurs) {
      await dependencies.getUtilisateurRepository().créerOuMettreÀJour(utilisateur);
    }
  }

  private async _getSomeChantierIds() {
    const chantiersRows = await prisma.chantier.findMany({ distinct: ['id'], select: { id: true }, take: 10 });
    return chantiersRows.map(it => it.id);
  }
}

new DatabaseSeeder()
  .seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    await prisma.$disconnect();
    throw new Error(`Erreur durant le seed de la base de données ${error}`);
  });
