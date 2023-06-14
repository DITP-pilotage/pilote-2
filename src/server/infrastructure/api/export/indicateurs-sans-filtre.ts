import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { stringify } from 'csv-stringify';
import assert from 'node:assert/strict';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import ExportCsvDesIndicateursSansFiltreUseCase from '@/server/usecase/chantier/indicateur/ExportCsvDesIndicateursSansFiltreUseCase';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';

export default async function handleExportDesIndicateursSansFiltre(request: NextApiRequest, response: NextApiResponse): Promise<void> {
  const session = await getServerSession(request, response, authOptions);
  assert(session);

  response.setHeader('Content-Type', 'text/csv');

  const stringifier = stringify({
    header: true,
    columns: ExportCsvDesIndicateursSansFiltreUseCase.NOMS_COLONNES,
    delimiter: ';',
    bom: true,
  });
  stringifier.pipe(response);

  const habilitation = new Habilitation(session.habilitations);
  const exportCsvDesIndicateursSansFiltreUseCase = new ExportCsvDesIndicateursSansFiltreUseCase();
  for await (const partialResult of exportCsvDesIndicateursSansFiltreUseCase.run(habilitation, session.profil)) {
    for (const indicateurPourExport of partialResult) {
      stringifier.write(indicateurPourExport);
    }
  }
  stringifier.end();
}
