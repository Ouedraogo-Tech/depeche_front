import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { Observable } from 'rxjs';

import { ArticleService } from '../../../core/api/article.service';
import { ApiError } from '../../../core/models/api-error.model';
import { Article } from '../../../core/models/article.model';
import { TempsLecturePipe } from '../../../shared/pipes/temps-lecture.pipe';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { Spinner } from '../../../shared/ui/spinner/spinner';
import { ToastService } from '../../../shared/ui/toast/toast.service';

type Decision = 'VALIDER' | 'MODIFIER' | 'REFUSER';

// Validation des articles soumis : /editorial/validation (ou ?article=12 pour en ouvrir un directement)
@Component({
  selector: 'app-validation',
  imports: [DatePipe, TempsLecturePipe, ConfirmDialog, Spinner],
  templateUrl: './validation.html',
  styleUrl: './validation.css',
})
export class Validation {
  private readonly articleService = inject(ArticleService);

  // Le "12" de ?article=12 (withComponentInputBinding lit aussi les paramètres après le "?")
  article = input<string>();

  // La file d'attente : articles SOUMIS, du plus ancien au plus récent. undefined = chargement
  protected readonly file = signal<Article[] | undefined>(undefined);

  // L'article ouvert : celui de l'adresse au départ, puis celui sur lequel on clique
  protected readonly selectionId = linkedSignal<number | null>(() => (this.article() ? Number(this.article()) : null));
  protected readonly selection = computed(() => this.file()?.find((a) => a.id === this.selectionId()) ?? null);

  protected readonly commentaire = signal('');
  protected readonly enCours = signal(false);
  protected readonly confirmerValidation = signal(false);
  protected readonly erreur = signal<string | null>(null);
  private readonly toast = inject(ToastService); // messages de succès en bas de l'écran

  constructor() {
    this.articleService.lister('SOUMIS').subscribe({
      next: (liste) => this.file.set([...liste].sort((x, y) => x.dateCreation.localeCompare(y.dateCreation))),
      error: () => {
        this.file.set([]);
        this.erreur.set('Impossible de charger les articles à valider.');
      },
    });
  }

  protected ouvrir(article: Article): void {
    this.selectionId.set(article.id);
    this.commentaire.set('');
    this.erreur.set(null);
  }

  protected fermer(): void {
    this.selectionId.set(null);
  }

  // Le journaliste a demandé une date de publication encore à venir ? (validé → planifié à cette date)
  protected dateAVenir(date: string | null | undefined): boolean {
    return !!date && new Date(date) > new Date();
  }

  // Les 3 boutons de décision
  protected decider(decision: Decision): void {
    const article = this.selection();
    if (!article) {
      return;
    }
    const commentaire = this.commentaire().trim();

    // Demander une modification / refuser : le journaliste doit savoir pourquoi
    if (decision !== 'VALIDER' && !commentaire) {
      this.erreur.set('Écrivez un commentaire pour expliquer votre décision au journaliste.');
      return;
    }
    // Valider = publier sur le site : on demande confirmation d'abord
    if (decision === 'VALIDER' && !this.confirmerValidation()) {
      this.confirmerValidation.set(true);
      return;
    }
    this.confirmerValidation.set(false);

    const corps = { commentaire: commentaire || undefined };
    const requetes: Record<Decision, Observable<Article>> = {
      VALIDER: this.articleService.valider(article.id, corps),
      MODIFIER: this.articleService.demanderModification(article.id, corps),
      REFUSER: this.articleService.refuser(article.id, corps),
    };
    const messages: Record<Decision, string> = {
      VALIDER: 'validé et publié',
      MODIFIER: 'renvoyé au journaliste pour modification',
      REFUSER: 'refusé',
    };

    this.enCours.set(true);
    this.erreur.set(null);
    requetes[decision].subscribe({
      next: () => {
        // On retire l'article de la file et on ouvre le suivant
        const restants = (this.file() ?? []).filter((a) => a.id !== article.id);
        this.file.set(restants);
        this.selectionId.set(restants[0]?.id ?? null);
        this.commentaire.set('');
        this.toast.succes(`« ${article.titre} » : ${messages[decision]}.`);
        this.enCours.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.erreur.set((e.error as ApiError | null)?.message ?? 'Décision impossible.');
        this.enCours.set(false);
      },
    });
  }
}
