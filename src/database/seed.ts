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
import {
  CABINET_MINISTERIEL,
  CABINET_MTFP,
  DIR_ADMIN_CENTRALE,
  DIR_PROJET,
  DITP_ADMIN,
  DITP_PILOTAGE,
  EQUIPE_DIR_PROJET,
  PM_ET_CABINET,
  PR,
  SECRETARIAT_GENERAL,
} from '@/server/domain/identité/Profil';
import {
  créerProfilsEtHabilitations,
  générerUtilisateurPourImport,
  INPUT_PROFILS,
  INPUT_SCOPES_HABILITATIONS,
} from '@/server/infrastructure/accès_données/identité/seed';
import { UtilisateurSQLRepository } from '@/server/infrastructure/accès_données/identité/UtilisateurSQLRepository';
import UtilisateurPourImport from '@/server/domain/identité/UtilisateurPourImport';

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
    await this._créerUtilisateursEtDroits();
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

      this._chantiers.push(chantierNational, ...chantiersDépartementaux, ...chantiersRégionaux);
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

  private async _créerUtilisateursEtDroits() {
    const chantierIds = await this._getSomeChantierIds();
    const inputUtilisateurs: UtilisateurPourImport[] = [
      { email: 'ditp.admin@example.com', profilCode: DITP_ADMIN },
      { email: 'ditp.pilotage@example.com', profilCode: DITP_PILOTAGE },
      { email: 'premiere.ministre@example.com', profilCode: PM_ET_CABINET },
      { email: 'presidence@example.com', profilCode: PR },
      { email: 'cabinet.mtfp@example.com', profilCode: CABINET_MTFP },
      { email: 'cabinet.ministeriel@example.com', profilCode: CABINET_MINISTERIEL },
      { email: 'direction.admin.centrale@example.com', profilCode: DIR_ADMIN_CENTRALE },
      { email: 'secretariat.general@example.com', profilCode: SECRETARIAT_GENERAL },
      { email: 'directeur.projet@example.com', profilCode: DIR_PROJET, chantierIds },
      { email: 'equipe.dir.projet@example.com', profilCode: EQUIPE_DIR_PROJET, chantierIds },
    ].map(générerUtilisateurPourImport);

    await créerProfilsEtHabilitations(prisma, INPUT_PROFILS, INPUT_SCOPES_HABILITATIONS);
    await new UtilisateurSQLRepository(prisma).créerOuRemplacerUtilisateurs(inputUtilisateurs);
  }

  private async _getSomeChantierIds() {
    // noinspection TypeScriptValidateTypes
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
