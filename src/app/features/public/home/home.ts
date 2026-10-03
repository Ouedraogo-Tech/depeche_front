import { DatePipe, SlicePipe, UpperCasePipe } from '@angular/common';
import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of, startWith, switchMap } from 'rxjs';

import { ArticleService } from '../../../core/api/article.service';
import { CategorieService } from '../../../core/api/categorie.service';
import { ArticleCard } from '../../../shared/article/article-card/article-card';
import { TempsLecturePipe } from '../../../shared/pipes/temps-lecture.pipe';
import { Spinner } from '../../../shared/ui/spinner/spinner';

// Page d'accueil du site public (maquette "Accueil")
//   "/"                  = toutes les rubriques
//   "/?rubrique=3"       = seulement la rubrique n° 3
//   "/?recherche=coton"  = résultats de recherche
@Component({
  selector: 'app-home',
  imports: [RouterLink, DatePipe, UpperCasePipe, SlicePipe, ArticleCard, TempsLecturePipe, Spinner],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly articleService = inject(ArticleService);

  protected readonly aujourdhui = new Date();

  // Paramètres de l'adresse (withComponentInputBinding) · undefined = absent
  rubrique = input<string>();
  recherche = input<string>();

  // Le mot cherché, nettoyé ("" = pas de recherche)
  protected readonly motRecherche = computed(() => this.recherche()?.trim() ?? '');

  // Les rubriques pour la barre de pastilles (GET /api/categories, public)
  protected readonly categories = toSignal(inject(CategorieService).lister().pipe(catchError(() => of([]))), {
    initialValue: [],
  });
  protected readonly rubriqueActive = computed(
    () => this.categories().find((c) => c.id === Number(this.rubrique())) ?? null,
  );

  // Les deux filtres réunis : si l'un OU l'autre change, on recharge
  private readonly filtres = computed(() => ({ rubrique: this.rubrique(), recherche: this.motRecherche() }));

  // Les articles PUBLIÉS correspondant aux filtres, du plus récent au plus ancien.
  // null = en chargement ; [] si le backend ne répond pas.
  protected readonly articles = toSignal(
    toObservable(this.filtres).pipe(
      switchMap((f) =>
        this.articleService.listerPublies(f.rubrique ? Number(f.rubrique) : undefined, f.recherche || undefined).pipe(
          catchError(() => of([])),
          startWith(null), // "Chargement…" pendant l'appel
        ),
      ),
    ),
    { initialValue: null },
  );

  // "À la une" : le plus récent en grand, les 3 suivants à droite
  protected readonly aLaUne = computed(() => this.articles()?.[0] ?? null);
  protected readonly secondaires = computed(() => this.articles()?.slice(1, 4) ?? []);

  // "Dernières actualités" : 6 cartes, puis 6 de plus à chaque "Voir plus" (remis à 6 quand un filtre change)
  private readonly nombreAffiches = linkedSignal({ source: this.filtres, computation: () => 6 });
  protected readonly dernieres = computed(() => this.articles()?.slice(4, 4 + this.nombreAffiches()) ?? []);
  protected readonly encoreDesArticles = computed(
    () => (this.articles()?.length ?? 0) > 4 + this.nombreAffiches(),
  );

  protected voirPlus(): void {
    this.nombreAffiches.update((n) => n + 6);
  }
}
