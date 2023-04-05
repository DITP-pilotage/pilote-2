import { z } from 'zod';
import { météosSaisissables } from '@/server/domain/météo/Météo.interface';
import SynthèseDesRésultats from './SynthèseDesRésultats.interface';

class SynthèseDesRésultatsValidateur {
  public limiteDeCaractèresContenu = 5000;

  private _schéma: Record<keyof NonNullable<SynthèseDesRésultats>, z.ZodType>;

  constructor() {
    this._schéma = {
      id: z.string(),
      contenu: z
        .string()
        .max(this.limiteDeCaractèresContenu, `La limite maximale de ${this.limiteDeCaractèresContenu} caractères a été dépassée`)
        .min(1, 'Le commentaire ne peut pas être vide'),
      météo: z.enum(météosSaisissables),
      date: z.string(),
      auteur: z.string(),
    };
  }

  créer() {
    return z.object({
      contenu: this._schéma.contenu,
      météo: this._schéma.météo,
    });
  } 
}

const synthèseDesRésultatsValidateur = new SynthèseDesRésultatsValidateur();
export default synthèseDesRésultatsValidateur;
