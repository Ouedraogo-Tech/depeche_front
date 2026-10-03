
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { RoleName } from '../models/utilisateur.model';

// Vigile d'un espace : il faut être connecté ET avoir le rôle indiqué dans la route
// (ex : data: { role: 'ADMIN' })
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const roleAttendu = route.data['role'] as RoleName;

  // Pas connecté → page de connexion
  if (!authService.estConnecte()) {
    return router.createUrlTree(['/connexion']);
  }

  // Le bon rôle → on laisse entrer
  if (authService.aLeRole(roleAttendu)) {
    return true;
  }

  // Connecté mais pas le bon rôle → retour dans SON espace
  return router.createUrlTree([authService.cheminAccueil()]);
};
