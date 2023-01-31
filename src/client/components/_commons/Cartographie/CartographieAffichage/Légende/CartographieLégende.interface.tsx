type CartographieÉlémentDeLégende = {
  couleur: string,
  libellé: string,
  picto?: string
};

export default interface CartographieLégendeProps {
  élémentsDeLégende: CartographieÉlémentDeLégende[],
}
