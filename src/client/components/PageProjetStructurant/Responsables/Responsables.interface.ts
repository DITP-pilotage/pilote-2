import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';

export default interface ResponsablesPageProjetStructurantProps {
  responsables: ProjetStructurant['responsables']
  nomTerritoire: string
}
