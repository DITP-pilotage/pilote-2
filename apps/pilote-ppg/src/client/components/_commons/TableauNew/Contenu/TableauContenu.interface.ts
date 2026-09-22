import { TableauAvecLignes } from "../../Tableau/typesTableau";

export default interface TableauContenuProps<TContexte extends object> {
  tableau: TableauAvecLignes<TContexte>;
}
