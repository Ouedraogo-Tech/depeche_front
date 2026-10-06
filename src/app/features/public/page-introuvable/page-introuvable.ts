import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

// Page 404 : affichée pour toute adresse qui ne correspond à aucune route
@Component({
  selector: 'app-page-introuvable',
  templateUrl: './page-introuvable.html',
  styleUrl: './page-introuvable.css',
})
export class PageIntrouvable {
  // L'adresse demandée (ex. : "/nimporte-quoi"), affichée pour que le visiteur comprenne
  protected readonly adresse = inject(Router).url;
}
