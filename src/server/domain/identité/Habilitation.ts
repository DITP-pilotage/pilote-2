import logger from '@/server/infrastructure/logger';

export type Habilitation = {
  chantiers: HabilitationChantier
};

export type HabilitationChantier = { [key: ChantierId]: ScopeSet };

export type Scope = string;
export type ScopeSet = Scope[];

export type ChantierId = string;

/*
enum ScopeEnum {
  LIRE = 'read',
  LIRE_NAT = 'read_nat',
  ECRIRE_OBJECTIFS = 'ecrire_objectifs',
  ECRIRE_COM_REG = 'ecrire.com.*',
}
// - ecrire_com_reg

type ChantierScope = Set<ScopeEnum>;

type ChantierListe = string[];


export type ScopeCode = keyof Scope;

function construireHabilitation(objDePrismaAvecLaListeDroits: string[]): Habilitation {

  return {
    chantiers: construireChantierHabilitation(objDePrismaAvecLaListeDroits),
  }
}
// Convertir la réponse de la base de donnée en modele du cas d'usage
// Un adaptateur coté server side
// objDePrismaAvecLaListeDroits le type reste à définir avec SRO
function construireChantierHabilitation(objDePrismaAvecLaListeDroits: string[]): HabilitationChantier {
}
function checkScopePourChantier(hc: HabilitationChantier,  chantierId: ChantierId, scope: ScopeEnum): boolean {
  return true;
}
function checkScopePourChantiers(hc: HabilitationChantier, chantierId: ChantierId, scope: ScopeEnum[]): boolean {
  return true;
}
function getScopePourChantier(hc, chantierId): Scopes {
}
*/
function _checkScopeDansScopeSet(scope: Scope, scopeSet: ScopeSet): boolean {
  return scopeSet.some(elt => elt == scope);
}

export function checkAuthorizationChantierScope(habilitation: Habilitation, chantier: ChantierId, scope: Scope) {
  const chantiers: HabilitationChantier = habilitation.chantiers;

  const scopesChantier = chantiers[chantier];
  if (!scopesChantier) {
    logger.debug('Pas le chantier');
    return false;
  }
  const result = _checkScopeDansScopeSet(scope, scopesChantier);
  if (!result) {
    logger.debug('Pas le scope');
    return false;
  }
  return result;
}

export function récupereListeChantierAvecScope(habilitation: Habilitation, scope: Scope): ChantierId[] {
  const result: ChantierId[] = [];

  for (const [chantierId, scopeSet] of Object.entries(habilitation.chantiers)) {
    if (_checkScopeDansScopeSet(scope, scopeSet)) {
      result.push(chantierId);
    }
  }
  return result;
}
