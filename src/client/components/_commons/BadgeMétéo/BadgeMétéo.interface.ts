import { Météo } from '@/server/domain/météo/Météo.interface';

export default interface BadgeMétéoProps {
  météo: Météo,
  className?: string,
}
