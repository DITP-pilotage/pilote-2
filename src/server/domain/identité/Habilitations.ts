type HabilitationsChantier = { [key: ChantierId]: Set<string> };

type ChantierId = string;

type Habilitations = {
  chantiers: HabilitationsChantier
};

export function habilitationsChantierIds(habilitations: Habilitations) {
  return Object.keys(habilitations.chantiers);
}

export function habilitationsPourChantierIds(...chantierIds: string[]) {
  const habilitationsChantier: HabilitationsChantier = {};
  for (const chantierId of chantierIds) {
    habilitationsChantier[chantierId] = new Set(['read']);
  }
  return { chantiers: habilitationsChantier };
}

export default Habilitations;
