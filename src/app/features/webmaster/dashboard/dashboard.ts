import { DatePipe, UpperCasePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

import { CommentaireService } from '../../../core/api/commentaire.service';
import { ParametreService } from '../../../core/api/parametre.service';
import { StatistiqueService } from '../../../core/api/statistique.service';
import { Panel } from '../../../shared/ui/panel/panel';
import { StatCard } from '../../../shared/ui/stat-card/stat-card';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { Spinner } from '../../../shared/ui/spinner/spinner';

// Tableau de bord du webmaster : /webmaster/tableau-de-bord
@Component({
  selector: 'app-dashboard-webmaster',
  imports: [DatePipe, UpperCasePipe, RouterLink, Panel, StatCard, StatusBadge, Spinner],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardWebmaster {
  private readonly statistiqueService = inject(StatistiqueService);
  private readonly commentaireService = inject(CommentaireService);
  private readonly parametreService = inject(ParametreService);

  protected readonly aujourdhui = new Date();

  // GET /api/statistiques (STATISTIQUES_SUIVRE) · null = erreur
  protected readonly statistiques = toSignal(this.statistiqueService.obtenir().pipe(catchError(() => of(null))), {
    initialValue: undefined,
  });

  // GET /api/commentaires : TOUS les commentaires du site (COMMENTAIRE_MASQUER)
  private readonly commentaires = toSignal(this.commentaireService.lister().pipe(catchError(() => of([]))), {
    initialValue: undefined,
  });

  // GET /api/parametres : ce qui s'affiche dans le footer
  protected readonly parametres = toSignal(this.parametreService.obtenir().pipe(catchError(() => of(null))), {
    initialValue: undefined,
  });

  // Les 5 commentaires les plus récents
  protected readonly derniersCommentaires = computed(() =>
    [...(this.commentaires() ?? [])].sort((x, y) => y.dateCreation.localeCompare(x.dateCreation)).slice(0, 5),
  );

  protected readonly nbPublies = computed(() => this.statistiques()?.articlesParStatut['PUBLIE'] ?? 0);
}
