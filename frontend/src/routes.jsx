import { Navigate, useRoutes } from 'react-router-dom';

import { NotFoundPage } from './pages/NotFoundPage';
import { TicketsPage } from './pages/TicketsPage';
import { paths } from './utils/paths';

/**
 * The app's route table.
 *
 * `/tickets/:ticketId?` is a single route with an optional segment, so opening or closing a
 * ticket keeps the same TicketsPage mounted (the list doesn't reload or lose its scroll).
 */
const routes = [
  { path: '/', element: <Navigate to={paths.tickets} replace /> },
  { path: `${paths.tickets}/:ticketId?`, element: <TicketsPage /> },
  { path: '*', element: <NotFoundPage /> },
];

export function AppRoutes() {
  return useRoutes(routes);
}
