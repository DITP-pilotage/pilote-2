// TODO supprimer et faire passer en serverSideProps
const départements = [
  {
    'codeInsee': '01',
    'codeInseeRégion': '84',
    'nom': 'Ain',
  },
  {
    'codeInsee': '02',
    'codeInseeRégion': '32',
    'nom': 'Aisne',
  },
  {
    'codeInsee': '03',
    'codeInseeRégion': '84',
    'nom': 'Allier',
  },
  {
    'codeInsee': '04',
    'codeInseeRégion': '93',
    'nom': 'Alpes-de-Haute-Provence',
  },
  {
    'codeInsee': '05',
    'codeInseeRégion': '93',
    'nom': 'Hautes-Alpes',
  },
  {
    'codeInsee': '06',
    'codeInseeRégion': '93',
    'nom': 'Alpes-Maritimes',
  },
  {
    'codeInsee': '07',
    'codeInseeRégion': '84',
    'nom': 'Ardèche',
  },
  {
    'codeInsee': '08',
    'codeInseeRégion': '44',
    'nom': 'Ardennes',
  },
  {
    'codeInsee': '09',
    'codeInseeRégion': '76',
    'nom': 'Ariège',
  },
  {
    'codeInsee': '10',
    'codeInseeRégion': '44',
    'nom': 'Aube',
  },
  {
    'codeInsee': '11',
    'codeInseeRégion': '76',
    'nom': 'Aude',
  },
  {
    'codeInsee': '12',
    'codeInseeRégion': '76',
    'nom': 'Aveyron',
  },
  {
    'codeInsee': '13',
    'codeInseeRégion': '93',
    'nom': 'Bouches-du-Rhône',
  },
  {
    'codeInsee': '14',
    'codeInseeRégion': '28',
    'nom': 'Calvados',
  },
  {
    'codeInsee': '15',
    'codeInseeRégion': '84',
    'nom': 'Cantal',
  },
  {
    'codeInsee': '16',
    'codeInseeRégion': '75',
    'nom': 'Charente',
  },
  {
    'codeInsee': '17',
    'codeInseeRégion': '75',
    'nom': 'Charente-Maritime',
  },
  {
    'codeInsee': '18',
    'codeInseeRégion': '24',
    'nom': 'Cher',
  },
  {
    'codeInsee': '19',
    'codeInseeRégion': '75',
    'nom': 'Corrèze',
  },
  {
    'codeInsee': '21',
    'codeInseeRégion': '27',
    'nom': "Côte-d'Or",
  },
  {
    'codeInsee': '22',
    'codeInseeRégion': '53',
    'nom': "Côtes-d'Armor",
  },
  {
    'codeInsee': '23',
    'codeInseeRégion': '75',
    'nom': 'Creuse',
  },
  {
    'codeInsee': '24',
    'codeInseeRégion': '75',
    'nom': 'Dordogne',
  },
  {
    'codeInsee': '25',
    'codeInseeRégion': '27',
    'nom': 'Doubs',
  },
  {
    'codeInsee': '26',
    'codeInseeRégion': '84',
    'nom': 'Drôme',
  },
  {
    'codeInsee': '27',
    'codeInseeRégion': '28',
    'nom': 'Eure',
  },
  {
    'codeInsee': '28',
    'codeInseeRégion': '24',
    'nom': 'Eure-et-Loir',
  },
  {
    'codeInsee': '29',
    'codeInseeRégion': '53',
    'nom': 'Finistère',
  },
  {
    'codeInsee': '2A',
    'codeInseeRégion': '94',
    'nom': 'Corse-du-Sud',
  },
  {
    'codeInsee': '2B',
    'codeInseeRégion': '94',
    'nom': 'Haute-Corse',
  },
  {
    'codeInsee': '30',
    'codeInseeRégion': '76',
    'nom': 'Gard',
  },
  {
    'codeInsee': '31',
    'codeInseeRégion': '76',
    'nom': 'Haute-Garonne',
  },
  {
    'codeInsee': '32',
    'codeInseeRégion': '76',
    'nom': 'Gers',
  },
  {
    'codeInsee': '33',
    'codeInseeRégion': '75',
    'nom': 'Gironde',
  },
  {
    'codeInsee': '34',
    'codeInseeRégion': '76',
    'nom': 'Hérault',
  },
  {
    'codeInsee': '35',
    'codeInseeRégion': '53',
    'nom': 'Ille-et-Vilaine',
  },
  {
    'codeInsee': '36',
    'codeInseeRégion': '24',
    'nom': 'Indre',
  },
  {
    'codeInsee': '37',
    'codeInseeRégion': '24',
    'nom': 'Indre-et-Loire',
  },
  {
    'codeInsee': '38',
    'codeInseeRégion': '84',
    'nom': 'Isère',
  },
  {
    'codeInsee': '39',
    'codeInseeRégion': '27',
    'nom': 'Jura',
  },
  {
    'codeInsee': '40',
    'codeInseeRégion': '75',
    'nom': 'Landes',
  },
  {
    'codeInsee': '41',
    'codeInseeRégion': '24',
    'nom': 'Loir-et-Cher',
  },
  {
    'codeInsee': '42',
    'codeInseeRégion': '84',
    'nom': 'Loire',
  },
  {
    'codeInsee': '43',
    'codeInseeRégion': '84',
    'nom': 'Haute-Loire',
  },
  {
    'codeInsee': '44',
    'codeInseeRégion': '52',
    'nom': 'Loire-Atlantique',
  },
  {
    'codeInsee': '45',
    'codeInseeRégion': '24',
    'nom': 'Loiret',
  },
  {
    'codeInsee': '46',
    'codeInseeRégion': '76',
    'nom': 'Lot',
  },
  {
    'codeInsee': '47',
    'codeInseeRégion': '75',
    'nom': 'Lot-et-Garonne',
  },
  {
    'codeInsee': '48',
    'codeInseeRégion': '76',
    'nom': 'Lozère',
  },
  {
    'codeInsee': '49',
    'codeInseeRégion': '52',
    'nom': 'Maine-et-Loire',
  },
  {
    'codeInsee': '50',
    'codeInseeRégion': '28',
    'nom': 'Manche',
  },
  {
    'codeInsee': '51',
    'codeInseeRégion': '44',
    'nom': 'Marne',
  },
  {
    'codeInsee': '52',
    'codeInseeRégion': '44',
    'nom': 'Haute-Marne',
  },
  {
    'codeInsee': '53',
    'codeInseeRégion': '52',
    'nom': 'Mayenne',
  },
  {
    'codeInsee': '54',
    'codeInseeRégion': '44',
    'nom': 'Meurthe-et-Moselle',
  },
  {
    'codeInsee': '55',
    'codeInseeRégion': '44',
    'nom': 'Meuse',
  },
  {
    'codeInsee': '56',
    'codeInseeRégion': '53',
    'nom': 'Morbihan',
  },
  {
    'codeInsee': '57',
    'codeInseeRégion': '44',
    'nom': 'Moselle',
  },
  {
    'codeInsee': '58',
    'codeInseeRégion': '27',
    'nom': 'Nièvre',
  },
  {
    'codeInsee': '59',
    'codeInseeRégion': '32',
    'nom': 'Nord',
  },
  {
    'codeInsee': '60',
    'codeInseeRégion': '32',
    'nom': 'Oise',
  },
  {
    'codeInsee': '61',
    'codeInseeRégion': '28',
    'nom': 'Orne',
  },
  {
    'codeInsee': '62',
    'codeInseeRégion': '32',
    'nom': 'Pas-de-Calais',
  },
  {
    'codeInsee': '63',
    'codeInseeRégion': '84',
    'nom': 'Puy-de-Dôme',
  },
  {
    'codeInsee': '64',
    'codeInseeRégion': '75',
    'nom': 'Pyrénées-Atlantiques',
  },
  {
    'codeInsee': '65',
    'codeInseeRégion': '76',
    'nom': 'Hautes-Pyrénées',
  },
  {
    'codeInsee': '66',
    'codeInseeRégion': '76',
    'nom': 'Pyrénées-Orientales',
  },
  {
    'codeInsee': '67',
    'codeInseeRégion': '44',
    'nom': 'Bas-Rhin',
  },
  {
    'codeInsee': '68',
    'codeInseeRégion': '44',
    'nom': 'Haut-Rhin',
  },
  {
    'codeInsee': '69',
    'codeInseeRégion': '84',
    'nom': 'Rhône',
  },
  {
    'codeInsee': '70',
    'codeInseeRégion': '27',
    'nom': 'Haute-Saône',
  },
  {
    'codeInsee': '71',
    'codeInseeRégion': '27',
    'nom': 'Saône-et-Loire',
  },
  {
    'codeInsee': '72',
    'codeInseeRégion': '52',
    'nom': 'Sarthe',
  },
  {
    'codeInsee': '73',
    'codeInseeRégion': '84',
    'nom': 'Savoie',
  },
  {
    'codeInsee': '74',
    'codeInseeRégion': '84',
    'nom': 'Haute-Savoie',
  },
  {
    'codeInsee': '75',
    'codeInseeRégion': '11',
    'nom': 'Paris',
  },
  {
    'codeInsee': '76',
    'codeInseeRégion': '28',
    'nom': 'Seine-Maritime',
  },
  {
    'codeInsee': '77',
    'codeInseeRégion': '11',
    'nom': 'Seine-et-Marne',
  },
  {
    'codeInsee': '78',
    'codeInseeRégion': '11',
    'nom': 'Yvelines',
  },
  {
    'codeInsee': '79',
    'codeInseeRégion': '75',
    'nom': 'Deux-Sèvres',
  },
  {
    'codeInsee': '80',
    'codeInseeRégion': '32',
    'nom': 'Somme',
  },
  {
    'codeInsee': '81',
    'codeInseeRégion': '76',
    'nom': 'Tarn',
  },
  {
    'codeInsee': '82',
    'codeInseeRégion': '76',
    'nom': 'Tarn-et-Garonne',
  },
  {
    'codeInsee': '83',
    'codeInseeRégion': '93',
    'nom': 'Var',
  },
  {
    'codeInsee': '84',
    'codeInseeRégion': '93',
    'nom': 'Vaucluse',
  },
  {
    'codeInsee': '85',
    'codeInseeRégion': '52',
    'nom': 'Vendée',
  },
  {
    'codeInsee': '86',
    'codeInseeRégion': '75',
    'nom': 'Vienne',
  },
  {
    'codeInsee': '87',
    'codeInseeRégion': '75',
    'nom': 'Haute-Vienne',
  },
  {
    'codeInsee': '88',
    'codeInseeRégion': '44',
    'nom': 'Vosges',
  },
  {
    'codeInsee': '89',
    'codeInseeRégion': '27',
    'nom': 'Yonne',
  },
  {
    'codeInsee': '90',
    'codeInseeRégion': '27',
    'nom': 'Territoire de Belfort',
  },
  {
    'codeInsee': '91',
    'codeInseeRégion': '11',
    'nom': 'Essonne',
  },
  {
    'codeInsee': '92',
    'codeInseeRégion': '11',
    'nom': 'Hauts-de-Seine',
  },
  {
    'codeInsee': '93',
    'codeInseeRégion': '11',
    'nom': 'Seine-Saint-Denis',
  },
  {
    'codeInsee': '94',
    'codeInseeRégion': '11',
    'nom': 'Val-de-Marne',
  },
  {
    'codeInsee': '95',
    'codeInseeRégion': '11',
    'nom': "Val-d'Oise",
  },
  {
    'codeInsee': '971',
    'codeInseeRégion': '01',
    'nom': 'Guadeloupe',
  },
  {
    'codeInsee': '972',
    'codeInseeRégion': '02',
    'nom': 'Martinique',
  },
  {
    'codeInsee': '973',
    'codeInseeRégion': '03',
    'nom': 'Guyane',
  },
  {
    'codeInsee': '974',
    'codeInseeRégion': '04',
    'nom': 'La Réunion',
  },
  {
    'codeInsee': '976',
    'codeInseeRégion': '06',
    'nom': 'Mayotte',
  },
];

export default départements;
