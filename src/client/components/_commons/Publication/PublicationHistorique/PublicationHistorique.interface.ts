import PublicationProps from '@/client/components/_commons/Publication/Publication.interface';

export default interface PublicationHistoriqueProps {
  type: PublicationProps['caractéristiques']['type']
  entité: PublicationProps['caractéristiques']['entité']
  chantierId: PublicationProps['chantierId']
  maille: PublicationProps['maille']
  codeInsee: PublicationProps['codeInsee']
}
