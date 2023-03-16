import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import HabilitationRepository from '@/server/domain/identité/HabilitationRepository';
import HabilitationSQLRepository from '@/server/infrastructure/accès_données/identité/HabilitationSQLRepository';
import { habilitationsPourChantierIds } from '@/server/domain/identité/Habilitations';

describe('HabilitationSQLRepository', () => {
  it("renvoie une habilitation vide si l'utilisateur n'est pas trouvé", async () => {
    // GIVEN
    const repository: HabilitationRepository = new HabilitationSQLRepository(prisma);
    const emptyHabilitation = habilitationsPourChantierIds();
    // WHEN
    const result = await repository.getByUserId('no_user');

    // THEN
    expect(result).toStrictEqual(emptyHabilitation);
  });

  it('renvoie une habilitation en lecture sur un chantier', async () => {
    // GIVEN
    const repository: HabilitationRepository = new HabilitationSQLRepository(prisma);
    const userId = '1234azer';
    await prisma.iden_chantier_habilitation.create({
      data: { chantier_id: 'CH-001', identite_id: userId, scope: ['read'] },
    });

    // WHEN
    const result = await repository.getByUserId(userId);

    // THEN
    expect(result).toStrictEqual(habilitationsPourChantierIds('CH-001'));
  });
});
