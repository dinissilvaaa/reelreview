// ============================================================================
// components/StarRating.test.tsx - component tests (rendered in a fake DOM).
// ============================================================================

import { describe, expect, it, vi } from 'vitest'; // Test API + mock functions
import { fireEvent, render, screen } from '@testing-library/react'; // Render + query + simulate events
import { StarRating } from './StarRating'; // Component under test

describe('<StarRating />', () => {
  it('shows an accessible label in read-only mode', () => {
    render(<StarRating value={4} />); // Render without onChange
    expect(screen.getByRole('img', { name: 'Rated 4 out of 5' })).toBeInTheDocument(); // Label for screen readers
    expect(screen.queryAllByRole('radio')).toHaveLength(0); // Not clickable
  });

  it('calls onChange with the clicked star in interactive mode', () => {
    const handleChange = vi.fn(); // Fake function that records its calls
    render(<StarRating value={0} onChange={handleChange} />); // Interactive mode
    fireEvent.click(screen.getByRole('radio', { name: '3 stars' })); // Click the 3rd star
    expect(handleChange).toHaveBeenCalledWith(3); // Received 3
  });

  it('marks the selected star as checked', () => {
    render(<StarRating value={2} onChange={() => undefined} />); // 2 selected
    expect(screen.getByRole('radio', { name: '2 stars' })).toHaveAttribute('aria-checked', 'true'); // Selected
    expect(screen.getByRole('radio', { name: '5 stars' })).toHaveAttribute('aria-checked', 'false'); // Not selected
  });
});
