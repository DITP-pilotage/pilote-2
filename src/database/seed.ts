/* eslint-disable unicorn/prefer-top-level-await */
import {
  axe,
  chantier,
  indicateur,
  perimetre,
  ppg,
  Prisma,
  PrismaClient,
  synthese_des_resultats,
} from '@prisma/client';
import { faker } from '@faker-js/faker/locale/fr';

import SynthèseDesRésultatsSQLRowBuilder
  from '@/server/infrastructure/test/builders/sqlRow/SynthèseDesRésultatsSQLRow.builder';
import ChantierSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ChantierSQLRow.builder';
import AxeRowBuilder from '@/server/infrastructure/test/builders/sqlRow/AxeSQLRow.builder';
import PpgRowBuilder from '@/server/infrastructure/test/builders/sqlRow/PpgSQLRow.builder';
import PérimètreMinistérielRowBuilder
  from '@/server/infrastructure/test/builders/sqlRow/PérimètreMinistérielSQLRow.builder';
import { codesInseeDépartements, codesInseeRégions } from '@/server/domain/territoire/Territoire.interface';
import MétéoBuilder from '@/server/domain/météo/Météo.builder';
import CommentaireRowBuilder from '@/server/infrastructure/test/builders/sqlRow/CommentaireSQLRow.builder';
import IndicateurRowBuilder from '@/server/infrastructure/test/builders/sqlRow/IndicateurSQLRow.builder';
import ObjectifSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ObjectifSQLRow.builder';
import { EQUIPE_DIR_PROJET, DIR_PROJET, DITP_ADMIN, DITP_PILOTAGE, PM } from '@/server/domain/identité/Profil';
import {
  créerUtilisateursAvecDroits,
  InputProfil,
  InputUtilisateur,
} from '@/server/infrastructure/accès_données/identité/seed';
import {
  SCOPE_LECTURE,
  SCOPE_SAISIE_INDICATEURS,
  SCOPE_SAISIE_SYNTHESE_ET_COMMENTAIRES,
} from '@/server/domain/identité/Habilitation';

const prisma = new PrismaClient();

class DatabaseSeeder {
  private _axes: axe[] = [];

  private _ppgs: ppg[] = [];

  private _périmètresMinistériels: perimetre[] = [];

  private _synthèsesDesRésultats: synthese_des_resultats[] = [];

  private _indicateurs: indicateur[] = [];

  private _commentaires: Prisma.commentaireCreateArgs['data'][] = [];

  private _objectifs: Prisma.objectifCreateArgs['data'][] = [];

  private _chantiers: chantier[] = [];

  async seed() {
    faker.seed(2023);
    await this._créerAxes();
    await this._créerPpgs();
    await this._créerPérimètresMinistériels();
    await this._créerChantiers();
    await this._créerSynthèsesDesRésultats();
    await this._créerCommentaires();
    await this._créerObjectifs();
    await this._créerIndicateurs();
    await this._créerDroits();
  }

  private async _créerAxes() {
    this._axes = Array.from({ length: 5 }).map(() => new AxeRowBuilder().build());

    await prisma.axe.createMany({ data: this._axes });
  }

  private async _créerPpgs() {
    this._ppgs = Array.from({ length: 5 }).map(() => new PpgRowBuilder().build());

    await prisma.ppg.createMany({ data: this._ppgs });
  }

  private async _créerPérimètresMinistériels() {
    this._périmètresMinistériels = Array.from({ length: 15 }).map(() => new PérimètreMinistérielRowBuilder().build()).filter(périmètre => périmètre.ministere !== null);

    await prisma.perimetre.createMany({ data: this._périmètresMinistériels });
  }

  private async _créerChantiers() {
    for (let i = 0; i < 100; i++) {
      const périmètres = faker.helpers.arrayElements(this._périmètresMinistériels, faker.datatype.number({
        min: 0,
        max: 2,
      }));
      const ministères = périmètres.map(périmètreMinistériel => périmètreMinistériel.ministere!);

      const c = new ChantierSQLRowBuilder()
        .avecAxe(faker.helpers.arrayElement(this._axes).nom)
        .avecPpg(faker.helpers.arrayElement(this._ppgs).nom)
        .avecPérimètreIds(périmètres.map(périmètreMinistériel => périmètreMinistériel.id))
        .avecMinistères(ministères);

      const chantierNational = c.avecMaille('NAT').build();

      const chantiersDépartementaux = codesInseeDépartements.map(codeInsee => {
        const météo = new MétéoBuilder().build();
        const avancement = faker.datatype.number({ min: 0, max: 100, precision: 0.01 });

        return c.avecTauxAvancement(avancement).avecMétéo(météo).avecMaille('DEPT').avecCodeInsee(codeInsee).build();
      });

      const chantiersRégionaux = codesInseeRégions.map(codeInsee => {
        const météo = new MétéoBuilder().build();
        const avancement = faker.datatype.number({ min: 0, max: 100, precision: 0.01 });

        return c.avecTauxAvancement(avancement).avecMétéo(météo).avecMaille('REG').avecCodeInsee(codeInsee).build();
      });

      this._chantiers = [...this._chantiers, chantierNational, ...chantiersDépartementaux, ...chantiersRégionaux];
    }

    await prisma.chantier.createMany({ data: this._chantiers });
  }

