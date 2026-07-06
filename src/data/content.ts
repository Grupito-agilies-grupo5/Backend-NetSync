import { ContentItem } from '../models/types';

const OMDB_BASE_URL = 'https://www.omdbapi.com/';

// Curated real IMDb IDs used to build the catalog from OMDb at startup
const CURATED_IMDB_IDS = [
  'tt1375666', // Inception
  'tt0468569', // The Dark Knight
  'tt0816692', // Interstellar
  'tt6751668', // Parasite
  'tt4633694', // Spider-Man: Into the Spider-Verse
  'tt0133093', // The Matrix
  'tt4154796', // Avengers: Endgame
  'tt1160419', // Dune
];

const GRADIENTS = [
  'from-indigo-600 to-purple-800',
  'from-gray-800 to-slate-950',
  'from-blue-900 to-cyan-800',
  'from-emerald-700 to-green-900',
  'from-red-600 to-pink-800',
  'from-green-700 to-emerald-950',
  'from-purple-700 to-violet-900',
  'from-amber-700 to-orange-900',
];

export let contentCatalog: ContentItem[] = [];

async function fetchMovie(imdbId: string, index: number): Promise<ContentItem | null> {
  const apiKey = process.env.OMDB_API_KEY || '';

  try {
    const response = await fetch(`${OMDB_BASE_URL}?i=${imdbId}&apikey=${apiKey}`);
    const data: any = await response.json();

    if (data.Response === 'False') {
      console.error(`[Content] OMDb error for ${imdbId}: ${data.Error}`);
      return null;
    }

    return {
      id: imdbId,
      title: data.Title,
      genre: (data.Genre || 'N/A').split(',')[0].trim(),
      year: parseInt(data.Year, 10) || 0,
      duration: data.Runtime,
      description: data.Plot,
      gradient: GRADIENTS[index % GRADIENTS.length],
      rating: data.imdbRating,
      imdbId: data.imdbID,
      actors: data.Actors,
      posterUrl: data.Poster !== 'N/A' ? data.Poster : undefined,
    };
  } catch (err: any) {
    console.error(`[Content] Failed to fetch ${imdbId} from OMDb:`, err.message);
    return null;
  }
}

export async function loadContentCatalog(): Promise<void> {
  if (!process.env.OMDB_API_KEY) {
    console.warn('[Content] Falta OMDB_API_KEY: el catálogo quedará vacío.');
    return;
  }

  const results = await Promise.all(CURATED_IMDB_IDS.map((id, i) => fetchMovie(id, i)));
  contentCatalog = results.filter((item): item is ContentItem => item !== null);
  console.log(`[Content] Catálogo cargado: ${contentCatalog.length}/${CURATED_IMDB_IDS.length} películas desde OMDb.`);
}
