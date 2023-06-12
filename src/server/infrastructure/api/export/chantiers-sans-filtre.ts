import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { stringify } from 'csv-stringify';
import assert from 'node:assert/strict';
import { ExportCsvDesChantiersSansFiltreUseCase } from '@/server/usecase/chantier/ExportCsvDesChantiersSansFiltreUseCase';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';


export default async function handleExportDesChantiersSansFiltre(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  const session = await getServerSession(request, response, authOptions);
  assert(session);

  response.setHeader('Content-Type', 'text/csv');

  const stringifier = stringify({
    header: true,
    columns: ExportCsvDesChantiersSansFiltreUseCase.NOMS_COLONNES,
    delimiter: ';',
    bom: true,
  });
  stringifier.pipe(response);

  const exportCsvDesChantiersSansFiltreUseCase = new ExportCsvDesChantiersSansFiltreUseCase();
  for await (const partialResult of exportCsvDesChantiersSansFiltreUseCase.run(session.habilitations, session.profil)) {
    for (const chantierPourExport of partialResult) {
      stringifier.write(chantierPourExport);
    }
  }

  stringifier.end();
}
