import { PrismaClient } from '@prisma/client';
import { ChantierBuilder } from '@/fixtures/ChantierBuilder';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import ChantierSQLRepository from './ChantierSQLRepository';

describe('ChantierSQLRepository', () => {
  const prisma = new PrismaClient();
  const repository: ChantierRepository = new ChantierSQLRepository(prisma);
  const chantiers = Array.from({ length: 2 }).map(_ => new ChantierBuilder().construire());

  beforeAll(async () => {
    await repository.add(chantiers[0]);
    await repository.add(chantiers[1]);
  });

  describe('Accède à un chantier par son id', () => {
    let chantier: Chantier;

    beforeAll(async () => {
      chantier = await repository.getById(chantiers[0].id);
    });

    test('Retourne le chantier demandé', async () => {
      expect(chantier.id).toEqual(chantiers[0].id);
      expect(chantier.nom).toEqual(chantiers[0].nom);
    });

    test('Retourne le chantier avec les informations sur ses différentes mailles agrégées', async () => {
      expect(chantier.mailles.nationale.FR.codeInsee).toBe('FR');
      expect(chantier.mailles.départementale['01'].avancement.global).toBe(chantiers[0].mailles.départementale['01'].avancement.global);
      expect(chantier.mailles.régionale['1'].avancement.global).toBe(chantiers[0].mailles.régionale['1'].avancement.global);
    });
  });

  describe('Accède à une liste de chantiers', () => {
    let chantiersEnBDD: Chantier[];

    beforeAll(async () => {
      chantiersEnBDD = await repository.getListe();
    });

    test('Retourne les chantiers agrégés par identifiant', async () => {
      expect(chantiersEnBDD.length).toBe(2);
      expect(chantiersEnBDD[0].id).toBe(chantiers[0].id);
      expect(chantiersEnBDD[1].id).toBe(chantiers[1].id);
    });

    test('Retourne les chantiers avec les informations sur leurs différentes mailles agrégées', async () => {
      expect(chantiersEnBDD[0].mailles.nationale.FR.codeInsee).toBe('FR');
      expect(chantiersEnBDD[0].mailles.départementale['01'].avancement.global).toBe(chantiers[0].mailles.départementale['01'].avancement.global);
      expect(chantiersEnBDD[0].mailles.régionale['1'].avancement.global).toBe(chantiers[0].mailles.régionale['1'].avancement.global);
    });
  });
});
