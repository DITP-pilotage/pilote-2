import PublicationProps from '@/client/components/_commons/Publication/Publication.interface';

export default interface PublicationHistoriqueProps {
  type: PublicationProps['type']['id']
  entité: PublicationProps['entité']
  chantierId: PublicationProps['chantierId']
  maille: PublicationProps['maille']
  codeInsee: PublicationProps['codeInsee']
}
