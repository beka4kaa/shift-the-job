import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VerifiedBadge } from './VerifiedBadge';

describe('VerifiedBadge', () => {
  it('renders the badge when verified', () => {
    render(<VerifiedBadge verified={true} />);
    expect(screen.getByLabelText('Verified tutor')).toBeInTheDocument();
  });

  it('renders nothing when not verified', () => {
    const { container } = render(<VerifiedBadge verified={false} />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByLabelText('Verified tutor')).not.toBeInTheDocument();
  });

  it('applies an optional className to the wrapper when verified', () => {
    render(<VerifiedBadge verified={true} className="ml-2" />);
    expect(screen.getByLabelText('Verified tutor')).toHaveClass('ml-2');
  });
});
