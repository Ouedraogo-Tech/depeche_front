import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Article } from '../../../core/models/article.model';
import { ImageSecours } from '../../directives/image-secours.directive';

// Article en version compacte : petite image + catégorie, date, titre
@Component({
  selector: 'app-article-mini',
  imports: [RouterLink, DatePipe, ImageSecours],
  templateUrl: './article-mini.html',
  styleUrl: './article-mini.css',
  host: { class: 'block' }, // la balise <app-article-mini> se comporte comme un bloc (et non comme du texte)
})
export class ArticleMini {
  article = input.required<Article>();
}
