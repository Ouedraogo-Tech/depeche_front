import { DatePipe, UpperCasePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, linkedSignal, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';

import { ArticleService } from '../../../core/api/article.service';
import { CommentaireService } from '../../../core/api/commentaire.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiError } from '../../../core/models/api-error.model';
import { ArticleCard } from '../../../shared/article/article-card/article-card';
import { miniatureYoutube } from '../../../shared/article/youtube';
import { TempsLecturePipe } from '../../../shared/pipes/temps-lecture.pipe';

// Page d'un article : /articles/aes-france-diaspora-… (+ commentaires + articles similaires de la même catégorie)
// L'adresse ne montre plus le numéro de l'article ; un ancien lien /articles/7 est redirigé vers l'adresse lisible.
@Component({
  selector: 'app-article-detail',
  imports: [RouterLink, DatePipe, UpperCasePipe, TempsLecturePipe, ArticleCard],
  templateUrl: './article-detail.html',
  styleUrl: './article-detail.css',
})
export class ArticleDetail {
  private readonly articleService = inject(ArticleService);
  private readonly commentaireService = inject(CommentaireService);
  private readonly authService = inject(AuthService);

  private readonly router = inject(Router);

  // Le ":lien" de l'adresse /articles/:lien arrive ici tout seul (withComponentInputBinding)
  lien = input.required<string>();

  // undefined = chargement · null = article introuvable (ou non publié) · sinon l'article
  protected readonly article = toSignal(
    toObservable(this.lien).pipe(
      switchMap((lien) => this.articleService.obtenirPublie(lien).pipe(catchError(() => of(null)))),
    ),
    { initialValue: undefined },
  );

  // Miniature de la vidéo YouTube de l'article (null s'il n'en a pas)
  protected readonly miniatureVideo = computed(() => miniatureYoutube(this.article()?.lienVideo));

  // Les commentaires publiés (du plus récent au plus ancien) tels que renvoyés par le backend…
  private readonly commentairesServeur = toSignal(
    toObservable(this.article).pipe(
      switchMap((a) => (a ? this.commentaireService.listerParArticle(a.id).pipe(catchError(() => of([]))) : of([]))),
    ),
    { initialValue: [] },
  );
  // …+ ceux qu'on vient d'écrire (linkedSignal : suit le backend, mais reste modifiable)
  protected readonly commentaires = linkedSignal(() => this.commentairesServeur());

  // ===== Écrire un commentaire =====
  protected readonly estConnecte = this.authService.estConnecte;
  protected readonly estLecteur = computed(() => this.authService.utilisateur()?.roles.includes('LECTEUR') ?? false);
  protected readonly texteCommentaire = signal('');
  protected readonly envoiEnCours = signal(false);
  protected readonly erreurCommentaire = signal<string | null>(null);

  // L'adresse de cette page, pour y revenir après la connexion
  protected readonly adresseArticle = computed(() => `/articles/${this.article()?.slug || this.lien()}`);

  protected commenter(): void {
    const contenu = this.texteCommentaire().trim();
    if (!contenu) {
      this.erreurCommentaire.set('Écrivez votre commentaire avant de publier.');
      return;
    }
    this.envoiEnCours.set(true);
    this.erreurCommentaire.set(null);

    const article = this.article();
    if (!article) {
      return;
    }
    // POST /api/commentaires?articleId=7 : publié tout de suite
    this.commentaireService.ecrire(article.id, { contenu }).subscribe({
      next: (nouveau) => {
        this.commentaires.update((liste) => [nouveau, ...liste]); // en haut de la liste
        this.texteCommentaire.set('');
        this.envoiEnCours.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.erreurCommentaire.set((e.error as ApiError | null)?.message ?? 'Publication impossible, réessayez.');
        this.envoiEnCours.set(false);
      },
    });
  }

  constructor() {
    // Titre de l'onglet = titre de l'article (ex. : "Football – Dépêche 226")
    const title = inject(Title);
    effect(() => {
      const a = this.article();
      if (a) {
        title.setTitle(`${a.titre} – Dépêche 226`);
        // Ancien lien avec le numéro (/articles/7, notification, commentaire) : on affiche l'adresse lisible.
        // Seulement quand l'adresse est un NUMÉRO et que c'est bien CET article qui est chargé : sinon, en cliquant
        // sur un article similaire, l'ancien article encore affiché renverrait vers lui-même.
        const lien = this.lien();
        if (a.slug && /^\d+$/.test(lien) && a.id === Number(lien)) {
          this.router.navigate(['/articles', a.slug], { replaceUrl: true });
        }
      } else if (a === null) {
        title.setTitle('Article introuvable – Dépêche 226');
      }
    });
  }

  // Les articles publiés de la MÊME catégorie, sans l'article en cours de lecture
  private readonly similaires = toSignal(
    toObservable(this.article).pipe(
      switchMap((article) =>
        article
          ? this.articleService.listerPublies(article.categorieId).pipe(
              map((liste) => liste.filter((a) => a.id !== article.id)),
              catchError(() => of([])),
            )
          : of([]),
      ),
    ),
    { initialValue: [] },
  );

  // 2 grandes cartes à droite, puis jusqu'à 6 cartes sous l'article
  protected readonly similairesACote = computed(() => this.similaires().slice(0, 2));
  protected readonly similairesEnBas = computed(() => this.similaires().slice(2, 8));
}
