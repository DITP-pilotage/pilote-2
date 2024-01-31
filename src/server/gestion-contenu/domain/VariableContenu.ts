import { VARIABLE_CONTENU_DISPONIBLE } from '@/server/gestion-contenu/domain/VARIABLE_CONTENU_DISPONIBLE';

export class VariableContenu {
  private readonly _nomVariableContenu: keyof VARIABLE_CONTENU_DISPONIBLE;

  private readonly _valeurVariableContenu: string | boolean;

  private constructor({ nomVariableContenu, valeurVariableContenu }: { nomVariableContenu: keyof VARIABLE_CONTENU_DISPONIBLE, valeurVariableContenu: string | boolean }) {
    this._nomVariableContenu = nomVariableContenu;
    this._valeurVariableContenu = valeurVariableContenu;
  }

  get nomVariableContenu(): keyof VARIABLE_CONTENU_DISPONIBLE {
    return this._nomVariableContenu;
  }

  get valeurVariableContenu(): string | boolean {
    return this._valeurVariableContenu;
  }

  static creerVariableContenu({ nomVariableContenu, valeurVariableContenu }: { nomVariableContenu: keyof VARIABLE_CONTENU_DISPONIBLE, valeurVariableContenu: string | boolean }) {
    return new VariableContenu({ nomVariableContenu, valeurVariableContenu });
  }
}
