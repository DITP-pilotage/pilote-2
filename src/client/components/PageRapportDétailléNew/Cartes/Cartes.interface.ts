import {
  AvancementsGlobauxTerritoriauxMoyensContrat,
} from '@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat';
import {
  CartographieDonnéesMétéo,
} from '@/components/_commons/Cartographie/CartographieMétéoNew/CartographieMétéo.interface';

export default interface CartesProps {
  afficheCarteAvancement: boolean,
  afficheCarteMétéo: boolean,
  donnéesCartographieAvancement: AvancementsGlobauxTerritoriauxMoyensContrat
  donnéesCartographieMétéo: CartographieDonnéesMétéo
  territoireCode: string,
  mailleSelectionnee: 'départementale' | 'régionale',
}
