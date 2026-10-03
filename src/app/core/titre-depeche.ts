import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

const NOM_DU_SITE = 'Dépêche 226';

// Titre de l'onglet : "<title de la route> – Dépêche 226" (ou juste "Dépêche 226" si la route n'en a pas)
@Injectable({ providedIn: 'root' })
export class TitreDepeche extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(etat: RouterStateSnapshot): void {
    const titre = this.buildTitle(etat); // le "title:" de la route ouverte
    this.title.setTitle(titre ? `${titre} – ${NOM_DU_SITE}` : NOM_DU_SITE);
  }
}
