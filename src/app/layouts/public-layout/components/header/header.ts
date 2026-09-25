import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

// Barre du haut du site public : logo, menu, recherche, connexion
@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {}
