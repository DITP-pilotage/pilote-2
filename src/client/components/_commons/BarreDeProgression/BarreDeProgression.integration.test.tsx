import '@testing-library/jest-dom';
import { render, within } from '@testing-library/react';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';

describe('Barre de progression', () => {
  test('la barre de progression est complété de son pourcentage', () => {
    render(
      <BarreDeProgression
        afficherTexte
        taille='sm'
        valeur={20}
        variante='primaire'
      />,
    );
    const pourcentage = document.querySelectorAll('.pourcentage')[0] as HTMLElement;
    const valeur = within(pourcentage).getByText('20 %');
    expect(valeur).toBeInTheDocument();
  });

  test("la barre de progression n'est pas complété de son pourcentage", () => {
    render(
      <BarreDeProgression
        afficherTexte={false}
        taille='sm'
        valeur={20}
        variante='primaire'
      />,
    );
    const pourcentage = document.querySelectorAll('.pourcentage').length;
    expect(pourcentage).toBe(0);
  });

  test('le pourcentage est placé au dessus de la barre de progression', () => {
    render(
      <BarreDeProgression
        positionTexte='dessus'
        taille='sm'
        valeur={20}
        variante='primaire'
      />,
    );
    const barreDeProgression = document.querySelectorAll('.barre-de-progression')[0];
    expect(barreDeProgression).toHaveClass('texte-dessus');
    expect(barreDeProgression).toHaveStyle('flex-direction: column-reverse');
  });

  test('le pourcentage est placé à côté de la barre de progression', () => {
    render(
      <BarreDeProgression
        positionTexte='côté'
        taille='sm'
        valeur={20}
        variante='primaire'
      />,
    );
    const barreDeProgression = document.querySelectorAll('.barre-de-progression')[0];
    expect(barreDeProgression).toHaveClass('texte-côté');
    expect(barreDeProgression).toHaveStyle('flex-direction: row');
  });
});
