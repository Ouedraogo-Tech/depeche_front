import { DatePipe, UpperCasePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

import { ArticleService } from '../../../core/api/article.service';
import { StatutArticle } from '../../../core/models/article.model';
import { Panel } from '../../../shared/ui/panel/panel';
import { StatCard } from '../../../shared/ui/stat-card/stat-card';
import { Spinner } from '../../../shared/ui/spinner/spinner';

const UN_JOUR = 24 * 60 * 60 * 1000; // en millisecondes

// Tableau de bord du responsable éditorial : /editorial/tableau-de-bord
@Component({
  selector: 'app-dashboard-editorial',
  imports: [DatePipe, UpperCasePipe, RouterLink, Panel, StatCard, Spinner],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardEditorial {
  private readonly articleService = inject(ArticleService);

  protected readonly aujourdhui = new Date();

  // Tous les articles de la rédaction (GET /api/articles : permission ARTICLE_VALIDER)
  // undefined = chargement
  private readonly articles = toSignal(this.articleService.lister().pipe(catchError(() => of([]))), {
    initialValue: undefined,
  });

  // ===== Les 4 cartes =====
  protected readonly nbEnAttente = computed(() => this.compter('SOUMIS'));
  protected readonly nbAReviser = computed(() => this.compter('A_REVISER'));
  protected readonly nbPublies = computed(() => this.compter('PUBLIE'));
  protected readonly nbRefuses = computed(() => this.compter('REFUSE'));

  protected readonly nbPubliesCeMois = computed(() => {
    const maintenant = new Date();
    return (this.articles() ?? []).filter((a) => {
      if (a.statut !== 'PUBLIE' || !a.datePublication) {
        return false;
      }
      const date = new Date(a.datePublication);
      return date.getMonth() === maintenant.getMonth() && date.getFullYear() === maintenant.getFullYear();
    }).length;
  });

  // ===== À valider : du plus ANCIEN au plus récent (premier arrivé, premier traité) =====
  protected readonly aValider = computed(() =>
    (this.articles() ?? [])
      .filter((a) => a.statut === 'SOUMIS')
      .sort((x, y) => x.dateCreation.localeCompare(y.dateCreation))
      .map((a) => ({ ...a, joursAttente: Math.floor((Date.now() - new Date(a.dateCreation).getTime()) / UN_JOUR) })),
  );

  // ===== Les 5 dernières publications =====
  protected readonly dernieresPublications = computed(() =>
    (this.articles() ?? [])
      .filter((a) => a.statut === 'PUBLIE' && a.datePublication)
      .sort((x, y) => y.datePublication!.localeCompare(x.datePublication!))
      .slice(0, 5),
  );

  protected readonly chargement = computed(() => this.articles() === undefined);

  private compter(statut: StatutArticle): number {
    return (this.articles() ?? []).filter((a) => a.statut === statut).length;
  }
}
