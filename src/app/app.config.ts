import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { TitleStrategy, provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { TitreDepeche } from './core/titre-depeche';

// Dates en français avec le pipe date : "22 sept. 2026"
registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding : les paramètres d'URL (/articles/:id) arrivent dans les input() des pages
    // withInMemoryScrolling : chaque nouvelle page s'ouvre en haut (et non déjà défilée vers le bas)
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    // HttpClient pour appeler le backend + l'intercepteur qui colle le token sur chaque appel
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    { provide: LOCALE_ID, useValue: 'fr' },
    { provide: TitleStrategy, useClass: TitreDepeche }, // titre de l'onglet : "Page – Dépêche 226"
  ],
};
