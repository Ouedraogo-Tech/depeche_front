import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { TokenService } from '../auth/token.service';

// Colle le token sur chaque appel au backend, et déconnecte si le backend répond 401
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenService).lire();
  const authService = inject(AuthService);
  const router = inject(Router);

  // On ajoute le token seulement pour NOTRE API (/api/...), jamais pour un autre site
  const versApi = req.url.startsWith(environment.apiUrl);
  const requete =
    token && versApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(requete).pipe(
    catchError((erreur: HttpErrorResponse) => {
      // 401 alors qu'on avait un token = token expiré ou invalide → déconnexion
      if (erreur.status === 401 && token) {
        // Lecteur : il reste sur la page qu'il lisait · Équipe : retour à la page de connexion
        const destination = authService.aLeRole('LECTEUR') ? router.url : '/connexion';
        authService.deconnecter(destination);
      }
      // On laisse l'erreur continuer : la page pourra afficher son message
      return throwError(() => erreur);
    }),
  );
};
