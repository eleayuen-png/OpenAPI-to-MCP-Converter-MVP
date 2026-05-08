import { createBrowserRouter } from 'react-router';
import Root from './pages/Root';
import Upload from './pages/Upload';
import Prune from './pages/Prune';
import MacroTools from './pages/MacroTools';
import Auth from './pages/Auth';
import Deploy from './pages/Deploy';
import Logs from './pages/Logs';
import NotFound from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Upload },
      { path: 'prune', Component: Prune },
      { path: 'macro-tools', Component: MacroTools },
      { path: 'auth', Component: Auth },
      { path: 'deploy', Component: Deploy },
      { path: 'logs', Component: Logs },
      { path: '*', Component: NotFound },
    ],
  },
]);
