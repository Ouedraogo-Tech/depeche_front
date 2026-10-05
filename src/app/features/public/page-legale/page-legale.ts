import { DatePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

import { ParametreService } from '../../../core/api/parametre.service';
import { Spinner } from '../../../shared/ui/spinner/spinner';

type TypePage = 'mentions' | 'confidentialite';

const TITRES: Record<TypePage, string> = {
  mentions: 'Mentions légales',
  confidentialite: 'Politique de confidentialité',
};

// Pages légales : /mentions-legales et /confidentialite
// Le texte est rédigé par le webmaster dans "Paramètres du site" (GET /api/parametres)
@Component({
  selector: 'app-page-legale',
  imports: [DatePipe, RouterLink, Spinner],
  templateUrl: './page-legale.html',
  styleUrl: './page-legale.css',
})
export class PageLegale {
  // Rempli par la route : data: { type: 'mentions' } ou { type: 'confidentialite' }
  type = input<TypePage>('mentions');

  // undefined = chargement · null = erreur
  protected readonly parametres = toSignal(inject(ParametreService).obtenir().pipe(catchError(() => of(null))), {
    initialValue: undefined,
  });

  protected readonly titre = computed(() => TITRES[this.type()]);
  protected readonly texte = computed(() => {
    const p = this.parametres();
    if (!p) {
      return null;
    }
    return (this.type() === 'mentions' ? p.mentionsLegales : p.politiqueConfidentialite) ?? null;
  });
}
