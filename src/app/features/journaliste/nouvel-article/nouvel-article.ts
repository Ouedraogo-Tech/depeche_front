import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, output, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, switchMap, tap } from 'rxjs';

import { ArticleService } from '../../../core/api/article.service';
import { CategorieService } from '../../../core/api/categorie.service';
import { ApiError } from '../../../core/models/api-error.model';
import { Article, ArticleRequest } from '../../../core/models/article.model';
import { ArticleForm, SoumissionArticle } from '../../../shared/article/article-form/article-form';
import { Panel } from '../../../shared/ui/panel/panel';
import { ToastService } from '../../../shared/ui/toast/toast.service';

// Page "Nouvel article" du journaliste : brouillon ou soumission au responsable éditorial.
// Utilisée seule (menu "Nouvel article") ET dans le dashboard du journaliste.
@Component({
  selector: 'app-nouvel-article',
  imports: [Panel, ArticleForm],
  templateUrl: './nouvel-article.html',
  styleUrl: './nouvel-article.css',
})
export class NouvelArticle {
  private readonly articleService = inject(ArticleService);
  private readonly categorieService = inject(CategorieService);

  // AJOUT : false quand la page est affichée dans le dashboard (on cache son titre)
  avecTitre = input(true, { transform: (v: boolean | undefined) => v ?? true });
    // false pour le responsable éditorial : il n'a pas la permission ARTICLE_SOUMETTRE (il publie directement)
  boutonSoumettre = input(true, { transform: (v: boolean | undefined) => v ?? true });
  // AJOUT : prévient le parent (le dashboard) qu'un article vient d'être enregistré
  enregistre = output<void>();

  // Les catégories pour la liste déroulante (GET /api/categories)
  protected readonly categories = toSignal(this.categorieService.lister(), { initialValue: [] });

  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  private readonly toast = inject(ToastService); // messages de succès en bas de l'écran

  // Accès au formulaire enfant, pour le vider après un envoi réussi
  private readonly formulaire = viewChild.required(ArticleForm);

  // "Enregistrer comme brouillon" : POST /api/articles (statut BROUILLON)
  protected enregistrerBrouillon(article: ArticleRequest): void {
    this.envoyer(this.articleService.creer(article), 'Brouillon enregistré.');
  }

  // "Soumettre pour validation" : on crée l'article, PUIS on le soumet (avec la date souhaitée, facultative)
  protected soumettre({ article, dateSouhaitee }: SoumissionArticle): void {
    const creerPuisSoumettre = this.articleService
      .creer(article)
      .pipe(
        tap(() => (this.brouillonCree = true)),
        switchMap((cree) => this.articleService.soumettre(cree.id, dateSouhaitee)),
      );
    this.envoyer(creerPuisSoumettre, 'Article soumis au responsable éditorial.');
  }


    // "Publier l'article" : on crée l'article, PUIS on le publie (visible tout de suite sur le site)
  protected publier(article: ArticleRequest): void {
    const creerPuisPublier = this.articleService
      .creer(article)
      .pipe(
        tap(() => (this.brouillonCree = true)),
        switchMap((cree) => this.articleService.publier(cree.id)),
      );
    this.envoyer(creerPuisPublier, 'Article publié sur le site.');
  }

  // true dès que l'étape 1 (création du brouillon) a réussi
  private brouillonCree = false;

  private envoyer(requete: Observable<Article>, messageSucces: string): void {
    this.enCours.set(true);
    this.erreur.set(null);
    this.brouillonCree = false;
    requete.subscribe({
      next: () => {
        this.toast.succes(messageSucces);
        this.formulaire().vider();
        this.enregistre.emit(); // AJOUT : le dashboard rafraîchit "Mes articles"
        this.enCours.set(false);
      },
      error: (e: HttpErrorResponse) => {
        const message = (e.error as ApiError | null)?.message ?? 'Enregistrement impossible.';
        if (this.brouillonCree) {
          // Le brouillon existe déjà : on vide le formulaire pour qu'un 2e clic ne crée pas un DOUBLON
          this.formulaire().vider();
          this.enregistre.emit();
          this.erreur.set(`L'article a été enregistré comme brouillon (retrouvez-le dans « Mes articles »), mais l'étape suivante a échoué : ${message}`);
        } else {
          this.erreur.set(message);
        }
        this.enCours.set(false);
      },
    });
  }
}
