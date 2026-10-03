import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Observable, catchError, of, switchMap } from 'rxjs';

import { ArticleService } from '../../../core/api/article.service';
import { CategorieService } from '../../../core/api/categorie.service';
import { ApiError } from '../../../core/models/api-error.model';
import { Article, ArticleRequest, StatutArticle } from '../../../core/models/article.model';
import { ArticleForm } from '../../../shared/article/article-form/article-form';
import { Panel } from '../../../shared/ui/panel/panel';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { Spinner } from '../../../shared/ui/spinner/spinner';

// Les statuts dans lesquels le journaliste peut modifier (et supprimer) son article
// (PUBLIE : correction d'un article déjà en ligne, il reste publié)
export const STATUTS_MODIFIABLES: StatutArticle[] = ['BROUILLON', 'A_REVISER', 'REFUSE', 'PUBLIE'];

// Modifier un article : /journaliste/articles/12/modifier
@Component({
  selector: 'app-modifier-article',
  imports: [RouterLink, Panel, ArticleForm, StatusBadge, Spinner],
  templateUrl: './modifier-article.html',
  styleUrl: './modifier-article.css',
})
export class ModifierArticle {
  private readonly articleService = inject(ArticleService);
  private readonly router = inject(Router);

  id = input.required<string>(); // le "12" de l'adresse

  // false pour le responsable éditorial (route data) : il n'a pas la permission ARTICLE_SOUMETTRE
  boutonSoumettre = input(true);

  // "/journaliste/mes-articles" ou "/editorial/mes-articles" selon l'espace où la page est ouverte
  protected readonly retourMesArticles = '/' + this.router.url.split('/')[1] + '/mes-articles';

  // Les catégories pour la liste déroulante
  protected readonly categories = toSignal(inject(CategorieService).lister().pipe(catchError(() => of([]))), {
    initialValue: [],
  });

  // undefined = chargement · null = introuvable (ou pas le sien)
  protected readonly article = signal<Article | null | undefined>(undefined);
  protected readonly modifiable = computed(() => {
    const a = this.article();
    return !!a && STATUTS_MODIFIABLES.includes(a.statut);
  });

  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  constructor() {
    // GET /api/articles/{id} : le backend refuse si ce n'est pas l'article du journaliste
    toObservable(this.id)
      .pipe(
        switchMap((id) => this.articleService.obtenir(Number(id)).pipe(catchError(() => of(null)))),
        takeUntilDestroyed(),
      )
      .subscribe((a) => this.article.set(a));
  }

  // "Enregistrer les modifications" : PUT seulement (le statut ne change pas)
  protected enregistrer(donnees: ArticleRequest): void {
    this.envoyer(this.articleService.modifier(this.idArticle(), donnees));
  }

  // "Enregistrer et soumettre" : PUT, PUIS soumission au responsable éditorial
  protected enregistrerEtSoumettre(donnees: ArticleRequest): void {
    this.envoyer(
      this.articleService.modifier(this.idArticle(), donnees).pipe(switchMap((a) => this.articleService.soumettre(a.id))),
    );
  }

  // "Enregistrer et publier" : PUT, PUIS publication
  protected enregistrerEtPublier(donnees: ArticleRequest): void {
    this.envoyer(
      this.articleService.modifier(this.idArticle(), donnees).pipe(switchMap((a) => this.articleService.publier(a.id))),
    );
  }

  private idArticle(): number {
    return this.article()!.id;
  }

  // Après succès : retour à "Mes articles"
  private envoyer(requete: Observable<Article>): void {
    this.enCours.set(true);
    this.erreur.set(null);
    requete.subscribe({
      next: () => this.router.navigateByUrl(this.retourMesArticles),
      error: (e: HttpErrorResponse) => {
        this.erreur.set((e.error as ApiError | null)?.message ?? 'Enregistrement impossible.');
        this.enCours.set(false);
      },
    });
  }
}
