import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { resolveTicket } from '../api/tickets';
import { TicketActionPanel } from '../components/tickets/TicketActionPanel';
import { formatDateTime } from '../utils/formatDate';
import { buildTicket, users } from './fixtures';
import { renderWithProviders } from './renderWithProviders';

vi.mock('../api/tickets');

describe('TicketActionPanel', () => {
  it('offers Assign Worker when the API says "assign"', () => {
    renderWithProviders(
      <TicketActionPanel ticket={buildTicket({ available_actions: ['assign'] })} />,
      { user: users.poc },
    );

    expect(screen.getByRole('button', { name: 'Assign Worker' })).toBeInTheDocument();
    expect(screen.getByText(/a new ticket has been assigned to you/i)).toBeInTheDocument();
  });

  it('offers Mark Resolved when the API says "resolve"', () => {
    renderWithProviders(
      <TicketActionPanel ticket={buildTicket({ available_actions: ['resolve'] })} />,
      { user: users.client },
    );

    expect(screen.getByRole('button', { name: 'Mark Resolved' })).toBeInTheDocument();
  });

  it('offers nothing actionable when there are no available actions', () => {
    renderWithProviders(<TicketActionPanel ticket={buildTicket({ available_actions: [] })} />, {
      user: users.poc,
    });

    expect(screen.getByText(/no action needed from you/i)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('requires a technician to explain the fix before resolving', async () => {
    const user = userEvent.setup();
    const ticket = buildTicket({ status: 'pending_resolution', available_actions: ['resolve'] });
    resolveTicket.mockResolvedValue({ ...ticket, status: 'resolved', available_actions: [] });
    renderWithProviders(<TicketActionPanel ticket={ticket} />, { user: users.technician });

    await user.click(screen.getByRole('button', { name: 'Mark Resolved' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(
      screen.getByText('A resolution comment (min 5 characters) is required.'),
    ).toBeInTheDocument();
    expect(resolveTicket).not.toHaveBeenCalled();

    await user.type(screen.getByRole('textbox', { name: /comment/i }), 'Replaced the filter.');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() =>
      expect(resolveTicket).toHaveBeenCalledWith(ticket.id, 'Replaced the filter.'),
    );
  });

  it('lets a client resolve without a comment', async () => {
    const user = userEvent.setup();
    const ticket = buildTicket({ available_actions: ['resolve'] });
    resolveTicket.mockResolvedValue({ ...ticket, status: 'resolved', available_actions: [] });
    renderWithProviders(<TicketActionPanel ticket={ticket} />, { user: users.client });

    await user.click(screen.getByRole('button', { name: 'Mark Resolved' }));
    expect(screen.getByRole('textbox', { name: 'Comment (optional)' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(resolveTicket).toHaveBeenCalledWith(ticket.id, ''));
  });

  it('shows the resolution date once resolved', () => {
    const ticket = buildTicket({ status: 'resolved', resolved_at: '2025-10-28T14:40:00+05:30' });
    renderWithProviders(<TicketActionPanel ticket={ticket} />, { user: users.client });

    // Built with the app's formatter so the test passes in any machine timezone.
    const expected = `This ticket was resolved on ${formatDateTime(ticket.resolved_at)}.`;
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});
