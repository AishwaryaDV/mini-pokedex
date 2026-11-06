import { Routes } from '@angular/router';

export const pokedexRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/pokedex-page/pokedex-page.component').then(
        (m) => m.PokedexPageComponent,
      ),
  },
];
