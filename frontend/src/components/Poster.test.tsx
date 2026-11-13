// ============================================================================
// components/Poster.test.tsx - component tests for the poster/placeholder.
// ============================================================================

import { describe, expect, it } from 'vitest'; // Test API
import { fireEvent, render, screen } from '@testing-library/react'; // Render + query + events
import { Poster } from './Poster'; // Component under test

describe('<Poster />', () => {
  it('renders a placeholder when there is no poster URL', () => {
    render(<Poster title="Inception" posterUrl="" />); // No image
    expect(screen.getByRole('img', { name: 'Placeholder poster for Inception' })).toBeInTheDocument(); // Placeholder shown
    expect(screen.getByText('Inception')).toBeInTheDocument(); // Title inside it
  });

  it('renders the image and falls back to the placeholder if it fails to load', () => {
    render(<Poster title="Up" posterUrl="https://example.com/up.jpg" />); // With image
    const image = screen.getByRole('img', { name: 'Poster of Up' }); // The <img>
    expect(image).toHaveAttribute('src', 'https://example.com/up.jpg'); // Right URL
    fireEvent.error(image); // Simulate a broken image
    expect(screen.getByRole('img', { name: 'Placeholder poster for Up' })).toBeInTheDocument(); // Fallback shown
  });
});
