import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { stringify } from 'csv-stringify';
import { Options } from 'csv-stringify/lib/sync';
import assert from 'node:assert/strict';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { configuration } from '@/config';
import { recupererJalon } from '@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/recupererJalon';
import { ExportCsvDesIndicateursUseCaseV2 } from '@/server/chantiers/usecases/ExportCsvDesIndicateursUseCaseV2';
import { OptionsExport } from '@/server/usecase/chantier/OptionsExport';
import { getContainer } from '@/server/dependances';
import { Maille } from '@/server/domain/maille/Maille.interface';

export const handleExportDesIndicateurs = async (request: NextApiRequest, response: NextApiResponse): Promise<void> => {
  const session = await getServerSession(request, response, authOptions);
  assert(session);

  response.setHeader('Content-Type', 'text/csv');

  const jalon = recupererJalon(request.query?.jalon as string | undefined);

  /* Pourra être amélioré avec nuqs server */
  const optionsExport = {
    perimetreIds: request.query.perimetreIds ? Array.isArray(request.query.perimetreIds) ? request.query.perimetreIds : [request.query.perimetreIds] as string[] : [],
    estBarometre: request.query.estBarometre === 'true',
    territorialisation: request.query.territorialisation ? Array.isArray(request.query.territorialisation) ? request.query.territorialisation.map(maille => maille as Maille) : [request.query.territorialisation as Maille] : [],
    listeStatuts: request.query.statut ? Array.isArray(request.query.statut) ? request.query.statut : [request.query.statut] as string[] : (session.profilAAccèsAuxChantiersBrouillons ? [] : ['PUBLIE', 'BROUILLON']),
    listeChantierId: request.query.listeChantierId ? (request.query.listeChantierId as string).split(',') : [],
    listeMeteos: request.query.meteos ? Array.isArray(request.query.meteos) ? request.query.meteos : [request.query.meteos] as string[] : [],
    listeOptionsExport: request.query.optionsExport ? Array.isArray(request.query.optionsExport) ? request.query.optionsExport : [request.query.optionsExport] as string[] : [],
    territoireCode: request.query.territoireCode as string | undefined,
    estEnAlerteTauxAvancementNonCalculé: request.query.estEnAlerteTauxAvancementNonCalculé === 'true',
    estEnAlerteÉcart: request.query.estEnAlerteÉcart === 'true',
    estEnAlerteBaisse: request.query.estEnAlerteBaisse === 'true',
    estEnAlerteMétéoNonRenseignée: request.query.estEnAlerteMétéoNonRenseignée === 'true',
    estEnAlerteAbscenceTauxAvancementDepartemental: request.query.estEnAlerteAbscenceTauxAvancementDepartemental === 'true',
    estEnAlertePossedePropositionsValeurAvancement: request.query.estEnAlertePossedePropositionsValeurAvancement === 'true', 
  } satisfies OptionsExport;

  const headersColumns = ExportCsvDesIndicateursUseCaseV2.NOMS_COLONNES(jalon, optionsExport, session.profil);
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

  const exportCsvDesIndicateursUseCase = getContainer('chantiers').resolve('exportCsvDesIndicateursUseCaseV2');

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
