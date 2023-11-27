import { screen, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';

describe('Jauge de progression', () => {
  test('la jauge contient le texte représentant son pourcentage', () => {
    render(
      <JaugeDeProgression
        couleur='bleu'
        libellé='test'
        pourcentage={24}
        taille='lg'
      />,
    );
    expect(screen.getByText('24%')).toBeInTheDocument();
  });

  test('la jauge contient "- %" si son pourcentage est null', () => {
    render(
      <JaugeDeProgression
        couleur='vert'
        libellé='test'
        pourcentage={null}
        taille='sm'
      />,
    );
    expect(screen.getByText('- %')).toBeInTheDocument();
  });

  test("le libellé correspondant à la jauge s'affiche", () => {
    render(
      <JaugeDeProgression
        couleur='orange'
        libellé="C'est un libellé de taille moyenne"
        pourcentage={null}
        taille='lg'
      />,
    );
    expect(screen.getByText('C\'est un libellé de taille moyenne')).toBeInTheDocument();
  });
});
