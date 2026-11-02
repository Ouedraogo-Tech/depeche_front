import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';

import { ArticleService } from '../../../core/api/article.service';
import { CategorieService } from '../../../core/api/categorie.service';
import { ParametreService } from '../../../core/api/parametre.service';
import { APropos as ContenuAPropos } from '../../../core/models/a-propos.model';

// Page "À propos" : /a-propos
// Le texte de présentation, l'année de création et les engagements sont rédigés par le webmaster
@Component({
  selector: 'app-a-propos',
  imports: [],
  templateUrl: './a-propos.html',
  styleUrl: './a-propos.css',
})
export class APropos {
  private readonly parametreService = inject(ParametreService);

  // Contact : les Paramètres du site (modifiés par le webmaster) · null si indisponibles
  protected readonly parametres = toSignal(this.parametreService.obtenir().pipe(catchError(() => of(null))), {
    initialValue: null,
  });

  // Contenu de la page (undefined = chargement · null = indisponible)
  protected readonly contenu = toSignal<ContenuAPropos | null | undefined>(
    this.parametreService.obtenirAPropos().pipe(catchError(() => of(null))),
    { initialValue: undefined },
  );

  // Le texte de présentation découpé en paragraphes (une ligne vide = nouveau paragraphe)
  protected readonly paragraphes = computed(() =>
    (this.contenu()?.texte ?? '')
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p),
  );

  protected readonly engagements = computed(() => this.contenu()?.engagements ?? []);

  // Quelques chiffres réels (null pendant le chargement)
  protected readonly nbArticles = toSignal(
    inject(ArticleService).listerPublies().pipe(map((liste) => liste.length), catchError(() => of(null))),
    { initialValue: null },
  );
  protected readonly nbRubriques = toSignal(
    inject(CategorieService).lister().pipe(map((liste) => liste.length), catchError(() => of(null))),
    { initialValue: null },
  );

  // Le bandeau des chiffres (valeur null = « — » pendant le chargement).
  // L'année de création n'apparaît que si le webmaster l'a renseignée.
  protected readonly chiffres = computed<{ valeur: number | null; libelle: string }[]>(() => {
    const annee = this.contenu()?.anneeCreation;
    return [
      ...(annee ? [{ valeur: annee, libelle: 'Année de création' }] : []),
      { valeur: this.nbArticles(), libelle: 'Articles publiés' },
      { valeur: this.nbRubriques(), libelle: 'Rubriques' },
    ];
  });
}
