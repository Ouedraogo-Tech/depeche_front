import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { ArticleService } from '../../../../core/api/article.service';

// Bandeau rouge "FLASH INFO" sous le header :
// les 5 derniers articles publiés passent UN PAR UN (1 → 2 → … → 5 → 1 → …)
@Component({
  selector: 'app-flash-bar',
  imports: [RouterLink],
  templateUrl: './flash-bar.html',
  styleUrl: './flash-bar.css',
})
export class FlashBar {
  // GET /api/articles/publies (public, du plus récent au plus ancien) → on garde les 5 premiers
  protected readonly titres = toSignal(
    inject(ArticleService)
      .listerPublies()
      .pipe(
        map((articles) => articles.slice(0, 5).map((a) => ({ id: a.id, titre: a.titre }))),
        catchError(() => of([])),
      ),
    { initialValue: [] },
  );

  // Nombre de passages depuis l'ouverture de la page : 0, 1, 2, 3…
  protected readonly passage = signal(0);

  // Le titre à afficher : passage 0 → titre 1, … passage 4 → titre 5, passage 5 → titre 1 à nouveau
  protected readonly titreCourant = computed(() => {
    const liste = this.titres();
    return liste.length > 0 ? liste[this.passage() % liste.length] : null;
  });

  // Durée de la traversée : plus le titre est long, plus il met de temps (vitesse de lecture constante)
  protected readonly duree = computed(() => `${8 + (this.titreCourant()?.titre.length ?? 0) * 0.12}s`);

  // Appelée quand le titre est sorti à gauche (fin de l'animation CSS) : on passe au suivant
  protected suivant(): void {
    this.passage.update((n) => n + 1);
  }
}
