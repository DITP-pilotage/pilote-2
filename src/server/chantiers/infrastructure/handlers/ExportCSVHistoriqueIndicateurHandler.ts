import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { stringify } from 'csv-stringify';
import { Options } from 'csv-stringify/lib/sync';
import assert from 'node:assert/strict';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { configuration } from '@/config';
import { recupererJalon } from '@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/recupererJalon';
import {
  ExportCsvDesHistoriquesIndicateursUseCase,
} from '@/server/chantiers/usecases/ExportCsvDesHistoriquesIndicateursUseCase';
import { getContainer } from '@/server/dependances';

export const handleExportDesHistoriquesIndicateurs = async (request: NextApiRequest, response: NextApiResponse): Promise<void> => {
  const session = await getServerSession(request, response, authOptions);
  assert(session);

  response.setHeader('Content-Type', 'text/csv');

  const jalon = recupererJalon(request.query?.jalon as string | undefined);

  const optionsExport = {
    perimetreIds: request.query.perimetreIds ? Array.isArray(request.query.perimetreIds) ? request.query.perimetreIds : [request.query.perimetreIds] as string[] : [],
    estBarometre: request.query.estBarometre === 'true',
    estTerritorialise: request.query.estTerritorialise === 'true',
    listeStatuts: request.query.statut ? Array.isArray(request.query.statut) ? request.query.statut : [request.query.statut] as string[] : [],
    listeChantierId: request.query.listeChantierId ? (request.query.listeChantierId as string).split(',') : [],
    listeMeteos: request.query.meteos ? Array.isArray(request.query.meteos) ? request.query.meteos : [request.query.meteos] as string[] : [],
    listeOptionsExport: request.query.optionsExport ? Array.isArray(request.query.optionsExport) ? request.query.optionsExport : [request.query.optionsExport] as string[] : [],
    territoireCode: request.query.territoireCode as string | undefined,
  };

  const headersColumns = ExportCsvDesHistoriquesIndicateursUseCase.NOMS_COLONNES(jalon);
  const stringifier = stringify({
    header: true,
    columns: headersColumns,
    delimiter: ';',
    bom: true,
    quoted_string: true,
  } satisfies Options);

  stringifier.pipe(response);

  const chunkSize =  configuration.export.csvIndicateursChunkSize;

  const habilitation = new Habilitation(session.habilitations);

  const territoireCodes = habilitation.récupérerListeTerritoireCodesAccessiblesEnLecture();

  let territoireARecuperer = territoireCodes;

  if (optionsExport.territoireCode && optionsExport.territoireCode !== 'NAT-FR') {
    territoireARecuperer = await getContainer('chantiers').resolve('territoireRepository').recupererTerritoireCodesEtTerritoiresCodesEnfantsParTerritoireCode({ territoireCode: optionsExport.territoireCode });
    territoireARecuperer = territoireARecuperer.filter((territoireCode) => territoireCodes.includes(territoireCode));
  }
  
  const chantierIds = await getContainer('chantiers').resolve('chantierRepository').récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(habilitation.récupérerListeChantiersIdsAccessiblesEnLecture(), optionsExport);

  const exportCsvDesIndicateursUseCase = getContainer('chantiers').resolve('exportCsvDesHistoriquesIndicateursUseCase');

  for await (const partialResult of exportCsvDesIndicateursUseCase.run({
    chantierIds,
    territoireCodes: territoireARecuperer,
    profil: session.profil,
    indicateurChunkSize: chunkSize,
    jalon,
    optionsExport,
  })) {
    for (const indicateurPourExport of partialResult) {
      stringifier.write(indicateurPourExport);
    }
  }
  stringifier.end();
};
