export type ObjectifMesure = {
  territoire_code: string;
  metric_date: string;
  metric_value: number | null;
};

export interface MesureIndicateurObjectifRepository {
  recupererDernieresValeursCibles(args: {
    indicId: string;
  }): Promise<ObjectifMesure[]>;
}
