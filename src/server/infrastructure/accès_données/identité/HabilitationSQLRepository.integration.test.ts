/* eslint-disable sonarjs/no-duplicate-string */
import HabilitationSQLRepository from '@/server/infrastructure/accès_données/identité/HabilitationSQLRepository';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import HabilitationRepository from '@/server/domain/identité/HabilitationRepository';
import {
  SCOPE_LECTURE,
  SCOPE_SAISIE_INDICATEURS,
  SCOPE_SAISIE_SYNTHESE_ET_COMMENTAIRES,
} from '@/server/domain/identité/Habilitation';
import {
  créerProfilsEtHabilitations,
  créerUtilisateurs,
  INPUT_PROFILS,
  INPUT_SCOPES_HABILITATIONS,
  InputUtilisateur,
  ProfilIdByCode,
} from '@/server/infrastructure/accès_données/identité/seed';
import {
  CABINET_MINISTERIEL,
  CABINET_MTFP,
  DIR_ADMIN_CENTRALE,
  DIR_PROJET,
  DITP_ADMIN,
  DITP_PILOTAGE,
  EQUIPE_DIR_PROJET,
  PM_ET_CABINET,
  PR, SANS_HABILITATIONS,
  SECRETARIAT_GENERAL,
} from '@/server/domain/identité/Profil';
import ChantierRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ChantierSQLRow.builder';

