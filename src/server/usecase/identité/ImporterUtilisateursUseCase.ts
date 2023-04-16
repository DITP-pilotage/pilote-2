import assert from 'node:assert/strict';
import UtilisateurPourImport from '@/server/domain/identité/UtilisateurPourImport';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { UtilisateurIAMRepository } from '@/server/domain/identité/UtilisateurIAMRepository';
import { UtilisateurRepository } from '@/server/domain/identité/UtilisateurRepository';

export default class ImporterUtilisateursUseCase {
  constructor(
    private readonly utilisateursÀImporter: UtilisateurPourImport[],
    private readonly utilisateurRepository: UtilisateurRepository = dependencies.getUtilisateurRepository(),
    private readonly utilisateurIAMRepository: UtilisateurIAMRepository = dependencies.getUtilisateurIAMRepository(),
  ) {
    assert(utilisateursÀImporter);
    assert.notDeepEqual([], utilisateursÀImporter);
  }

  async run(): Promise<void> {
    const utilisateursPourIAM = this.utilisateursÀImporter.map(
      it => it.pourIAM(),
    );

    // TODO: qu'est-ce qu'on fait si l'un réussit et pas l'autre ?
    await this.utilisateurIAMRepository.ajouteUtilisateurs(utilisateursPourIAM);
    await this.utilisateurRepository.créerOuRemplacerUtilisateurs(this.utilisateursÀImporter);
  }
}
