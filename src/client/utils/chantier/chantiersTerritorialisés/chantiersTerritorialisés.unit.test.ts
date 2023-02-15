import territorialiserChantiers from './chantiersTerritorialisés';

describe('Territorialiser Chantiers', () => {
  it('À partir d\'une liste de chantiers, retourne une liste avec pour chaque chantier son id, son nom et sa météo et avancement global en fonction du territoire donné', () => {
    //GIVEN
    const chantiers = [
      {
        id: '01',
        nom: 'Chantier 01',
        axe: null,
        ppg: null,
        périmètreIds: ['périmètre 01'],
        mailles: {
          nationale: {   
            'FR': {
              avancement: { global : 67, annuel: 99 },
              codeInsee: 'FR',
              météo: 'ORAGE' as const,
            },
          },
          régionale: {},
          départementale: {
            '01': {
              avancement: { global: 40, annuel: 27 },
              codeInsee: '01',
              météo: 'SOLEIL' as const,
            },
            '75': {
              avancement: { global: 10, annuel: 2 },
              codeInsee: '75',
              météo: 'NUAGE' as const,
            },
          },
        },
        responsables: {
          porteur: 'poteur',
          coporteurs: ['corporteur'],
          directeursAdminCentrale: [{ nom: 'directeurAdmin', direction: 'direction' }],
          directeursProjet: [{ nom: 'directeurProjet', email: null }],
        },
        estBaromètre: true,
      },
            
      {
        id: '02',
        nom: 'Chantier 02',
        axe: null,
        ppg: null,
        périmètreIds: ['périmètre 01'],
        mailles: {
          nationale: {   
            'FR': {
              avancement: { global : 99, annuel: 99 },
              codeInsee: 'FR',
              météo: 'SOLEIL' as const,
            },
          },
          régionale: {},
          départementale: {
            '01': {
              avancement: { global: 67, annuel: 27 },
              codeInsee: '01',
              météo: 'NUAGE' as const,
            },
            '75': {
              avancement: { global: 78, annuel: 89 },
              codeInsee: '75',
              météo: 'ORAGE' as const,
            },
          },
        },
        responsables: {
          porteur: 'poteur',
          coporteurs: ['corporteur'],
          directeursAdminCentrale: [{ nom: 'directeurAdmin', direction: 'direction' }],
          directeursProjet: [{ nom: 'directeurProjet', email: null }],
        },
        estBaromètre: false,
      },
    ];
        
    const périmètreGéographique = { maille: 'départementale' as const, codeInsee: '75' };
        
    //WHEN
    const résultat = territorialiserChantiers(chantiers, périmètreGéographique);
        
    //THEN
    const attendu = [
      { id: '01', nom: 'Chantier 01', avancementGlobalTerritoire: 10, météoTerritoire: 'NUAGE', estBaromètre: true },
      { id: '02', nom: 'Chantier 02', avancementGlobalTerritoire: 78, météoTerritoire: 'ORAGE', estBaromètre: false },
    ];
        
    expect(résultat).toStrictEqual(attendu);
  });
});
    
