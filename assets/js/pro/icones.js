// Icônes de la console : tracés simples dessinés pour ce dépôt (trait 1,6 px,
// 24×24, currentColor). Aucune bibliothèque d'icônes n'est copiée.
const NS = 'http://www.w3.org/2000/svg';

const TRACES = {
  journee: 'M4 12.5 12 5l8 7.5M6.5 11v8h11v-8',
  dossiers: 'M4 6.5h6l1.6 2H20v10H4zM4 11h16',
  nouveau: 'M12 5v14M5 12h14',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2.5v2.5H14zM18 18h2v2h-2zM17.5 14H20',
  bibliotheque: 'M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z',
  statistiques: 'M5 20V11M12 20V5M19 20v-6',
  facturation: 'M4 7h16v10H4zM4 10.5h16M7.5 14.5h3',
  equipe: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 19a5.5 5.5 0 0 1 11 0M16 8.5a2.5 2.5 0 1 1 0 5M17 19a4.5 4.5 0 0 0-2-3.7',
  parametres: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6',
  aide: 'M9.3 9.2a2.8 2.8 0 1 1 4.2 2.4c-.9.6-1.5 1.1-1.5 2.1M12 17.2v.1M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  admin: 'M12 4l1.9 4.6 4.6 1.9-4.6 1.9L12 17l-1.9-4.6-4.6-1.9 4.6-1.9zM18 16l.8 1.9 1.9.8-1.9.8L18 21.4l-.8-1.9-1.9-.8 1.9-.8z',
  recherche: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM16.5 16.5 20 20',
  cloche: 'M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15zM10 20.5a2 2 0 0 0 4 0',
  soleil: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4',
  lune: 'M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z',
  lecture: 'M8 5.5v13l11-6.5z',
  pause: 'M8 5.5v13M16 5.5v13',
  copier: 'M9 9h10v11H9zM5 15V4h10',
  dupliquer: 'M9 9h10v11H9zM5 15V4h10M14 12.5v4M12 14.5h4',
  presenter: 'M4 5h16v11H4zM9 20h6M12 16v4',
  partager: 'M8 12.5l8-4.5M8 11.5l8 4.5M6.5 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM17.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM17.5 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  telecharger: 'M12 4v11M7.5 11 12 15.5 16.5 11M5 19.5h14',
  fermer: 'M6 6l12 12M18 6 6 18',
  coche: 'M5 12.5l4.5 4.5L19 7.5',
  clavier: 'M3.5 7h17v10h-17zM7 10.5h.1M10.5 10.5h.1M14 10.5h.1M17.5 10.5h.1M8 14h8',
  tableau: 'M4 5h16v14H4zM4 10h16M4 15h16M10 5v14',
  colonnes: 'M4 5h4.5v14H4zM9.8 5h4.5v9H9.8zM15.5 5H20v12h-4.5z',
  filtre: 'M4 6h16l-6 7v5l-4 2v-7z',
  alerte: 'M12 4 3 19.5h18zM12 10v4.5M12 17v.1',
  horloge: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V12l3 2'
};

/** Rend un <svg> décoratif (aria-hidden). */
export function icone(nom, { taille = 20, classe = '' } = {}) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(taille));
  svg.setAttribute('height', String(taille));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.6');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  if (classe) svg.setAttribute('class', classe);
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', TRACES[nom] || TRACES.aide);
  svg.append(p);
  return svg;
}

export const NOMS_ICONES = Object.keys(TRACES);
