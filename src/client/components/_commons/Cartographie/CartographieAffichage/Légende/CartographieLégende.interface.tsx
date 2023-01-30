type CartographieÉlémentDeLégende = {
  couleur: string,
  libellé: string,
  picto?: any
};

export default interface CartographieLégendeProps {
  élémentsDeLégende: CartographieÉlémentDeLégende[],
}
