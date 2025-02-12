import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { stringify } from 'csv-stringify';
import { Options } from 'csv-stringify/lib/sync';
import assert from 'node:assert/strict';
import { ExportCsvDesChantiersUseCase } from '@/server/chantiers/usecases/ExportCsvDesChantiersUseCase';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { configuration } from '@/config';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import { getChantiersContainer } from '@/server/chantiers/container';

import { recupererJalon } from '@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/recupererJalon';
import { OptionsExport } from '@/server/usecase/chantier/OptionsExport';

export default async function handleExportDesChantiers(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  const session = await getServerSession(request, response, authOptions);
  assert(session);

  response.setHeader('Content-Type', 'text/csv');
  const jalon = recupererJalon(request.query?.jalon as string | undefined);

  const headersColumn = ExportCsvDesChantiersUseCase.NOMS_COLONNES(jalon);

  const stringifier = stringify({
    header: true,
    columns: session.profil === ProfilEnum.DITP_ADMIN ? [...headersColumn, 'statut'] : headersColumn,
    delimiter: ';',
    bom: true,
    quoted_string: true,
  } satisfies Options);
  stringifier.pipe(response);

  const habilitation = new Habilitation(session.habilitations);
  const territoireCodes = habilitation.récupérerListeTerritoireCodesAccessiblesEnLecture();
  const chunkSize =  configuration.export.csvChantiersChunkSize;
  const optionsExport = {
    perimetreIds: request.query.perimetreIds ? Array.isArray(request.query.perimetreIds) ? request.query.perimetreIds : [request.query.perimetreIds] as string[] : [],
    estBarometre: request.query.estBarometre === 'true',
    estTerritorialise: request.query.estTerritorialise === 'true',
    listeStatuts: request.query.statut ? Array.isArray(request.query.statut) ? request.query.statut : [request.query.statut] as string[] : [],
    listeChantierId: [],
    listeMeteos: request.query.meteos ? Array.isArray(request.query.meteos) ? request.query.meteos : [request.query.meteos] as string[] : [],
  } satisfies OptionsExport;

  const chantierIds = await getChantiersContainer().resolve('chantierRepository').récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(habilitation.récupérerListeChantiersIdsAccessiblesEnLecture(), optionsExport);

  const exportCsvDesChantiersUseCase = getChantiersContainer().resolve('exportCsvDesChantiersUseCase');

  for await (const partialResult of exportCsvDesChantiersUseCase.run({
    chantierIds,
    territoireCodes,
    profil: session.profil,
    chantierChunkSize: chunkSize,
    jalon,
    optionsExport,
  })) {
    for (const chantierPourExport of partialResult) {
      stringifier.write(chantierPourExport);
    }
  }

  stringifier.end();
}
