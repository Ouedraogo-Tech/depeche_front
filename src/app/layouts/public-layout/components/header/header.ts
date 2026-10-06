import { Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, skip } from 'rxjs';

import { CategorieService } from '../../../../core/api/categorie.service';
import { ParametreService } from '../../../../core/api/parametre.service';
import { AuthService } from '../../../../core/auth/auth.service';

// Barre du haut du site public : logo, menu (avec les rubriques), recherche, connexion
@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
  host: {
    '(document:click)': 'fermerActualitesSiDehors($event)',
    '(document:keydown.escape)': 'actualitesOuvert.set(false)',
  },
})
export class Header {
  private readonly router = inject(Router);
    protected readonly authService = inject(AuthService);
  protected readonly utilisateur = this.authService.utilisateur; // null = visiteur

  protected readonly menuOuvert = signal(false);

  // Logo choisi par le webmaster (Paramètres), sinon le logo d'origine
  protected readonly logos = inject(ParametreService).logos;

  // Menu déroulant "Actualités ▾" : un clic l'ouvre, un 2e clic le referme
  protected readonly actualitesOuvert = signal(false);
  private readonly menuActualites = viewChild<ElementRef<HTMLElement>>('menuActualites');

  // Les rubriques du menu "Actualités" (GET /api/categories, public)
  protected readonly rubriques = toSignal(inject(CategorieService).lister().pipe(catchError(() => of([]))), {
    initialValue: [],
  });

  // ===== Recherche =====
  protected readonly rechercheOuverte = signal(false);

  // Ce qui est tapé dans le champ, lettre par lettre
  protected readonly saisie = signal('');

  // Le champ de recherche (n'existe que quand la barre est ouverte)
  private readonly champRecherche = viewChild<ElementRef<HTMLInputElement>>('champRecherche');

  constructor() {
    // Dès que la barre s'ouvre, le curseur se place dans le champ : on peut taper tout de suite
    effect(() => this.champRecherche()?.nativeElement.focus());

    // Recherche EN DIRECT : 300 ms après la dernière lettre tapée, la page suit le champ
    toObservable(this.saisie)
      .pipe(
        skip(1), // on ignore la valeur de départ ("")
        map((texte) => texte.trim()),
        debounceTime(300), // on attend que la personne arrête de taper
        distinctUntilChanged(), // "sport" puis "sport " : même recherche → pas de nouvel appel
        takeUntilDestroyed(),
      )
      .subscribe((mot) => this.allerAuxResultats(mot));
  }

  // Un clic ailleurs sur la page referme le menu "Actualités"
  protected fermerActualitesSiDehors(evenement: MouseEvent): void {
    if (!this.menuActualites()?.nativeElement.contains(evenement.target as Node)) {
      this.actualitesOuvert.set(false);
    }
  }

  protected basculerRecherche(): void {
    this.rechercheOuverte.update((ouverte) => !ouverte);
    this.menuOuvert.set(false);
  }

  // Touche Entrée ou bouton "Rechercher" : tout de suite, sans attendre les 300 ms
  protected rechercher(): void {
    this.allerAuxResultats(this.saisie().trim());
  }

  // Un mot → l'accueil filtré (?recherche=mot) · champ vide → retour à l'accueil normal
  private allerAuxResultats(mot: string): void {
    if (mot) {
      // replaceUrl : chaque lettre ne crée pas une page dans l'historique (le bouton Retour reste utile)
      this.router.navigate(['/'], { queryParams: { recherche: mot }, replaceUrl: true });
    } else if (this.router.url.includes('recherche=')) {
      this.router.navigate(['/'], { replaceUrl: true });
    }
  }
}
