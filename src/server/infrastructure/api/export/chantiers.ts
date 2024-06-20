import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { stringify } from 'csv-stringify';
import { Options } from 'csv-stringify/lib/sync';
import assert from 'node:assert/strict';
import { ExportCsvDesChantiersUseCase } from '@/server/usecase/chantier/ExportCsvDesChantiersUseCase';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { configuration } from '@/config';


export default async function handleExportDesChantiers(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  const session = await getServerSession(request, response, authOptions);
  assert(session);

  response.setHeader('Content-Type', 'text/csv');

  const stringifier = stringify({
    header: true,
    columns: session.profil === 'DITP_ADMIN' ? [...ExportCsvDesChantiersUseCase.NOMS_COLONNES, 'statut'] : ExportCsvDesChantiersUseCase.NOMS_COLONNES,
    delimiter: ';',
    bom: true,
    quoted_string: true,
  } satisfies Options);
  stringifier.pipe(response);

  const habilitation = new Habilitation(session.habilitations);
  const exportCsvDesChantiersSansFiltreUseCase = new ExportCsvDesChantiersUseCase(dependencies.getChantierRepository());
  for await (const partialResult of exportCsvDesChantiersSansFiltreUseCase.run({
    habilitation,
    profil: session.profil,
    chantierChunkSize: configuration.export.csvChantiersChunkSize,
    optionsExport: {
      perimetreIds: request.query.perimetreIds ? Array.isArray(request.query.perimetreIds) ? request.query.perimetreIds : [request.query.perimetreIds] as string[] : [],
      estBarometre: request.query.estBarometre === 'true',
      estTerritorialise: request.query.estTerritorialise === 'true',
      listeStatuts: request.query.statut ? Array.isArray(request.query.statut) ? request.query.statut : [request.query.statut] as string[] : [],
    },
  })) {
    for (const chantierPourExport of partialResult) {
      stringifier.write(chantierPourExport);
    }
  }

  stringifier.end();
}
