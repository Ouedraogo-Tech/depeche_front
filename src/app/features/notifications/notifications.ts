import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { NotificationService } from '../../core/api/notification.service';
import { NotificationUtilisateur, TypeNotification } from '../../core/models/notification.model';
import { Spinner } from '../../shared/ui/spinner/spinner';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';

// Icône et couleur de chaque type de notification
const STYLES: Record<TypeNotification, { icone: string; classes: string }> = {
  ARTICLE_VALIDE: { icone: '✓', classes: 'border-amber-300 bg-amber-50' },
  ARTICLE_PUBLIE: { icone: '✓', classes: 'border-amber-300 bg-amber-50' },
  ARTICLE_A_REVISER: { icone: '⚠', classes: 'border-red-200 bg-red-50' },
  ARTICLE_REFUSE: { icone: '⚠', classes: 'border-red-200 bg-red-50' },
  ARTICLE_SOUMIS: { icone: '📝', classes: 'border-blue-200 bg-blue-50' },
  NOUVEAU_COMMENTAIRE: { icone: '💬', classes: 'border-ligne bg-white' },
};

// "Notifications" : /journaliste/notifications et /editorial/notifications (GET /api/notifications)
@Component({
  selector: 'app-notifications',
  imports: [DatePipe, Spinner, EmptyState],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class Notifications {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  // "/journaliste" ou "/editorial" : l'espace où la page est ouverte
  private readonly espace = '/' + this.router.url.split('/')[1];

  protected readonly styles = STYLES;

  // undefined = chargement
  protected readonly notifications = signal<NotificationUtilisateur[] | undefined>(undefined);
  protected readonly seulementNonLues = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected readonly nbNonLues = computed(() => (this.notifications() ?? []).filter((n) => !n.lue).length);
  protected readonly lignes = computed(() =>
    (this.notifications() ?? []).filter((n) => !this.seulementNonLues() || !n.lue),
  );

  constructor() {
    this.notificationService.lister().subscribe({
      next: (liste) => {
        this.notifications.set(liste);
        this.notificationService.rafraichirNonLues(); // le badge de la barre latérale suit
      },
      error: () => {
        this.notifications.set([]);
        this.erreur.set('Impossible de charger vos notifications.');
      },
    });
  }

  // Clic : la notification passe en "lue", puis on ouvre la page concernée
  protected ouvrir(n: NotificationUtilisateur): void {
    if (!n.lue) {
      this.notificationService.marquerLue(n.id).subscribe((maj) =>
        this.notifications.update((liste) => liste?.map((x) => (x.id === maj.id ? maj : x))),
      );
    }
    const lien = this.lien(n);
    if (lien) {
      this.router.navigateByUrl(lien);
    }
  }

  // PATCH /lire-tout
  protected toutMarquerLu(): void {
    this.notificationService.toutMarquerLu().subscribe({
      next: () => this.notifications.update((liste) => liste?.map((n) => ({ ...n, lue: true }))),
      error: () => this.erreur.set('Action impossible, réessayez.'),
    });
  }

  // Où mène chaque notification
  private lien(n: NotificationUtilisateur): string | null {
    switch (n.type) {
      case 'ARTICLE_SOUMIS': // responsable éditorial : ouvrir l'article dans la file de validation
        return n.articleId ? `/editorial/validation?article=${n.articleId}` : '/editorial/validation';
      case 'ARTICLE_VALIDE':
      case 'ARTICLE_PUBLIE': // l'article est en ligne : on l'ouvre sur le site
        return n.articleId ? `/articles/${n.articleId}` : null;
      case 'NOUVEAU_COMMENTAIRE':
        return '/journaliste/commentaires';
      default: // à réviser, refusé : retour à "Mes articles"
        return `${this.espace}/mes-articles`;
    }
  }
}
