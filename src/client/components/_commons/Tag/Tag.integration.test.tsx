import { screen, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { userEvent } from '@testing-library/user-event';
import Tag from '@/components/_commons/Tag/Tag';

test('le tag comporte le texte précisé', () =>{
  render(
    <Tag
      libellé='Texte du tag'
      suppressionCallback={()=>{}}
    />,
  );
  expect(screen.getByText('Texte du tag')).toBeInTheDocument();
});

test('le tag comporte un bouton', () =>{
  render(
    <Tag
      libellé='Texte du tag'
      suppressionCallback={()=>{}}
    />,
  );
  expect(screen.getByRole('button')).toBeInTheDocument();
});

test('le tag lance un event au clic', async () =>{
  const auClicCallback = jest.fn();

  render(
    <Tag
      libellé='Texte du tag'
      suppressionCallback={auClicCallback}
    />,
  );
  await userEvent.click(screen.getByRole('button'));
  expect(auClicCallback).toBeCalledTimes(1);
});



