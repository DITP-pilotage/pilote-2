export interface AvancementChantierRapportDetaille {
  nationale: {
    global: {
      médiane: number | null;
      maximum: number | null;
      minimum: number | null;
      moyenne: number | null;
      date: string | null;
    };
    annuel: {
      moyenne: number | null;
      date: string | null;
    };
  };
  departementale: {
    global: {
      moyenne: number | null;
      date: string | null;
    };
    annuel: {
      moyenne: number | null;
      date: string | null;
    };
  };
  regionale: {
    global: {
      moyenne: number | null;
      date: string | null;
    };
    annuel: {
      moyenne: number | null;
      date: string | null;
    };
  };
}
