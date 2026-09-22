import { LigneTableau, TableauDe } from "../../Tableau/typesTableau";

export default interface TableauContenuProps<T extends LigneTableau> {
  tableau: TableauDe<T>;
}