describe('HabilitationSQLRepository', () => {
  let profilIdByCode: ProfilIdByCode;
  const tousScopes = [SCOPE_LECTURE, SCOPE_SAISIE_SYNTHESE_ET_COMMENTAIRES, SCOPE_SAISIE_INDICATEURS];

  beforeEach(async () => {
    profilIdByCode = await créerProfilsEtHabilitations(prisma, INPUT_PROFILS, INPUT_SCOPES_HABILITATIONS);

    const chantierRows = ['CH-001', 'CH-002', 'CH-003', 'CH-004', 'CH-005']
      .map(id => new ChantierRowBuilder().avecId(id).build());
    await prisma.chantier.createMany({ data: chantierRows });

    const inputUtilisateurs: InputUtilisateur[] = [
      { email: 'sans.habilitations@example.com', profilCode: SANS_HABILITATIONS, chantierIds: [] },
      { email: 'ditp.admin@example.com', profilCode: DITP_ADMIN, chantierIds: [] },
      { email: 'ditp.pilotage@example.com', profilCode: DITP_PILOTAGE, chantierIds: [] },
      { email: 'premiere.ministre@example.com', profilCode: PM_ET_CABINET, chantierIds: [] },
      { email: 'presidence@example.com', profilCode: PR, chantierIds: [] },
      { email: 'cabinet.mtfp@example.com', profilCode: CABINET_MTFP, chantierIds: [] },
      { email: 'cabinet.ministeriel@example.com', profilCode: CABINET_MINISTERIEL, chantierIds: ['CH-001'] },
      { email: 'direction.admin.centrale@example.com', profilCode: DIR_ADMIN_CENTRALE, chantierIds: ['CH-002'] },
      { email: 'secretariat.general@example.com', profilCode: SECRETARIAT_GENERAL, chantierIds: ['CH-003'] },
      { email: 'directeur.projet1@example.com', profilCode: DIR_PROJET, chantierIds: ['CH-001'] },
      { email: 'equipe.dir.projet1@example.com', profilCode: EQUIPE_DIR_PROJET, chantierIds: ['CH-001'] },
      { email: 'directeur.projet2@example.com', profilCode: DIR_PROJET, chantierIds: ['CH-001', 'CH-002'] },
      { email: 'equipe.dir.projet2@example.com', profilCode: EQUIPE_DIR_PROJET, chantierIds: ['CH-001', 'CH-002'] },
    ];

    await créerUtilisateurs(prisma, inputUtilisateurs, profilIdByCode);
  });

  describe('un admin DITP', () => {
    it('a tous les droits sur tous les chantiers', async () => {
      // WHEN
      const habilitationRepository: HabilitationRepository = new HabilitationSQLRepository(prisma);
      const result = await habilitationRepository.récupèreHabilitationsPourUtilisateur('ditp.admin@example.com');

      // THEN
      expect(result).toStrictEqual({
        chantiers: {
          'CH-001': tousScopes,
          'CH-002': tousScopes,
          'CH-003': tousScopes,
          'CH-004': tousScopes,
          'CH-005': tousScopes,
        },
      });
    });
  });

  for (const [description, email] of [
    ['un·e équipier·e DITP', 'ditp.pilotage@example.com'],
    ['un·e premier·ère ministre', 'premiere.ministre@example.com'],
    ['la présidence', 'presidence@example.com'],
    ['un cabinet MTFP', 'cabinet.mtfp@example.com'],
  ]) {
    // eslint-disable-next-line @typescript-eslint/no-loop-func
    describe(description, () => {
      it('a les droits de lecture sur tous les chantiers', async () => {
        // WHEN
        const habilitationRepository: HabilitationRepository = new HabilitationSQLRepository(prisma);
        const result = await habilitationRepository.récupèreHabilitationsPourUtilisateur(email);

        // THEN
        expect(result).toStrictEqual({
          chantiers: {
            'CH-001': [SCOPE_LECTURE],
            'CH-002': [SCOPE_LECTURE],
            'CH-003': [SCOPE_LECTURE],
            'CH-004': [SCOPE_LECTURE],
            'CH-005': [SCOPE_LECTURE],
          },
        });
      });
    });
  }

  for (const [description, email, chantierId] of [
    ['un cabinet ministériel', 'cabinet.ministeriel@example.com', 'CH-001'],
    ['une direction admin centrale', 'direction.admin.centrale@example.com', 'CH-002'],
  ]) {
    // eslint-disable-next-line @typescript-eslint/no-loop-func
    describe(description, () => {
      it('a les droits de lecture sur une liste de chantiers', async () => {
        // GIVEN
        const expectedResult = {
          chantiers: { [chantierId]: [SCOPE_LECTURE] },
        };
        // WHEN
        const habilitationRepository: HabilitationRepository = new HabilitationSQLRepository(prisma);
        const result = await habilitationRepository.récupèreHabilitationsPourUtilisateur(email);

        // THEN
        expect(result).toStrictEqual(expectedResult);
      });
    });
  }

  describe('le secrétariat général', () => {
    it('a les droits de lecture sur une liste de chantiers', async () => {
      // GIVEN
      const expectedResult = {
        chantiers: { 'CH-003': [SCOPE_LECTURE, SCOPE_SAISIE_INDICATEURS] },
      };
      // WHEN
      const habilitationRepository: HabilitationRepository = new HabilitationSQLRepository(prisma);
      const result = await habilitationRepository.récupèreHabilitationsPourUtilisateur('secretariat.general@example.com');

      // THEN
      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('un directeur de projet', () => {
    it('avec habilitation sur un chantier', async () => {
      // WHEN
      const habilitationRepository: HabilitationRepository = new HabilitationSQLRepository(prisma);
      const result = await habilitationRepository.récupèreHabilitationsPourUtilisateur('directeur.projet1@example.com');

      // THEN
      expect(result).toStrictEqual({
        chantiers: { 'CH-001': tousScopes },
      });
    });

    it('avec habilitations sur deux chantiers', async () => {
      // GIVEN
      const expectedHabilitation = {
        chantiers: { 'CH-001': tousScopes, 'CH-002': tousScopes },
      };

      // WHEN
      const habilitationRepository: HabilitationRepository = new HabilitationSQLRepository(prisma);
      const result = await habilitationRepository.récupèreHabilitationsPourUtilisateur('directeur.projet2@example.com');

      // THEN
      expect(result).toStrictEqual(expectedHabilitation);
    });
  });

  describe('un équipier de projet', () => {
    it('avec habilitation sur un chantier', async () => {
      // WHEN
      const habilitationRepository: HabilitationRepository = new HabilitationSQLRepository(prisma);
      const result = await habilitationRepository.récupèreHabilitationsPourUtilisateur('equipe.dir.projet1@example.com');

      // THEN
      expect(result).toStrictEqual({
        chantiers: { 'CH-001': tousScopes },
      });
    });

    it('avec habilitations sur deux chantiers', async () => {
      // GIVEN
      const expectedHabilitation = {
        chantiers: { 'CH-001': tousScopes, 'CH-002': tousScopes },
      };

      // WHEN
      const habilitationRepository: HabilitationRepository = new HabilitationSQLRepository(prisma);
      const result = await habilitationRepository.récupèreHabilitationsPourUtilisateur('equipe.dir.projet2@example.com');

      // THEN
      expect(result).toStrictEqual(expectedHabilitation);
    });
  });

  describe('un email non trouvé', () => {
    it("n'a aucun droit sur aucun chantier", async () => {
      // WHEN
      const habilitationRepository: HabilitationRepository = new HabilitationSQLRepository(prisma);
      const result = await habilitationRepository.récupèreHabilitationsPourUtilisateur('existe.pas@example.com');

      // THEN
      expect(result).toStrictEqual({
        chantiers: {},
      });
    });
  });

  describe('Suppression des habilitations', () => {
    it('pour un utilisateur qui voit tous les chantiers', async () => {
      // GIVEN
      const email = 'ditp.admin@example.com';
      const repository: HabilitationRepository = new HabilitationSQLRepository(prisma);

      // WHEN
      await repository.supprimeHabilitationsPourUtilisateur(email);

      // THEN
      const habilitations = await repository.récupèreHabilitationsPourUtilisateur(email);
      expect(habilitations).toStrictEqual({ chantiers: {} });
    });
  });

  it('pour un utilisateur qui voit une liste de chantiers', async () => {
    // GIVEN
    const email = 'equipe.dir.projet2@example.com';
    const repository = new HabilitationSQLRepository(prisma);

    // WHEN
    await repository.supprimeHabilitationsPourUtilisateur(email);

    // THEN
    const habilitations = await repository.récupèreHabilitationsPourUtilisateur(email);
    expect(habilitations).toStrictEqual({ chantiers: {} });
    const associationsChantiers = await repository.récupèreAssociationsAvecChantier(email);
    expect(associationsChantiers).toStrictEqual([]);
    const associationsChantiersAutreUtilisateur = await repository.récupèreAssociationsAvecChantier('equipe.dir.projet1@example.com');
    expect(associationsChantiersAutreUtilisateur).not.toStrictEqual([]);
  });
});
