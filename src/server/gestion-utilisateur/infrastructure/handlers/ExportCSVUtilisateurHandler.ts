import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { stringify } from 'csv-stringify';
import { Options } from 'csv-stringify/lib/sync';
import assert from 'node:assert/strict';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { Habilitation } from '@/server/domain/utilisateur/habilitation/Habilitation';
import { OptionsExportUtilisateur } from '@/server/gestion-utilisateur/domain/OptionsExportUtilisateur';
import { getContainer } from '@/server/dependances';
import { FiltreQueryParams } from '@/server/gestion-utilisateur/app/contrats/FiltreQueryParams';
import { ProfilCode } from '@/server/gestion-utilisateur/domain/Utilisateur';
import { UtilisateurExportCSV } from '@/server/gestion-utilisateur/domain/UtilisateurExportCSV';
import { recupererLesNomsDesTerritoires } from '@/server/app/RecupererLesNomsDesTerritoiresPourUnUtilisateur';
import { Territoire } from '@/server/gestion-utilisateur/domain/Territoire';
import { profilsTerritoriaux } from '@/server/domain/utilisateur/Utilisateur.interface';
import { InformationChantierUtilisateur } from '@/server/gestion-utilisateur/domain/InformationChantierUtilisateur';
import { UnauthorizedError } from '@/server/app/error-boundary/unauthorized-error';

type UtilisateurPourExportCSVContrat = string[];

const HeadersExportCSVUtilisateur = (): string[] => {
  return [
    'Prénom',
    'Nom',
    'Email',
    'Fonction',
    'Profil',
    'Territoire',
    'Périmètre',
    'Droit de lecture',
    'Responsabilité',
    'Droits de saisie des données quantitatives',
    'Droits de saisie des commentaires',
    'Droits de gestion des utilisateurs',
    'Statut',
  ];
};

const recupererLesNomsDesChantiers = (listeChantiersIds: string[], listeInformationsChantiersUtilisateurs: InformationChantierUtilisateur[], aAccesTousLesChantiers: boolean): string[] => {
  if (aAccesTousLesChantiers) {
    return ['Tous les chantiers'];
  }

  const listeNomsChantiers = listeChantiersIds.map(chantierId => listeInformationsChantiersUtilisateurs.find(chantier => chantier.id === chantierId)?.nom || null).filter(Boolean);
  return listeChantiersIds.length === 0 ? ['Aucun chantier'] : listeNomsChantiers;
};

const presenterEnUtilisateurPourExportCSVContrat = (utilisateurPourExport: UtilisateurExportCSV, listeDesTerritoires: Territoire[], listeInformationsChantiersUtilisateurs: InformationChantierUtilisateur[]): UtilisateurPourExportCSVContrat => {
  return [
    utilisateurPourExport.prénom,
    utilisateurPourExport.nom,
    utilisateurPourExport.email,
    utilisateurPourExport.fonction || '',
    utilisateurPourExport.profil,
    recupererLesNomsDesTerritoires(utilisateurPourExport.profil, utilisateurPourExport.habilitations, listeDesTerritoires).join('\n'),
    utilisateurPourExport.habilitations.lecture.périmètres.join('\n') || !profilsTerritoriaux.includes(utilisateurPourExport.profil) ? 'Tous les périmètres' : 'Aucun périmètre',
    recupererLesNomsDesChantiers(utilisateurPourExport.habilitations.lecture.chantiers, listeInformationsChantiersUtilisateurs, utilisateurPourExport.habilitations.lecture.__meta.aAccesTousLesChantiers).join('\n'),
    recupererLesNomsDesChantiers(utilisateurPourExport.habilitations.responsabilite.chantiers, listeInformationsChantiersUtilisateurs, utilisateurPourExport.habilitations.lecture.__meta.aAccesTousLesChantiers).join('\n'),
    recupererLesNomsDesChantiers(utilisateurPourExport.habilitations.saisieIndicateur.chantiers, listeInformationsChantiersUtilisateurs, utilisateurPourExport.habilitations.lecture.__meta.aAccesTousLesChantiers).join('\n'),
    recupererLesNomsDesChantiers(utilisateurPourExport.habilitations.saisieCommentaire.chantiers, listeInformationsChantiersUtilisateurs, utilisateurPourExport.habilitations.lecture.__meta.aAccesTousLesChantiers).join('\n'),
    recupererLesNomsDesChantiers(utilisateurPourExport.habilitations.gestionUtilisateur.chantiers, listeInformationsChantiersUtilisateurs, utilisateurPourExport.habilitations.lecture.__meta.aAccesTousLesChantiers).join('\n'),
    utilisateurPourExport.statut,
  ];
};

