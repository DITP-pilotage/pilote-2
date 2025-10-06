export interface Rattachement {
  id: string;
  nom: string;
}

const RATTACHEMENTS_STUB: Rattachement[] = [
  {
    id: "1",
    nom: "Préfecture de Normandie",
  },
  {
    id: "2",
    nom: "Préfecture de Bourgogne-Franche-Comté",
  },
  {
    id: "3",
    nom: "Préfecture d'Île-de-France",
  },
];

export class ListerRattachementsUseCase {
  async run() {
    return RATTACHEMENTS_STUB;
  }
}
