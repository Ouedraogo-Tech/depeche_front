import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

import { ArticleService } from '../../../core/api/article.service';
import { StatutArticle } from '../../../core/models/article.model';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { Spinner } from '../../../shared/ui/spinner/spinner';

// Pour chercher sans tenir compte des majuscules ni des accents : "Économie" → "economie"
const normaliser = (texte: string) => texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Historique V1 : tous les articles, du plus récent au plus ancien, avec recherche et filtres
@Component({
  selector: 'app-admin-historique',
  imports: [DatePipe, StatusBadge, Spinner],
  templateUrl: './historique.html',
  styleUrl: './historique.css',
})
export class AdminHistorique {
  private readonly articleService = inject(ArticleService);

  private readonly articles = toSignal(this.articleService.lister().pipe(catchError(() => of([]))), {
    initialValue: undefined,
  });

  protected readonly statuts: StatutArticle[] = ['PUBLIE', 'SOUMIS', 'BROUILLON', 'A_REVISER', 'REFUSE', 'PLANIFIE', 'ARCHIVE'];

  // ===== Les filtres (un signal par champ de la barre de recherche) =====
  protected readonly recherche = signal('');
  protected readonly categorieFiltre = signal(''); // '' = toutes
  protected readonly statutFiltre = signal<StatutArticle | 'TOUS'>('TOUS');
  protected readonly dateDebut = signal(''); // format "2026-09-01" (champ date)
  protected readonly dateFin = signal('');

  // Les catégories proposées = celles des articles existants, par ordre alphabétique
  protected readonly categories = computed(() =>
    [...new Set((this.articles() ?? []).map((a) => a.categorieNom))].sort((x, y) => x.localeCompare(y)),
  );

  protected readonly filtresActifs = computed(
    () => !!(this.recherche() || this.categorieFiltre() || this.statutFiltre() !== 'TOUS' || this.dateDebut() || this.dateFin()),
  );

  // Date de référence = date de publication, sinon date de création ; tri du plus récent au plus ancien
  protected readonly lignes = computed(() => {
    const liste = this.articles();
    if (!liste) {
      return undefined;
    }
    const texte = normaliser(this.recherche().trim());
    const debut = this.dateDebut();
    const fin = this.dateFin();

    return liste
      .map((a) => ({ ...a, dateReference: a.datePublication ?? a.dateCreation }))
      .filter((a) => !texte || normaliser(`${a.titre} ${a.auteurNomComplet}`).includes(texte))
      .filter((a) => !this.categorieFiltre() || a.categorieNom === this.categorieFiltre())
      .filter((a) => this.statutFiltre() === 'TOUS' || a.statut === this.statutFiltre())
      // "2026-09-15T10:30:00".slice(0, 10) = "2026-09-15" : se compare directement au champ date
      .filter((a) => !debut || a.dateReference.slice(0, 10) >= debut)
      .filter((a) => !fin || a.dateReference.slice(0, 10) <= fin)
      .sort((x, y) => y.dateReference.localeCompare(x.dateReference));
  });

  protected effacerFiltres(): void {
    this.recherche.set('');
    this.categorieFiltre.set('');
    this.statutFiltre.set('TOUS');
    this.dateDebut.set('');
    this.dateFin.set('');
  }
}
