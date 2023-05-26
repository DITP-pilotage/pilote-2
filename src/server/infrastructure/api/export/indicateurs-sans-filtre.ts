import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { stringify } from 'csv-stringify';
import assert from 'node:assert/strict';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import ExportCsvDesIndicateursSansFiltreUseCase from '@/server/usecase/indicateur/ExportCsvDesIndicateursSansFiltreUseCase';

export default async function handleExportDesIndicateursSansFiltre(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  const session = await getServerSession(request, response, authOptions);
  assert(session);

  const exportCsvDesIndicateursSansFiltreUseCase = new ExportCsvDesIndicateursSansFiltreUseCase();
  const indicateursPourExport = await exportCsvDesIndicateursSansFiltreUseCase.run(session.habilitations, session.profil);

  response.setHeader('Content-Type', 'text/csv');

  const stringifier = stringify({
    header: true,
    columns: ExportCsvDesIndicateursSansFiltreUseCase.NOMS_COLONNES,
    delimiter: ';',
    bom: true,
  });

  stringifier.pipe(response);
  for (const indicateurPourExport of indicateursPourExport) {
    stringifier.write(indicateurPourExport);
  }
  stringifier.end();
}
