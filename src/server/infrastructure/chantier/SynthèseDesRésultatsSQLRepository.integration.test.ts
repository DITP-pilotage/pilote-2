import { SynthèseDesRésultatsSQLRepository } from '@/server/infrastructure/chantier/SynthèseDesRésultatsSQLRepository';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';

describe('SynthèseDesRésultatsSQLRepository ', function () {
  test('Premier test', async () => {
    const résultatAttendu = {
      commentaireSynthèse: {
        contenu: 'Le suivi de l’indicateur relatif à la protection Animale...',
        date: new Date('2022-09-05T00:00:00.000Z'),
      },
    };

    await prisma.synthese_des_resultats.create({
      data: {
        chantier_id: 'CH-001',
        commentaire: résultatAttendu.commentaireSynthèse.contenu,
        date_commentaire: résultatAttendu.commentaireSynthèse.date,
        maille: 'NAT',
        code_insee: 'FR',
      },
    });

    const repository = new SynthèseDesRésultatsSQLRepository(prisma);
    const result = await repository.findNewestByChantierId('CH-001');
    expect(result).toStrictEqual(résultatAttendu);
  });
});
