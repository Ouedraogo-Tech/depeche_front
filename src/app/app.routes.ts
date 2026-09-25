import { Routes } from '@angular/router';

import { PublicLayout } from './layouts/public-layout/public-layout';

export const routes: Routes = [
  {
    path: '', // l'adresse http://localhost:4200/
    component: PublicLayout,
    children: [], // les pages publiques (accueil, article...) viendront ici
  },
];
