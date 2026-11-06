import { Routes } from '@angular/router';

export const teamsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/teams-page/teams-page.component').then((m) => m.TeamsPageComponent),
  },
];
