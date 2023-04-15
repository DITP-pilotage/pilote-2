import assert from 'node:assert/strict';
import UtilisateurPourImport from '@/server/domain/identité/UtilisateurPourImport';
import { InputUtilisateur } from '@/server/infrastructure/accès_données/identité/seed';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { UtilisateurIAMRepository } from '@/server/domain/identité/UtilisateurIAMRepository';
import { UtilisateurRepository } from '@/server/domain/identité/UtilisateurRepository';

export default class ImporteUtilisateursUseCase {
  constructor(
    private readonly utilisateursÀImporter: UtilisateurPourImport[],
    private readonly utilisateurRepository: UtilisateurRepository = dependencies.getUtilisateurRepository(),
    private readonly utilisateurIAMRepository: UtilisateurIAMRepository = dependencies.getUtilisateurIAMRepository(),
  ) {
    assert(utilisateursÀImporter);
    assert.notDeepEqual([], utilisateursÀImporter);
  }

  async run() {
    const utilisateursPourIAM = this.utilisateursÀImporter.map(
      it => it.pourIAM(),
    );
    const utilisateursPourImportPilote: InputUtilisateur[] = this.utilisateursÀImporter.map(
      it => ({
        email: it.email,
        profilCode: it.profilCode,
        chantierIds: it.chantierIds,
      }),
    );

    // TODO: qu'est-ce qu'on fait si l'un réussit et pas l'autre ?
    await this.utilisateurIAMRepository.ajouteUtilisateurs(utilisateursPourIAM);
    await this.utilisateurRepository.créerUtilisateurs(utilisateursPourImportPilote);
  }
}
