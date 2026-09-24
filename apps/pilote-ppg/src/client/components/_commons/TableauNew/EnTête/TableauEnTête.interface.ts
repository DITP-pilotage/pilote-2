import { TableauAvecEnTetes } from "../../Tableau/typesTableau";

export default interface TableauEnTêteProps<TContexte extends object> {
  tableau: TableauAvecEnTetes<TContexte>;
}
