import {
  ChantierId,
  checkAuthorizationChantierScope,
  Habilitation,
  récupereListeChantierAvecScope,
  Scope,
  ScopeSet,
} from './Habilitation';

function createScopeSet(scopes: Scope[]): ScopeSet {
  return scopes;
}

function createHabilitation(chantier: ChantierId, scope: Scope): Habilitation {
  const scopeListe = createScopeSet([scope]);
  return { chantiers: { [chantier]: scopeListe } };
}

// Hypothese
// le parser ne laisse pas passer les cas null
describe('Habilitation', () => {
  describe('Scope Validation', () => {
    it("Valide l'authorisation pour un chantier si l'utlisateur a l'habilitation", () => {
      // GIVEN
      const chantier: ChantierId = 'CH-001';
      const scope: Scope = 'lire';
      const habilitation: Habilitation = createHabilitation(chantier, scope);
      // WHEN
      const result = checkAuthorizationChantierScope(habilitation, chantier, scope);
      // THEN
      expect(result).toStrictEqual(true);
    });

    it("Invalide l'authorisation pour un chantier si l'utlisateur n'a pas l'habilitation", () => {
      // GIVEN
      const chantier: ChantierId = 'CH-001';
      const scope_utilisateur: Scope = 'lire';
      const habilitation: Habilitation = createHabilitation(chantier, scope_utilisateur);
      const scope_demande: Scope = 'ecrire';
      // WHEN
      const result = checkAuthorizationChantierScope(habilitation, chantier, scope_demande);
      // THEN
      expect(result).toStrictEqual(false);
    });
  });

  describe("Récupération d'une liste de chantier à partier des droits", () => {
    it('Retourne le bon chantier', () => {
      // GIVEN
      const chantier: ChantierId = 'CH-001';
      const scope_utilisateur: Scope = 'lire';
      const habilitation: Habilitation = createHabilitation(chantier, scope_utilisateur);
      const scope_demande: Scope = 'lire';
      // WHEN
      const result = récupereListeChantierAvecScope(habilitation, scope_demande);
      // THEN
      expect(result).toStrictEqual([chantier]);
    });

    it('Retourne aucun chantier', () => {
      // GIVEN
      const chantier: ChantierId = 'CH-001';
      const scope_utilisateur: Scope = 'lire';
      const habilitation: Habilitation = createHabilitation(chantier, scope_utilisateur);
      const scope_demande: Scope = 'écrire';
      // WHEN
      const result = récupereListeChantierAvecScope(habilitation, scope_demande);
      // THEN
      expect(result).toStrictEqual([]);
    });

    it('Invalide si un scope dans une liste de scope', () => {
      // GIVEN
      // WHEN
      // THEN
    });


  });
  /* describe('Scope Liste', () => {
       it("Valide si un scope dans une liste de scope", () => {
           // GIVEN
           // WHEN
           // THEN
       });
   )
   describe('Scope PLop', () => {
       it("Valide si un scope dans une liste de scope", () => {
           // GIVEN
           // WHEN
           // THEN
       });
   });
   */
});
