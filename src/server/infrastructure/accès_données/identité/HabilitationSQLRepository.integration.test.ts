/* eslint-disable */
import HabilitationSQLRepository from '@/server/infrastructure/accès_données/identité/HabilitationSQLRepository';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import HabilitationRepository from '@/server/domain/identité/HabilitationRepository';

describe('HabilitationSQLRepository', () => {
  it('récupère une habilitation sur un chantier', async () => {
    // GIVEN
    const utilisateurEmail = 'toto@example.com';

    const profilRow = await prisma.profil.create({
      data: { nom: 'Directeur de chantier' },
    });

    const utilisateurRow = await prisma.utilisateur.create({
      data: {
        email: utilisateurEmail,
        profil_id: profilRow.id,
      },
    });

    await prisma.utilisateur_chantier.create({
      data: {
        utilisateur_id: utilisateurRow.id,
        chantier_id: 'CH-001',
      },
    });

    const habilitationScopeRow = await prisma.habilitation_scope.create({
      data: {
        nom: 'lecture',
        description: 'Scope de lecture sur un chantier',
      },
    });

    await prisma.profil_habilitation.create({
      data: {
        profil_id: profilRow.id,
        habilitation_scope_id: habilitationScopeRow.id,
      },
    });

    const expectedHabilitation = {
      chantiers: { 'CH-001': ['lecture'] },
    };

    // WHEN
    const habilitationRepository: HabilitationRepository = new HabilitationSQLRepository(prisma);
    const result = await habilitationRepository.récupèreHabilitationsPourUtilisateur(utilisateurEmail);

    // THEN
    expect(result).toStrictEqual(expectedHabilitation);
  });

  it('récupère une habilitation sur deux chantier', async () => {
    // GIVEN
    const utilisateurEmail = 'toto@example.com';

    const profilRow = await prisma.profil.create({
      data: { nom: 'Directeur de chantier' },
    });

    const utilisateurRow = await prisma.utilisateur.create({
      data: {
        email: utilisateurEmail,
        profil_id: profilRow.id,
      },
    });

    await prisma.utilisateur_chantier.createMany({
      data: [
        { utilisateur_id: utilisateurRow.id, chantier_id: 'CH-001' },
        { utilisateur_id: utilisateurRow.id, chantier_id: 'CH-002' },
      ],
    });

    const habilitationScopeRow = await prisma.habilitation_scope.create({
      data: {
        nom: 'lecture',
        description: 'Scope de lecture sur un chantier',
      },
    });

    await prisma.profil_habilitation.create({
      data: {
        profil_id: profilRow.id,
        habilitation_scope_id: habilitationScopeRow.id,
      },
    });

    const expectedHabilitation = {
      chantiers: {
        'CH-001': ['lecture'],
        'CH-002': ['lecture'],
      },
    };

    // WHEN
    const habilitationRepository: HabilitationRepository = new HabilitationSQLRepository(prisma);
    const result = await habilitationRepository.récupèreHabilitationsPourUtilisateur(utilisateurEmail);

    // THEN
    expect(result).toStrictEqual(expectedHabilitation);
  });
  it('récupère deux habilitations sur un chantier', async () => {
    // GIVEN
    const utilisateurEmail = 'toto@example.com';

    const profilRow = await prisma.profil.create({
      data: { nom: 'Directeur de chantier' },
    });

    const utilisateurRow = await prisma.utilisateur.create({
      data: {
        email: utilisateurEmail,
        profil_id: profilRow.id,
      },
    });

    await prisma.utilisateur_chantier.create({
      data: {
        utilisateur_id: utilisateurRow.id,
        chantier_id: 'CH-001',
      },
    });

    const habilitationScopeRow1 = await prisma.habilitation_scope.create({
      data: { nom: 'lecture', description: 'Scope de lecture sur un chantier' },
    });
    const habilitationScopeRow2 = await prisma.habilitation_scope.create({
      data: { nom: 'écriture', description: "Scope d'écriture sur un chantier" },
    });

    await prisma.profil_habilitation.createMany({
      data: [
        { profil_id: profilRow.id, habilitation_scope_id: habilitationScopeRow1.id },
        { profil_id: profilRow.id, habilitation_scope_id: habilitationScopeRow2.id },
      ],
    });

    const expectedHabilitation = {
      chantiers: { 'CH-001': ['écriture', 'lecture'] },
    };

    // WHEN
    const habilitationRepository: HabilitationRepository = new HabilitationSQLRepository(prisma);
    const result = await habilitationRepository.récupèreHabilitationsPourUtilisateur(utilisateurEmail);

    // THEN
    expect(result).toStrictEqual(expectedHabilitation);
  });

  it('récupère deux habilitations sur un chantier', async () => {
    // GIVEN
    const utilisateurEmail = 'toto@example.com';

    const profilRow = await prisma.profil.create({
      data: { nom: 'Directeur de chantier' },
    });

    const utilisateurRow = await prisma.utilisateur.create({
      data: {
        email: utilisateurEmail,
        profil_id: profilRow.id,
      },
    });

    await prisma.utilisateur_chantier.create({
      data: {
        utilisateur_id: utilisateurRow.id,
        chantier_id: 'CH-001',
      },
    });

    const habilitationScopeRow1 = await prisma.habilitation_scope.create({
      data: { nom: 'lecture', description: 'Scope de lecture sur un chantier' },
    });
    const habilitationScopeRow2 = await prisma.habilitation_scope.create({
      data: { nom: 'écriture', description: "Scope d'écriture sur un chantier" },
    });

    await prisma.profil_habilitation.createMany({
      data: [
        { profil_id: profilRow.id, habilitation_scope_id: habilitationScopeRow1.id },
        { profil_id: profilRow.id, habilitation_scope_id: habilitationScopeRow2.id },
      ],
    });

    const expectedHabilitation = {
      chantiers: { 'CH-001': ['écriture', 'lecture'] },
    };

    // WHEN
    const habilitationRepository: HabilitationRepository = new HabilitationSQLRepository(prisma);
    const result = await habilitationRepository.récupèreHabilitationsPourUtilisateur(utilisateurEmail);

    // THEN
    expect(result).toStrictEqual(expectedHabilitation);
  });
});
