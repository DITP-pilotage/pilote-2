export interface AvancementChantierRapportDetaille {
  nationale: {
    global: {
      médiane: number | null;
      maximum: number | null;
      minimum: number | null;
      moyenne: number | null
    };
    annuel: {
      moyenne: number | null
    }
  };
  départementale: {
    global: {
      moyenne?: number | null
    };
    annuel: {
      moyenne?: number | null
    }
  };
  régionale: {
    global: {
      moyenne?: number | null
    };
    annuel: {
      moyenne?: number | null
    }
  };
}
