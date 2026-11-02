import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TicketList } from '../components/tickets/TicketList';
import { buildTicket } from './fixtures';
import { renderWithProviders } from './renderWithProviders';

function renderList(props = {}) {
  const handlers = {
    onRetry: vi.fn(),
    onClearFilters: vi.fn(),
    onPageChange: vi.fn(),
    onView: vi.fn(),
  };
  renderWithProviders(
    <TicketList
      data={undefined}
      isPending={false}
      error={null}
      tab="open"
      hasFilters={false}
      page={1}
      selectedId={null}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe('TicketList', () => {
  it('shows skeletons while loading', () => {
    renderList({ isPending: true });

    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-busy', 'true');
    expect(document.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0);
    expect(screen.queryByText(/showing/i)).not.toBeInTheDocument();
  });

  it('shows the tab-specific empty state when there are no tickets', () => {
    renderList({ data: { count: 0, results: [] } });

    expect(screen.getByText('No open tickets')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
  });

  it('offers Clear filters when a search or filter matched nothing', async () => {
    const user = userEvent.setup();
    const { onClearFilters } = renderList({ data: { count: 0, results: [] }, hasFilters: true });

    expect(screen.getByText('No matching tickets')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('shows the error with a working Retry button', async () => {
    const user = userEvent.setup();
    const { onRetry } = renderList({ error: new Error('Could not reach the server.') });

    expect(screen.getByRole('alert')).toHaveTextContent('Could not reach the server.');
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders the page summary, cards and pagination', async () => {
    const user = userEvent.setup();
    const results = Array.from({ length: 10 }, (_, i) =>
      buildTicket({ id: 100 + i, code: `TKT-${1100 + i}` }),
    );
    const { onPageChange, onView } = renderList({ data: { count: 23, results }, page: 1 });

    expect(screen.getByText('Showing 1–10 of 23')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'View' })).toHaveLength(10);

    await user.click(screen.getByRole('button', { name: 'Go to page 2' }));
    expect(onPageChange).toHaveBeenCalledWith(2);

    await user.click(screen.getAllByRole('button', { name: 'View' })[0]);
    expect(onView).toHaveBeenCalledWith(100);
  });
});
