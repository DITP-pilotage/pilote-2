import { perimetre, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const périmètres:perimetre[] = [{
    id: 'PER-001',
    nom: 'Cinéma',
  }];
  const resultPérimètres = [];
  for (const périmètre of périmètres) {
    const result = await prisma.perimetre.upsert({
      where: { id: périmètre.id },
      update: {},
      create: périmètre,
    });
    resultPérimètres.push(result);
  }


  const chantier1 = await prisma.chantier.upsert({
    where: { id: '' },
    update: {},
    create: {
      id: 'CH-001',
      nom: 'Inception',
      id_perimetre: 'PER-001',
    },
  });
  console.log({ resultPérimètres, chantier1 });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
