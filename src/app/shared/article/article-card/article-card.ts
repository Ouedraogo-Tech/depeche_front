import { DatePipe, SlicePipe, UpperCasePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Article } from '../../../core/models/article.model';

// Carte d'un article (grille "Dernières actualités", pages rubrique et recherche)
@Component({
  selector: 'app-article-card',
  imports: [RouterLink, DatePipe, UpperCasePipe, SlicePipe],
  templateUrl: './article-card.html',
  styleUrl: './article-card.css',
})
export class ArticleCard {
  article = input.required<Article>();
}
