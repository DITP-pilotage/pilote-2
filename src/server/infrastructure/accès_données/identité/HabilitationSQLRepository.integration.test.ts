import HabilitationSQLRepository from '@/server/infrastructure/accès_données/identité/HabilitationSQLRepository';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import HabilitationRepository from '@/server/domain/identité/HabilitationRepository';

describe('HabilitationSQLRepository', () => {
  it('récupère les habilitations', async () => {
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
});
