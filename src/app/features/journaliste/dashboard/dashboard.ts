import { DatePipe, UpperCasePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { ArticleService } from '../../../core/api/article.service';
import { NotificationService } from '../../../core/api/notification.service';
import { ApiError } from '../../../core/models/api-error.model';
import { Article, StatutArticle } from '../../../core/models/article.model';
import { NotificationUtilisateur, TypeNotification } from '../../../core/models/notification.model';
import { Panel } from '../../../shared/ui/panel/panel';
import { StatCard } from '../../../shared/ui/stat-card/stat-card';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { NouvelArticle } from '../nouvel-article/nouvel-article';

// Couleur et icône de chaque type de notification (maquette : jaune = validé, rouge = à revoir)
const STYLES_NOTIFICATION: Record<TypeNotification, { icone: string; classes: string }> = {
  ARTICLE_VALIDE: { icone: '✓', classes: 'border-amber-300 bg-amber-50 text-amber-900' },
  ARTICLE_PUBLIE: { icone: '✓', classes: 'border-amber-300 bg-amber-50 text-amber-900' },
  ARTICLE_A_REVISER: { icone: '⚠', classes: 'border-red-200 bg-red-50 text-red-800' },
  ARTICLE_REFUSE: { icone: '⚠', classes: 'border-red-200 bg-red-50 text-red-800' },
  ARTICLE_SOUMIS: { icone: '•', classes: 'border-ligne bg-white text-marine' },
  NOUVEAU_COMMENTAIRE: { icone: '💬', classes: 'border-ligne bg-white text-marine' },
  NOUVELLE_CATEGORIE: { icone: '🏷', classes: 'border-green-200 bg-green-50 text-green-900' },
};

// Tableau de bord du journaliste (maquette "Espace Journaliste")
@Component({
  selector: 'app-dashboard-journaliste',
  imports: [DatePipe, UpperCasePipe, RouterLink, Panel, StatCard, StatusBadge, NouvelArticle],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardJournaliste {
  private readonly articleService = inject(ArticleService);
  private readonly notificationService = inject(NotificationService);

  protected readonly aujourdhui = new Date();
  protected readonly stylesNotification = STYLES_NOTIFICATION;

  // Données du backend
  protected readonly mesArticles = signal<Article[]>([]); // GET /api/articles/moi
  protected readonly notifications = signal<NotificationUtilisateur[]>([]); // GET /api/notifications
  protected readonly erreurAction = signal<string | null>(null);

  // Les 4 cartes : calculées à partir de MES articles et de MES notifications
  protected readonly nbPublies = computed(() => this.compter('PUBLIE'));
  protected readonly nbBrouillons = computed(() => this.compter('BROUILLON'));
  protected readonly nbEnAttente = computed(() => this.compter('SOUMIS'));
  protected readonly nbNonLues = computed(() => this.notifications().filter((n) => !n.lue).length);

  // "+3 ce mois-ci" : articles publiés pendant le mois en cours
  protected readonly nbPubliesCeMois = computed(() => {
    const maintenant = new Date();
    return this.mesArticles().filter((a) => {
      if (a.statut !== 'PUBLIE' || !a.datePublication) {
        return false;
      }
      const date = new Date(a.datePublication);
      return date.getMonth() === maintenant.getMonth() && date.getFullYear() === maintenant.getFullYear();
    }).length;
  });

  // La maquette n'affiche que les 3 dernières notifications
  protected readonly notificationsRecentes = computed(() => this.notifications().slice(0, 3));

  constructor() {
    this.chargerArticles();
    this.chargerNotifications();
  }

  // Appelée au démarrage ET quand le formulaire prévient qu'un article a été enregistré
  protected chargerArticles(): void {
    this.articleService.mesArticles().subscribe((liste) => this.mesArticles.set(liste));
  }

  private chargerNotifications(): void {
    this.notificationService.lister().subscribe((liste) => this.notifications.set(liste));
  }

  // Clic sur une notification : elle passe en "lue"
  protected marquerLue(notification: NotificationUtilisateur): void {
    if (notification.lue) {
      return;
    }
    this.notificationService.marquerLue(notification.id).subscribe((maj) =>
      this.notifications.update((liste) => liste.map((n) => (n.id === maj.id ? maj : n))),
    );
  }

    // Bouton "Soumettre" du tableau (brouillon ou article à réviser)
  protected soumettre(article: Article): void {
    this.changerStatut(this.articleService.soumettre(article.id), 'Soumission impossible.');
  }

  // Bouton "Publier" du tableau : l'article passe PUBLIÉ, visible sur le site
  protected publier(article: Article): void {
    this.changerStatut(this.articleService.publier(article.id), 'Publication impossible.');
  }

  // Logique commune : on remplace la ligne du tableau par la version renvoyée par le backend
  private changerStatut(requete: Observable<Article>, messageErreur: string): void {
    this.erreurAction.set(null);
    requete.subscribe({
      next: (maj) => this.mesArticles.update((liste) => liste.map((a) => (a.id === maj.id ? maj : a))),
      error: (e: HttpErrorResponse) =>
        this.erreurAction.set((e.error as ApiError | null)?.message ?? messageErreur),
    });
  }

  private compter(statut: StatutArticle): number {
    return this.mesArticles().filter((a) => a.statut === statut).length;
  }
}
