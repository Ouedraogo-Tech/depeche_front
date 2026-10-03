import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { ArticleService } from '../../../core/api/article.service';
import { CategorieService } from '../../../core/api/categorie.service';
import { ParametreService } from '../../../core/api/parametre.service';

// Les engagements de la rédaction (texte éditorial : il change rarement, il reste dans le code)
const VALEURS = [
  { titre: 'Vérifier avant de publier', texte: "Chaque article est relu par un responsable éditorial avant sa mise en ligne." },
  { titre: "Le terrain d'abord", texte: 'Nos journalistes racontent le Burkina Faso depuis les régions, au plus près des faits.' },
  { titre: 'Indépendance', texte: "Nous ne publions pas de contenu sponsorisé déguisé en information." },
  { titre: 'Ouverture au débat', texte: 'Les lecteurs peuvent réagir sous chaque article, dans le respect de chacun.' },
];

// Page "À propos" : /a-propos
@Component({
  selector: 'app-a-propos',
  imports: [RouterLink],
  templateUrl: './a-propos.html',
  styleUrl: './a-propos.css',
})
export class APropos {
  protected readonly valeurs = VALEURS;

  // Contact : les Paramètres du site (modifiés par le webmaster) · null si indisponibles
  protected readonly parametres = toSignal(inject(ParametreService).obtenir().pipe(catchError(() => of(null))), {
    initialValue: null,
  });

  // Quelques chiffres réels (null pendant le chargement)
  protected readonly nbArticles = toSignal(
    inject(ArticleService).listerPublies().pipe(map((liste) => liste.length), catchError(() => of(null))),
    { initialValue: null },
  );
  protected readonly nbRubriques = toSignal(
    inject(CategorieService).lister().pipe(map((liste) => liste.length), catchError(() => of(null))),
    { initialValue: null },
  );
}
