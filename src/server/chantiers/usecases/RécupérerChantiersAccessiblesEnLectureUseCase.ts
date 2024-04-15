import { chantier as chantierPrisma } from '@prisma/client';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import MinistèreRepository from '@/server/domain/ministère/MinistèreRepository.interface';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { parseChantier } from '@/server/infrastructure/accès_données/chantier/ChantierSQLParser';
import { groupBy } from '@/client/utils/arrays';
import { objectEntries } from '@/client/utils/objects/objects';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import ChantierDatesDeMàjRepository from '@/server/domain/chantier/ChantierDatesDeMàjRepository.interface';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import { FiltreQueryParams } from '@/server/chantiers/app/contrats/FiltreQueryParams';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default class RécupérerChantiersAccessiblesEnLectureUseCase {
  constructor(
    private readonly chantierRepository: ChantierRepository,
    private readonly chantierDatesDeMàjRepository: ChantierDatesDeMàjRepository,
    private readonly ministèreRepository: MinistèreRepository,
    private readonly territoireRepository: TerritoireRepository,
  ) {}

  async run(habilitations: Habilitations, profil: ProfilCode, maille: 'DEPT' | 'REG', filtres: FiltreQueryParams): Promise<Chantier[]> {
    const habilitation = new Habilitation(habilitations);
    const chantiersLecture = habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();
    const territoiresLecture = habilitation.récupérerListeTerritoireCodesAccessiblesEnLecture();

    const [axes, ppg] = await Promise.all(
      [
        dependencies.getAxeRepository().getListePourChantiers(chantiersLecture),
        dependencies.getPpgRepository().getListePourChantiers(chantiersLecture),
      ],
    );

    const filtresPourChantier: FiltreQueryParams = {
      perimetres: filtres.perimetres,
      axes: filtres.axes.map(filtre => axes.find(axe => axe.id === filtre)!.nom),
      ppg: filtres.ppg.map(filtre => ppg.find(ppgItem => ppgItem.id === filtre)!.nom),
      statut: filtres.statut,
      estTerritorialise: filtres.estTerritorialise,
      estBarometre: filtres.estBarometre,
    };

    const [chantiersRowsNat, chantiersRowsMaille, ministères, territoires, chantiersRowsDatesDeMàj ] = await Promise.all([
      this.chantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNewNat(chantiersLecture, territoiresLecture, profil, filtresPourChantier),
      this.chantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLecture, territoiresLecture, profil, maille, filtresPourChantier),
      this.ministèreRepository.getListePourChantiers(chantiersLecture),
      this.territoireRepository.récupérerTousNew(maille),
      this.chantierDatesDeMàjRepository.récupérerDatesDeMiseÀJour(chantiersLecture, territoiresLecture),
    ]);

    const chantiersGroupésParId = groupBy<chantierPrisma>([...chantiersRowsNat, ...chantiersRowsMaille], chantier => chantier.id);
    let chantiers = objectEntries(chantiersGroupésParId).map(([_, listeChantiers]) => parseChantier(listeChantiers, territoires, ministères, chantiersRowsDatesDeMàj));

    if (profil === 'DROM') {
      chantiers = chantiers.map(chantier => {
        if (!chantier.périmètreIds.includes('PER-018')) {
          chantier.mailles.nationale.FR.avancement.global = null;
          chantier.mailles.nationale.FR.avancement.annuel = null;
          chantier.mailles.nationale.FR.météo = 'NON_RENSEIGNEE';
        }

        return chantier;
      });
    }


    return chantiers;
  }
}
