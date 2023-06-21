import Avancement from '@/server/domain/chantier/avancement/Avancement.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';

export const codesInseeDépartements = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13',
  '14', '15', '16', '17', '18', '19', '21', '22', '23', '24', '25', '26', '27',
  '28', '29', '2A', '2B', '30', '31', '32', '33', '34', '35', '36', '37', '38',
  '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51',
  '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63', '64',
  '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77',
  '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90',
  '91', '92', '93', '94', '95', '971', '972', '973', '974', '976',
] as const;

export const codesInseeRégions = [
  '01', '02', '03', '04', '06', '11', '24', '27', '28', '32', '44', '52', '53', '75',
  '76', '84', '93', '94',
] as const;

export const codeInseeFrance = 'FR';

export type CodeInsee = string;

export type TerritoiresDonnées = Record<CodeInsee, TerritoireDonnées>;

export type TerritoireDonnées = {
  codeInsee: CodeInsee,
  avancement: Avancement,
  avancementPrécédent: Avancement,
  météo: Météo,
  écart: number | null,
  tendance: 'BAISSE' | 'HAUSSE' | 'STAGNATION' | null,
  dateDeMàjDonnéesQualitatives: string | null,
  dateDeMàjDonnéesQuantitatives: string | null,
  alertes: {
    estEnAlerteÉcart: boolean,
    estEnAlerteBaisseOuStagnation: boolean,
    estEnAlerteDonnéesNonMàj: boolean,
  }
};

export type Territoire = {
  code: string,
  nom: string,
  nomAffiché: string,
  codeInsee: string,
  tracéSvg: string,
  codeParent: string | null,
  maille: Maille,
};

export type DétailTerritoire = Territoire & {
  accèsLecture: boolean
  accèsSaisiePublication: boolean
  accèsSaisieIndicateur: boolean
};
