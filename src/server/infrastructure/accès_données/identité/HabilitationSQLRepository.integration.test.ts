/* eslint-disable sonarjs/no-duplicate-string */
import HabilitationSQLRepository from '@/server/infrastructure/accès_données/identité/HabilitationSQLRepository';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import HabilitationRepository from '@/server/domain/identité/HabilitationRepository';
import { SCOPE_LECTURE } from '@/server/domain/identité/Habilitation';

describe('HabilitationSQLRepository', () => {
  it('récupère une habilitation sur un chantier', async () => {
    // GIVEN
    const { id: profil_id } = await prisma.profil.create({
      data: { nom: 'Directeur de chantier', code: 'DIRC' },
    });

    const email = 'toto@example.com';
    const { id: utilisateur_id } = await prisma.utilisateur.create({
      data: { email, profil_id },
    });

    const chantier_id = 'CH-001';
    await prisma.utilisateur_chantier.create({
      data: { utilisateur_id, chantier_id },
    });

    const { id: habilitation_scope_id } = await prisma.habilitation_scope.create({
      data: { code: SCOPE_LECTURE, nom: 'Scope de lecture sur un chantier' },
    });

    await prisma.profil_habilitation.create({
      data: { profil_id, habilitation_scope_id },
    });

    const expectedHabilitation = {
      chantiers: { [chantier_id]: [SCOPE_LECTURE] },
    };

    // WHEN
    const habilitationRepository: HabilitationRepository = new HabilitationSQLRepository(prisma);
    const result = await habilitationRepository.récupèreHabilitationsPourUtilisateur(email);

    // THEN
    expect(result).toStrictEqual(expectedHabilitation);
  });

  it('récupère une habilitation sur deux chantier', async () => {
    // GIVEN
    const { id: profil_id } = await prisma.profil.create({
      data: { nom: 'Directeur de chantier', code: 'DIRC' },
    });

    const email = 'toto@example.com';
    const { id: utilisateur_id } = await prisma.utilisateur.create({
      data: { email, profil_id },
    });

    const chantier_id = 'CH-001';
    await prisma.utilisateur_chantier.createMany({
      data: [
        { utilisateur_id, chantier_id: chantier_id },
        { utilisateur_id, chantier_id: 'CH-002' },
      ],
    });

    const { id: habilitation_scope_id } = await prisma.habilitation_scope.create({
      data: { code: SCOPE_LECTURE, nom: 'Scope de lecture sur un chantier' },
    });

    await prisma.profil_habilitation.create({
      data: { profil_id, habilitation_scope_id },
    });

    const expectedHabilitation = {
      chantiers: {
        'CH-001': [SCOPE_LECTURE],
        'CH-002': [SCOPE_LECTURE],
      },
    };

    // WHEN
    const habilitationRepository: HabilitationRepository = new HabilitationSQLRepository(prisma);
    const result = await habilitationRepository.récupèreHabilitationsPourUtilisateur(email);

    // THEN
    expect(result).toStrictEqual(expectedHabilitation);
  });
  it('récupère deux habilitations sur un chantier', async () => {
    // GIVEN
    const { id: profil_id } = await prisma.profil.create({
      data: { nom: 'Directeur de chantier', code: 'DIRC' },
    });

    const email = 'toto@example.com';
    const { id: utilisateur_id } = await prisma.utilisateur.create({
      data: { email, profil_id },
    });

    const chantier_id = 'CH-001';
    await prisma.utilisateur_chantier.create({
      data: { utilisateur_id, chantier_id },
    });

    const { id: habilitationScopeRowId1 } = await prisma.habilitation_scope.create({
      data: { code: SCOPE_LECTURE, nom: 'Scope de lecture sur un chantier' },
    });
    const { id: habilitationScopeRowId2 } = await prisma.habilitation_scope.create({
      data: { code: 'écriture', nom: "Scope d'écriture sur un chantier" },
    });

    await prisma.profil_habilitation.createMany({
      data: [
        { profil_id, habilitation_scope_id: habilitationScopeRowId1 },
        { profil_id, habilitation_scope_id: habilitationScopeRowId2 },
      ],
    });

    const expectedHabilitation = {
      chantiers: { [chantier_id]: ['écriture', SCOPE_LECTURE] },
    };

    // WHEN
    const habilitationRepository: HabilitationRepository = new HabilitationSQLRepository(prisma);
    const result = await habilitationRepository.récupèreHabilitationsPourUtilisateur(email);

    // THEN
    expect(result).toStrictEqual(expectedHabilitation);
  });

  it('récupère deux habilitations sur un chantier', async () => {
    // GIVEN
    const { id: profil_id } = await prisma.profil.create({
      data: { nom: 'Directeur de chantier', code: 'DIRC' },
    });

    const email = 'toto@example.com';
    const { id: utilisateur_id } = await prisma.utilisateur.create({
      data: { email, profil_id },
    });

    const chantier_id = 'CH-001';
    await prisma.utilisateur_chantier.create({
      data: {
        utilisateur_id,
        chantier_id: chantier_id,
      },
    });

    const { id: habilitationScopeRowId1 } = await prisma.habilitation_scope.create({
      data: { code: SCOPE_LECTURE, nom: 'Scope de lecture sur un chantier' },
    });
    const { id: habilitationScopeRowId2 } = await prisma.habilitation_scope.create({
      data: { code: 'écriture', nom: "Scope d'écriture sur un chantier" },
    });

    await prisma.profil_habilitation.createMany({
      data: [
        { profil_id, habilitation_scope_id: habilitationScopeRowId1 },
        { profil_id, habilitation_scope_id: habilitationScopeRowId2 },
      ],
    });

    const expectedHabilitation = {
      chantiers: { [chantier_id]: ['écriture', SCOPE_LECTURE] },
    };

    // WHEN
    const habilitationRepository: HabilitationRepository = new HabilitationSQLRepository(prisma);
    const result = await habilitationRepository.récupèreHabilitationsPourUtilisateur(email);

    // THEN
    expect(result).toStrictEqual(expectedHabilitation);
  });
});
