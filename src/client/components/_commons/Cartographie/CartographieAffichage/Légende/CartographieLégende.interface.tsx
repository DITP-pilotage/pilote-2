type CartographieÉlémentDeLégende = {
  couleur: string,
  libellé: string,
  picto?: string,
  hachures?: boolean
};

export default interface CartographieLégendeProps {
  élémentsDeLégende: CartographieÉlémentDeLégende[],
}
