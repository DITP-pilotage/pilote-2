import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { stringify } from 'csv-stringify';
import { Options } from 'csv-stringify/lib/sync';
import assert from 'node:assert/strict';
import { ExportCsvDesChantiersSansFiltreUseCase } from '@/server/usecase/chantier/ExportCsvDesChantiersSansFiltreUseCase';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { dependencies } from '@/server/infrastructure/Dependencies';
import config from '@/config';


export default async function handleExportDesChantiersSansFiltre(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  const session = await getServerSession(request, response, authOptions);
  assert(session);

  response.setHeader('Content-Type', 'text/csv');

  const stringifier = stringify({
    header: true,
    columns: ExportCsvDesChantiersSansFiltreUseCase.NOMS_COLONNES,
    delimiter: ';',
    bom: true,
    quoted_string: true,
  } satisfies Options);
  stringifier.pipe(response);

  const habilitation = new Habilitation(session.habilitations);
  const exportCsvDesChantiersSansFiltreUseCase = new ExportCsvDesChantiersSansFiltreUseCase(dependencies.getChantierRepository());
  for await (const partialResult of exportCsvDesChantiersSansFiltreUseCase.run({
    habilitation,
    profil: session.profil,
    chantierChunkSize: config.exportCsvChantiersChunkSize,
  })) {
    for (const chantierPourExport of partialResult) {
      stringifier.write(chantierPourExport);
    }
  }

  stringifier.end();
}
