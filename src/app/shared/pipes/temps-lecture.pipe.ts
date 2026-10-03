import { Pipe, PipeTransform } from '@angular/core';

// "Le Président a annoncé..." (600 mots) → "3 min de lecture"
@Pipe({ name: 'tempsLecture' })
export class TempsLecturePipe implements PipeTransform {
  transform(texte: string | null | undefined): string {
    const nombreDeMots = (texte ?? '').trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(nombreDeMots / 200)); // ~200 mots par minute, 1 min minimum
    return `${minutes} min de lecture`;
  }
}