export const handleExportDesUtilisateurs = async (request: NextApiRequest, response: NextApiResponse): Promise<void> => {
  const session = await getServerSession(request, response, authOptions);
  assert(session);

  response.setHeader('Content-Type', 'text/csv');

  const habilitation = new Habilitation(session.habilitations);

  if (!habilitation.peutConsulterLaListeDesUtilisateurs()) {
    throw new UnauthorizedError('Vous n\'avez pas les droits pour exporter les utilisateurs');
  }

  const optionsExport = {
    territoires: request.query.territoires ? Array.isArray(request.query.territoires) ? request.query.territoires : [request.query.territoires] as string[] : [],
    perimetresMinisteriels: request.query.perimetresMinisteriels ? Array.isArray(request.query.perimetresMinisteriels) ? request.query.perimetresMinisteriels : [request.query.perimetresMinisteriels] as string[] : [],
    chantiers: request.query.chantiers ? Array.isArray(request.query.chantiers) ? request.query.chantiers : [request.query.chantiers] as string[] : [],
    profils: request.query.profils ? Array.isArray(request.query.profils) ? request.query.profils as ProfilCode[] : [request.query.profils] as ProfilCode[] : [],
    typeCompte: request.query.typeCompte ? Array.isArray(request.query.typeCompte) ? request.query.typeCompte as ('actif' | 'desactive')[] : [request.query.typeCompte] as ('actif' | 'desactive')[] : [],
    queryString: request.query.queryString ? request.query.queryString as string : '',
  } satisfies OptionsExportUtilisateur;

  const listeChantiers = await getContainer('gestionUtilisateur').resolve('recupererChantiersSynthetisesUseCase').run({
    listeChantierIdLecture: habilitation.récupérerListeChantiersIdsAccessiblesEnLecture(),
  });

  const filtresChantiersSupplémentaires = listeChantiers.filter(chantier => chantier.périmètreIds.some(perimetreId => optionsExport.chantiers.includes(perimetreId)));

  const stringifier = stringify({
    header: true,
    columns: HeadersExportCSVUtilisateur(),
    delimiter: ';',
    bom: true,
    quoted_string: true,
  } satisfies Options);

  stringifier.pipe(response);

  const filtresActifs = {
    territoires: optionsExport.territoires,
    perimetresMinisteriels: optionsExport.perimetresMinisteriels,
    chantiers: optionsExport.chantiers,
    profils: optionsExport.profils,
    typeCompte: optionsExport.typeCompte,
    chantiersAssociésAuxPérimètres: filtresChantiersSupplémentaires?.map(chantier => chantier.id) ?? [],
  } satisfies FiltreQueryParams;

  const listeDesTerritoires = await getContainer('gestionUtilisateur').resolve('recupererTousLesTerritoiresUseCase').run();
  const listePerimetresMinisteriels = await getContainer('gestionUtilisateur').resolve('perimetreMinisterielRepository').listerIds([]);
  const listeInformationsChantiersUtilisateurs = await getContainer('gestionUtilisateur').resolve('chantierRepository').listerInformationsChantiersUtilisateurs();

  const listeUtilisateur = await getContainer('gestionUtilisateur').resolve('utilisateurRepository').recupererPourExports({ valeurDeLaRecherche: optionsExport.queryString, listeTerritoiresCodes: listeDesTerritoires.map(territoire => territoire.code), listePerimetresMinisteriels, listeInformationsChantiersUtilisateurs });
  const listeUtilisateurFiltré = getContainer('gestionUtilisateur').resolve('filtrerListeUtilisateursUseCase').run({ utilisateurs: listeUtilisateur, filtresActifs, profil: session.profil, habilitation });
  for (const utilisateurPourExport of listeUtilisateurFiltré) {
    stringifier.write(presenterEnUtilisateurPourExportCSVContrat(utilisateurPourExport, listeDesTerritoires, listeInformationsChantiersUtilisateurs));
  }
  stringifier.end();
};
