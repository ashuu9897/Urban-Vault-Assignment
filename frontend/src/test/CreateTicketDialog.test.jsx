import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { listIssueCategories } from '../api/categories';
import { ApiError } from '../api/client';
import { createTicket } from '../api/tickets';
import { CreateTicketDialog } from '../components/tickets/CreateTicketDialog';
import { buildTicket, categories } from './fixtures';
import { renderWithProviders } from './renderWithProviders';

vi.mock('../api/categories');
vi.mock('../api/tickets');

function renderDialog(props = {}) {
  const handlers = { onClose: vi.fn(), onCreated: vi.fn() };
  renderWithProviders(<CreateTicketDialog open {...handlers} {...props} />);
  return handlers;
}

describe('CreateTicketDialog', () => {
  beforeEach(() => {
    listIssueCategories.mockResolvedValue(categories);
  });

  it('asks for an issue when submitted empty, without calling the API', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Please select an issue.')).toBeInTheDocument();
    expect(createTicket).not.toHaveBeenCalled();
  });

  it('fills the issue field when a quick-issue chip is tapped', async () => {
    const user = userEvent.setup();
    renderDialog();

    const chip = await screen.findByRole('button', { name: 'AC not cooling' });
    await user.click(chip);

    expect(screen.getByRole('combobox', { name: /issue/i })).toHaveValue('AC not cooling');
    expect(screen.getByText('Will be routed to Technical (HVAC)')).toBeInTheDocument();
    expect(chip).toHaveAttribute('aria-pressed', 'true');
  });

  it('submits the chosen issue and description, then reports the new ticket', async () => {
    const user = userEvent.setup();
    const created = buildTicket();
    createTicket.mockResolvedValue(created);
    const { onCreated } = renderDialog();

    await user.click(await screen.findByRole('button', { name: 'AC not cooling' }));
    await user.type(screen.getByRole('textbox', { name: 'Description' }), 'Warm air on 2F');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(createTicket.mock.calls[0][0]).toEqual({ categoryId: 1, description: 'Warm air on 2F' });
    expect(onCreated.mock.calls[0][0]).toEqual(created);
  });

  it('shows a non-field error from the API in an alert', async () => {
    const user = userEvent.setup();
    const message =
      'You already raised an open "AC not cooling" ticket in the last 24 hours (#TKT-1042).';
    createTicket.mockRejectedValue(
      new ApiError({ status: 400, message, fieldErrors: { non_field_errors: [message] } }),
    );
    renderDialog();

    await user.click(await screen.findByRole('button', { name: 'AC not cooling' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
  });
});
