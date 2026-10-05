import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

import { CategorieService } from '../../../../core/api/categorie.service';
import { ParametreService } from '../../../../core/api/parametre.service';
import { ParametreSite, RESEAUX_SOCIAUX } from '../../../../core/models/parametre-site.model';
import { IconeReseau } from '../../../../shared/ui/icone-reseau/icone-reseau';

// Valeurs de secours : affichées pendant le chargement, ou si le backend ne répond pas
const PARAMETRES_PAR_DEFAUT: ParametreSite = {
  nomSite: 'Dépêche 226',
  slogan: "Le Burkina Faso raconté par ses journalistes. Information vérifiée, terrain d'abord.",
  emailContact: null,
  telephone: null,
  adresse: null,
  ville: null,
  mentionEdition: null,
};

// Pied de page du site public : logo, navigation, rubriques, contact
@Component({
  selector: 'app-footer',
  imports: [RouterLink, IconeReseau],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  // Les réseaux renseignés par le webmaster (Paramètres du site) : un logo cliquable chacun
  protected readonly reseaux = RESEAUX_SOCIAUX;

  protected lien(champ: keyof ParametreSite): string | null {
    return (this.parametres()[champ] as string | null | undefined) ?? null;
  }

  // GET /api/parametres (public) : modifiés par le webmaster
  protected readonly parametres = toSignal(
    inject(ParametreService).obtenir().pipe(catchError(() => of(PARAMETRES_PAR_DEFAUT))),
    { initialValue: PARAMETRES_PAR_DEFAUT },
  );

  // GET /api/categories (public) : gérées par le responsable éditorial
  protected readonly rubriques = toSignal(inject(CategorieService).lister().pipe(catchError(() => of([]))), {
    initialValue: [],
  });

  // Année en cours pour le copyright
  protected readonly annee = new Date().getFullYear();

  // Lien "Newsletter" : fait défiler jusqu'à la carte newsletter (dans public-layout.html)
  protected allerANewsletter(): void {
    document.getElementById('newsletter')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
