import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the tic-tac-toe title', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /tic-tac-toe/i })).toBeInTheDocument();
});
