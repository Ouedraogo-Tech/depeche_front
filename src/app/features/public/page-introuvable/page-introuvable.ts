import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { ArticleService } from '../../../core/api/article.service';
import { ArticleCard } from '../../../shared/article/article-card/article-card';

// Page 404 : affichée pour toute adresse qui ne correspond à aucune route
@Component({
  selector: 'app-page-introuvable',
  imports: [RouterLink, ArticleCard],
  templateUrl: './page-introuvable.html',
  styleUrl: './page-introuvable.css',
})
export class PageIntrouvable {
  // L'adresse demandée (ex. : "/nimporte-quoi"), affichée pour que le visiteur comprenne
  protected readonly adresse = inject(Router).url;

  // 3 articles récents pour ne pas laisser le visiteur sans rien à lire
  protected readonly suggestions = toSignal(
    inject(ArticleService)
      .listerPublies()
      .pipe(
        map((liste) => liste.slice(0, 3)),
        catchError(() => of([])),
      ),
    { initialValue: [] },
  );
}
