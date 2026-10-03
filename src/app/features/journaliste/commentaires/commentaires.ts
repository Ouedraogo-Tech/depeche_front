import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

import { CommentaireService } from '../../../core/api/commentaire.service';
import { Avatar } from '../../../shared/ui/avatar/avatar';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { Spinner } from '../../../shared/ui/spinner/spinner';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';

// "Commentaires" : ce que les lecteurs ont écrit sur MES articles (GET /api/commentaires/mes-articles)
@Component({
  selector: 'app-commentaires-journaliste',
  imports: [DatePipe, RouterLink, Avatar, StatusBadge, Spinner, EmptyState],
  templateUrl: './commentaires.html',
  styleUrl: './commentaires.css',
})
export class CommentairesJournaliste {
  private readonly commentaireService = inject(CommentaireService);

  // undefined = chargement · null = erreur
  protected readonly commentaires = toSignal(this.commentaireService.surMesArticles().pipe(catchError(() => of(null))), {
    initialValue: undefined,
  });

  protected readonly articleFiltre = signal(''); // '' = tous les articles

  // La liste des articles commentés (pour le filtre), avec leur nombre de commentaires
  protected readonly articlesCommentes = computed(() => {
    const compte = new Map<number, { titre: string; nombre: number }>();
    for (const c of this.commentaires() ?? []) {
      const ligne = compte.get(c.articleId) ?? { titre: c.articleTitre, nombre: 0 };
      ligne.nombre++;
      compte.set(c.articleId, ligne);
    }
    return [...compte.entries()].map(([id, v]) => ({ id, ...v }));
  });

  // Les commentaires affichés : filtrés par article, du plus récent au plus ancien
  protected readonly lignes = computed(() =>
    (this.commentaires() ?? [])
      .filter((c) => !this.articleFiltre() || c.articleId === Number(this.articleFiltre()))
      .sort((x, y) => y.dateCreation.localeCompare(x.dateCreation)),
  );

  // "Aminata Sawadogo" → prénom "Aminata", nom "Sawadogo" (pour les initiales de l'avatar)
  protected prenomDe(nomComplet: string): string {
    return nomComplet.split(' ')[0] ?? '';
  }

  protected nomDe(nomComplet: string): string {
    return nomComplet.split(' ').slice(1).join(' ');
  }
}
