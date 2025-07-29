export interface AvancementChantierRapportDetaille {
  nationale: {
    global: {
      médiane: number | null;
      maximum: number | null;
      minimum: number | null;
      moyenne: number | null;
    };
    annuel: {
      moyenne: number | null;
    };
  };
  departementale: {
    global: {
      moyenne: number | null;
    };
    annuel: {
      moyenne: number | null;
    };
  };
  regionale: {
    global: {
      moyenne: number | null;
    };
    annuel: {
      moyenne: number | null;
    };
  };
}
