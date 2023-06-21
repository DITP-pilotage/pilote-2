import CompteurFiltre from '@/client/utils/filtres/CompteurFiltre';

const éléments = [
  { id: 'QAT', population: 2_680_000, estHémisphèreNord: true, continent: 'Asie' },
  { id: 'ARM', population: 2_790_000, estHémisphèreNord: true, continent: 'Asie' },
  { id: 'LTU', population: 2_800_000, estHémisphèreNord: true, continent: 'Europe' },
  { id: 'ALB', population: 2_810_000, estHémisphèreNord: true, continent: 'Europe' },
  { id: 'JAM', population: 2_820_000, estHémisphèreNord: true, continent: 'Amérique' },
  { id: 'PRI', population: 3_260_000, estHémisphèreNord: true, continent: 'Amérique' },
  { id: 'BIH', population: 3_270_000, estHémisphèreNord: true, continent: 'Europe' },
  { id: 'MNG', population: 3_340_000, estHémisphèreNord: true, continent: 'Asie' },
  { id: 'ERI', population: 3_620_000, estHémisphèreNord: true, continent: 'Afrique' },
  { id: 'GEO', population: 3_700_000, estHémisphèreNord: true, continent: 'Asie' },
  { id: 'HRV', population: 3_890_000, estHémisphèreNord: true, continent: 'Europe' },
  { id: 'PAN', population: 4_350_000, estHémisphèreNord: true, continent: 'Amérique' },
  { id: 'OMN', population: 4_520_000, estHémisphèreNord: true, continent: 'Asie' },
  { id: 'MRT', population: 4_610_000, estHémisphèreNord: true, continent: 'Afrique' },
  { id: 'KWT', population: 4_250_000, estHémisphèreNord: true, continent: 'Asie' },
  { id: 'PSE', population: 4_920_000, estHémisphèreNord: true, continent: 'Asie' },
  { id: 'IRL', population: 5_030_000, estHémisphèreNord: true, continent: 'Europe' },
  { id: 'NZL', population: 5_120_000, estHémisphèreNord: false, continent: 'Océanie' },
  { id: 'BRA', population: 214_320_000, estHémisphèreNord: false, continent: 'Amérique' },
  { id: 'VUT', population: 310_000, estHémisphèreNord: false, continent: 'Océanie' },
  { id: 'CHL', population: 19_490_000, estHémisphèreNord: false, continent: 'Amérique' },
  { id: 'URY', population: 3_420_000, estHémisphèreNord: false, continent: 'Amérique' },
];

describe('CompteurFiltre', () => {
  test("renvoie le nom du filtre et le nombre d'éléments correspondant à un critère", () => {
    // Given
    const compteurFiltre = new CompteurFiltre(éléments);

    // When
    const filtresComptesCalculés = compteurFiltre.compter([{
      nomCritère: 'population < 3000000', condition: (e) => e.population < 3_000_000,
    }]);

    // Then
    expect(filtresComptesCalculés).toStrictEqual({
      'population < 3000000': {
        nomCritère: 'population < 3000000',
        nombre: 6,
      },
    });
  });

  test("renvoie les noms des filtres et les nombres d'éléments correspondant à leur critère respectif", () => {
    // Given
    const compteurFiltre = new CompteurFiltre(éléments);

    // When
    const filtresComptesCalculés = compteurFiltre.compter([
      { nomCritère: 'population < 3000000', condition: (e) => e.population < 3_000_000 },
      { nomCritère: 'population < 1000000', condition: (e) => e.population < 1_000_000 },
      { nomCritère: 'est hémisphère sud', condition: (e) => !e.estHémisphèreNord },
    ]);

    // Then
    expect(filtresComptesCalculés).toStrictEqual({
      'population < 3000000': {
        nomCritère: 'population < 3000000',
        nombre: 6,
      },
      'population < 1000000': {
        nomCritère: 'population < 1000000',
        nombre: 1,
      },
      'est hémisphère sud': {
        nomCritère: 'est hémisphère sud',
        nombre: 5,
      },
    });
  });
});
