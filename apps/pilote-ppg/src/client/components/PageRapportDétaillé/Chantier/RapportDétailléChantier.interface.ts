import { DétailTerritoire } from "@/server/domain/territoire/Territoire.interface";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import {
  ChantierRapportDetailleSansMailles,
  DetailChantierRapportDetaille,
} from "@/server/rapport-detaille/rapportDetaille.interface";

export default interface RapportDétailléChantierProps {
  territoireSélectionné: DétailTerritoire;
  mailleSelectionnee: MailleInterne;
  territoireCode: string;
  chantier: ChantierRapportDetailleSansMailles;
  detail: DetailChantierRapportDetaille;
  jalon: number;
}
