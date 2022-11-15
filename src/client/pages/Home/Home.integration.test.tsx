import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from './Home';

test('loads and displays', () => {
  // GIVEN
  const user = {
    firstname: 'John',
    lastname: 'Doe',
  };

  // WHEN
  render(<Home user={user} />);

  // THEN
  expect(screen.getByText('Ceci est le footer')).toBeDefined();
});
