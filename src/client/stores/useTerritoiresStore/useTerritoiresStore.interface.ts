import { MailleInterne, Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee, DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';

export default interface TerritoiresStore {
  départements: DétailTerritoire[]
  régions: DétailTerritoire[]
  mailleSélectionnée: MailleInterne,
  territoireSélectionné: DétailTerritoire | null,
  territoires: DétailTerritoire[]
  territoiresCodes: string[]
  territoiresAccessiblesEnLecture: DétailTerritoire[]
  territoiresComparés: DétailTerritoire[]
  maillesAccessiblesEnLecture: Maille[],
  actions: {
    initialiserLesTerritoires: (territoires: DétailTerritoire[]) => void,
    initialiserLeTerritoireSélectionnéParDéfaut: () => void,
    modifierMailleSélectionnée: (maille: MailleInterne) => void,
    modifierTerritoireSélectionné: (territoireCode: DétailTerritoire['code']) => void,
    récupérerDétailsSurUnTerritoireAvecCodeInsee: (codeInsee: CodeInsee) => DétailTerritoire
    récupérerDétailsSurUnTerritoire: (territoireCode: DétailTerritoire['code']) => DétailTerritoire
    modifierTerritoiresComparés: (territoireCode: DétailTerritoire['code']) => void
    récupérerCodesInseeDépartementsAssociésÀLaRégion: (codeInsee: CodeInsee, maille: MailleInterne) => CodeInsee[]
    récupérerCodesDépartementsAssociésÀLaRégion: (code: DétailTerritoire['code']) => DétailTerritoire['code'][]
  },
}
