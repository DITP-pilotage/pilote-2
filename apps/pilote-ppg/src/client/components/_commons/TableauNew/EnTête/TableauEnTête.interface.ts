import { LigneTableau, TableauDe } from "../../Tableau/typesTableau";

export default interface TableauEnTêteProps<T extends LigneTableau> {
  tableau: TableauDe<T>;
}
