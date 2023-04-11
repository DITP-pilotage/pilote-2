import {
  ChantierId,
  checkAuthorizationChantierScope,
  Habilitation,
  récupereListeChantierAvecScope,
  Scope,
  SCOPE_LECTURE,
  SCOPE_SAISIE_INDICATEURS,
  SCOPE_SAISIE_SYNTHESE_ET_COMMENTAIRES,
} from './Habilitation';

function createHabilitation(chantier: ChantierId, scope: Scope): Habilitation {
  return { chantiers: { [chantier]: [scope] } };
}

// Hypothese
// le parser ne laisse pas passer les cas null
describe('Habilitation', () => {
  const CHANTIER_ID: ChantierId = 'CH-001';

  describe('Scope Validation', () => {
    it("Valide l'authorisation pour un chantier si l'utlisateur a l'habilitation", () => {
      // GIVEN
      const habilitation: Habilitation = createHabilitation(CHANTIER_ID, SCOPE_LECTURE);
      // WHEN
      const result = checkAuthorizationChantierScope(habilitation, CHANTIER_ID, SCOPE_LECTURE);
      // THEN
      expect(result).toStrictEqual(true);
    });

    it("Invalide l'authorisation pour un chantier si l'utlisateur n'a pas l'habilitation", () => {
      // GIVEN
      const habilitation: Habilitation = createHabilitation(CHANTIER_ID, SCOPE_LECTURE);
      // WHEN
      const result = checkAuthorizationChantierScope(habilitation, CHANTIER_ID, SCOPE_SAISIE_SYNTHESE_ET_COMMENTAIRES);
      // THEN
      expect(result).toStrictEqual(false);
    });
  });

  describe("Récupération d'une liste de chantier à partir des droits", () => {
    it('Retourne le bon chantier', () => {
      // GIVEN
      const habilitation: Habilitation = createHabilitation(CHANTIER_ID, SCOPE_LECTURE);
      // WHEN
      const result = récupereListeChantierAvecScope(habilitation, SCOPE_LECTURE);
      // THEN
      expect(result).toStrictEqual([CHANTIER_ID]);
    });

    it('Retourne aucun chantier', () => {
      // GIVEN
      const habilitation: Habilitation = createHabilitation(CHANTIER_ID, SCOPE_LECTURE);
      // WHEN
      const result = récupereListeChantierAvecScope(habilitation, SCOPE_SAISIE_SYNTHESE_ET_COMMENTAIRES);
      // THEN
      expect(result).toStrictEqual([]);
    });

    it('trouve les bons chantiers avec plusieurs chantiers et plusieurs scopes', () => {
      // GIVEN
      const habilitation: Habilitation = {
        chantiers: {
          'CH-001': [SCOPE_LECTURE, SCOPE_SAISIE_SYNTHESE_ET_COMMENTAIRES, SCOPE_SAISIE_INDICATEURS],
          'CH-002': [SCOPE_LECTURE, SCOPE_SAISIE_INDICATEURS],
          'CH-003': [SCOPE_SAISIE_SYNTHESE_ET_COMMENTAIRES, SCOPE_SAISIE_INDICATEURS],
        },
      };
      // WHEN
      const result = récupereListeChantierAvecScope(habilitation, SCOPE_SAISIE_SYNTHESE_ET_COMMENTAIRES);
      // THEN
      expect(result).toStrictEqual(['CH-001', 'CH-003']);
    });
  });
});
