import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from './Home';

test('loads and displays', () => {
  const user = {
    firstname: 'John',
    lastname: 'Doe',
  };
  render(<Home user={user} />);
  expect(screen.getByText('Ceci est le footer')).toBeDefined();
});