  private async _créerSynthèsesDesRésultats() {
    this._synthèsesDesRésultats = this._chantiers.map(c => new SynthèseDesRésultatsSQLRowBuilder().avecChantierId(c.id).build());

    await prisma.synthese_des_resultats.createMany({ data: this._synthèsesDesRésultats });
  }

  private async _créerCommentaires() {
    this._chantiers.forEach(c => {
      for (let i = 0; i < faker.datatype.number({ min: 0, max: 10 }); i++) {
        this._commentaires = [...this._commentaires, new CommentaireRowBuilder().avecChantierId(c.id).build()];
      }
    });

    await prisma.commentaire.createMany({ data: this._commentaires });
  }

  private async _créerObjectifs() {
    this._chantiers.forEach(c => {
      for (let i = 0; i < faker.datatype.number({ min: 0, max: 10 }); i++) {
        this._objectifs = [...this._objectifs, new ObjectifSQLRowBuilder().avecChantierId(c.id).build()];
      }
    });

    await prisma.objectif.createMany({ data: this._objectifs });
  }

  private async _créerIndicateurs() {
    this._indicateurs = this._chantiers.map(c =>
      new IndicateurRowBuilder()
        .avecId(`IND-${c.id}`)
        .avecNom(`IND-${c.id}-${faker.lorem.words()}`)
        .avecChantierId(c.id)
        .avecMaille(c.maille)
        .avecCodeInsee(c.code_insee)
        .build(),
    );

    await prisma.indicateur.createMany({ data: this._indicateurs });
  }

  private async _créerDroits() {
    const inputScopesHabilitations = [
      { code: SCOPE_LECTURE, nom: 'Lecture' },
      { code: SCOPE_SAISIE_SYNTHESE_ET_COMMENTAIRES, nom: 'Saisie de la synthèse et des commentaires' },
      { code: SCOPE_SAISIE_INDICATEURS, nom: 'Saisie des indicateurs de chantiers' },
    ];

    const inputProfils: InputProfil[] = [
      { code: PM, nom: 'Premier Ministre', aAccesTousChantiers: true, habilitationScopeCodes: [SCOPE_LECTURE] },
      { code: DITP_ADMIN, nom: 'DITP - Admin', aAccesTousChantiers: true, habilitationScopeCodes: [SCOPE_LECTURE, SCOPE_SAISIE_SYNTHESE_ET_COMMENTAIRES, SCOPE_SAISIE_INDICATEURS] },
      { code: DITP_PILOTAGE, nom: 'DITP - Pilotage', aAccesTousChantiers: true, habilitationScopeCodes: [SCOPE_LECTURE] },
      { code: DIR_PROJET, nom: 'Directeur de projet', aAccesTousChantiers: false, habilitationScopeCodes: [SCOPE_LECTURE, SCOPE_SAISIE_SYNTHESE_ET_COMMENTAIRES, SCOPE_SAISIE_INDICATEURS] },
      { code: EQUIPE_DIR_PROJET, nom: 'Équipe de Directeur de projet', aAccesTousChantiers: false, habilitationScopeCodes: [SCOPE_LECTURE] },
    ];

    // noinspection TypeScriptValidateTypes
    const chantiersRows = await prisma.chantier.findMany({ distinct: ['id'], select: { id: true }, take: 10 });
    const chantierIds = chantiersRows.map(it => it.id);
    const inputUtilisateurs: InputUtilisateur[] = [
      { email: 'premier.ministre@example.com', profilCode: PM, chantierIds: [] },
      { email: 'ditp.admin@example.com', profilCode: DITP_ADMIN, chantierIds: [] },
      { email: 'ditp.pilotage@example.com', profilCode: DITP_PILOTAGE, chantierIds: [] },
      { email: 'directeur.projet@example.com', profilCode: DIR_PROJET, chantierIds },
      { email: 'equipe.dir.projet@example.com', profilCode: EQUIPE_DIR_PROJET, chantierIds },
    ];

    await créerUtilisateursAvecDroits(prisma, inputScopesHabilitations, inputProfils, inputUtilisateurs);
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
