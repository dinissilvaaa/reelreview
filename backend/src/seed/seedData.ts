// ============================================================================
// seed/seedData.ts
// Demo data inserted by the seed script so the app is not empty on first run.
// Movies have no posters on purpose: the frontend generates a coloured
// placeholder, and admins can upload real posters from the admin panel.
// ============================================================================

import type { Genre } from '../constants/genres'; // Allowed genres
import type { UserRole } from '../constants/roles'; // 'user' | 'admin'

// ---- Users -----------------------------------------------------------------

export type SeedAuthor = 'admin' | 'demo' | 'critic'; // Short keys used to link reviews to users

export interface SeedUser {
  key: SeedAuthor; // Internal key
  username: string; // Public name
  email: string; // Login email
  password: string; // Plain text here; hashed by the User model before saving
  role: UserRole; // 'user' | 'admin'
}

/**
 * Builds the demo accounts. The admin credentials come from the environment
 * (ADMIN_EMAIL / ADMIN_PASSWORD) so they can be changed without touching code.
 */
export function buildSeedUsers(adminEmail: string, adminPassword: string): SeedUser[] {
  return [
    { key: 'admin', username: 'admin', email: adminEmail, password: adminPassword, role: 'admin' }, // Administrator
    { key: 'demo', username: 'moviefan', email: 'demo@reelreview.com', password: 'Demo1234!', role: 'user' }, // Normal user
    { key: 'critic', username: 'cinephile', email: 'critic@reelreview.com', password: 'Critic1234!', role: 'user' }, // Second normal user
  ];
}

// ---- Movies ----------------------------------------------------------------

export interface SeedMovie {
  title: string; // Title
  description: string; // Short synopsis
  director: string; // Director(s)
  releaseYear: number; // Year
  durationMinutes: number; // Runtime
  genres: Genre[]; // 1-5 genres
}

export const SEED_MOVIES: SeedMovie[] = [
  {
    title: 'The Shawshank Redemption', // Movie 1
    description: 'A banker sentenced to life in Shawshank prison for a crime he insists he did not commit forms an unlikely friendship and holds on to hope over two decades behind bars.',
    director: 'Frank Darabont',
    releaseYear: 1994,
    durationMinutes: 142,
    genres: ['Drama'],
  },
  {
    title: 'The Godfather', // Movie 2
    description: 'The ageing head of a powerful New York crime family reluctantly hands control of his empire to his youngest son, who is slowly transformed by the family business.',
    director: 'Francis Ford Coppola',
    releaseYear: 1972,
    durationMinutes: 175,
    genres: ['Crime', 'Drama'],
  },
  {
    title: 'The Dark Knight', // Movie 3
    description: 'Batman, Commissioner Gordon and a new district attorney fight organised crime in Gotham until a chaotic criminal mastermind known as the Joker pushes the city to its limits.',
    director: 'Christopher Nolan',
    releaseYear: 2008,
    durationMinutes: 152,
    genres: ['Action', 'Crime', 'Drama'],
  },
  {
    title: 'Pulp Fiction', // Movie 4
    description: 'Two hitmen, a boxer, a gangster and his wife cross paths in a series of interwoven, darkly funny stories set in the Los Angeles underworld.',
    director: 'Quentin Tarantino',
    releaseYear: 1994,
    durationMinutes: 154,
    genres: ['Crime', 'Drama'],
  },
  {
    title: 'Spirited Away', // Movie 5
    description: 'While moving to a new town, a ten-year-old girl wanders into a world of spirits and must work in a magical bathhouse to free herself and her parents.',
    director: 'Hayao Miyazaki',
    releaseYear: 2001,
    durationMinutes: 125,
    genres: ['Animation', 'Fantasy', 'Family', 'Adventure'],
  },
  {
    title: 'Inception', // Movie 6
    description: 'A thief who steals secrets by entering people\'s dreams is offered a chance at redemption: plant an idea in a target\'s mind instead of stealing one.',
    director: 'Christopher Nolan',
    releaseYear: 2010,
    durationMinutes: 148,
    genres: ['Action', 'Sci-Fi', 'Thriller'],
  },
  {
    title: 'Parasite', // Movie 7
    description: 'A poor family schemes its way into working for a wealthy household, until an unexpected discovery turns their plan into something far more dangerous.',
    director: 'Bong Joon Ho',
    releaseYear: 2019,
    durationMinutes: 132,
    genres: ['Thriller', 'Drama', 'Comedy'],
  },
  {
    title: 'The Matrix', // Movie 8
    description: 'A computer hacker learns that the world he lives in is a simulation built by machines and joins a rebellion fighting to free humanity.',
    director: 'Lana Wachowski, Lilly Wachowski',
    releaseYear: 1999,
    durationMinutes: 136,
    genres: ['Action', 'Sci-Fi'],
  },
  {
    title: 'Toy Story', // Movie 9
    description: 'A cowboy doll feels threatened when a flashy new space-ranger toy becomes his owner\'s favourite, until the two rivals get lost and must work together.',
    director: 'John Lasseter',
    releaseYear: 1995,
    durationMinutes: 81,
    genres: ['Animation', 'Comedy', 'Family'],
  },
  {
    title: 'Get Out', // Movie 10
    description: 'A young man visits his girlfriend\'s parents for the weekend and slowly uncovers the disturbing secret behind their overly friendly welcome.',
    director: 'Jordan Peele',
    releaseYear: 2017,
    durationMinutes: 104,
    genres: ['Horror', 'Mystery', 'Thriller'],
  },
  {
    title: 'La La Land', // Movie 11
    description: 'An aspiring actress and a jazz pianist fall in love in Los Angeles while chasing their dreams, which slowly begin to pull them in different directions.',
    director: 'Damien Chazelle',
    releaseYear: 2016,
    durationMinutes: 128,
    genres: ['Musical', 'Romance', 'Drama'],
  },
  {
    title: 'Mad Max: Fury Road', // Movie 12
    description: 'In a desert wasteland, a drifter and a rebel warrior flee across the desert in a war rig carrying five women escaping a tyrant and his army.',
    director: 'George Miller',
    releaseYear: 2015,
    durationMinutes: 120,
    genres: ['Action', 'Adventure', 'Sci-Fi'],
  },
  {
    title: 'The Grand Budapest Hotel', // Movie 13
    description: 'The legendary concierge of a famous European hotel and his loyal lobby boy are caught up in the theft of a priceless painting and a family fortune.',
    director: 'Wes Anderson',
    releaseYear: 2014,
    durationMinutes: 99,
    genres: ['Comedy', 'Crime', 'Adventure'],
  },
  {
    title: 'Interstellar', // Movie 14
    description: 'With Earth becoming uninhabitable, a former pilot leads a team of explorers through a wormhole in search of a new home for humanity.',
    director: 'Christopher Nolan',
    releaseYear: 2014,
    durationMinutes: 169,
    genres: ['Sci-Fi', 'Adventure', 'Drama'],
  },
  {
    title: 'Amélie', // Movie 15
    description: 'A shy waitress in Montmartre decides to secretly improve the lives of the people around her while struggling to find love of her own.',
    director: 'Jean-Pierre Jeunet',
    releaseYear: 2001,
    durationMinutes: 122,
    genres: ['Comedy', 'Romance'],
  },
  {
    title: 'Alien', // Movie 16
    description: 'The crew of a commercial spaceship answers a mysterious distress call and unknowingly brings a deadly creature on board.',
    director: 'Ridley Scott',
    releaseYear: 1979,
    durationMinutes: 117,
    genres: ['Horror', 'Sci-Fi'],
  },
  {
    title: 'Saving Private Ryan', // Movie 17
    description: 'After the D-Day landings, a group of soldiers goes behind enemy lines to find a paratrooper whose three brothers have been killed in action.',
    director: 'Steven Spielberg',
    releaseYear: 1998,
    durationMinutes: 169,
    genres: ['War', 'Drama'],
  },
  {
    title: 'The Good, the Bad and the Ugly', // Movie 18
    description: 'Three gunslingers with very different morals compete to find a fortune in buried Confederate gold during the American Civil War.',
    director: 'Sergio Leone',
    releaseYear: 1966,
    durationMinutes: 178,
    genres: ['Western', 'Adventure'],
  },
  {
    title: 'Knives Out', // Movie 19
    description: 'When a wealthy crime novelist is found dead after his birthday party, an eccentric detective investigates his scheming family and loyal nurse.',
    director: 'Rian Johnson',
    releaseYear: 2019,
    durationMinutes: 130,
    genres: ['Mystery', 'Comedy', 'Crime'],
  },
  {
    title: 'Free Solo', // Movie 20
    description: 'A documentary following climber Alex Honnold as he prepares to climb the 900-metre El Capitan wall in Yosemite without any ropes.',
    director: 'Jimmy Chin, Elizabeth Chai Vasarhelyi',
    releaseYear: 2018,
    durationMinutes: 100,
    genres: ['Documentary', 'Adventure'],
  },
];

// ---- Reviews ---------------------------------------------------------------

export interface SeedReview {
  movieTitle: string; // Must match a title in SEED_MOVIES
  author: SeedAuthor; // Which seed user wrote it
  rating: number; // 1-5
  comment: string; // Review text
}

export const SEED_REVIEWS: SeedReview[] = [
  { movieTitle: 'The Shawshank Redemption', author: 'demo', rating: 5, comment: 'A timeless story about hope and friendship. The ending gets me every single time.' },
  { movieTitle: 'The Shawshank Redemption', author: 'critic', rating: 5, comment: 'Patient storytelling and two outstanding lead performances.' },
  { movieTitle: 'The Shawshank Redemption', author: 'admin', rating: 4, comment: 'Slow first half, but the payoff is completely worth it.' },
  { movieTitle: 'The Godfather', author: 'critic', rating: 5, comment: 'Every scene is a lesson in filmmaking. A true classic.' },
  { movieTitle: 'The Godfather', author: 'demo', rating: 4, comment: 'Long, but I was hooked from the wedding scene onwards.' },
  { movieTitle: 'The Dark Knight', author: 'demo', rating: 5, comment: 'The best superhero movie ever made. The Joker steals the show.' },
  { movieTitle: 'The Dark Knight', author: 'critic', rating: 4, comment: 'Ambitious and tense, even if the last act feels a bit crowded.' },
  { movieTitle: 'Pulp Fiction', author: 'critic', rating: 5, comment: 'Brilliant dialogue and a non-linear structure that still feels fresh.' },
  { movieTitle: 'Pulp Fiction', author: 'demo', rating: 3, comment: 'Cool style, but a bit too violent for my taste.' },
  { movieTitle: 'Spirited Away', author: 'demo', rating: 5, comment: 'Pure magic. Every frame looks like a painting.' },
  { movieTitle: 'Spirited Away', author: 'admin', rating: 5, comment: 'A perfect film to watch with the whole family.' },
  { movieTitle: 'Inception', author: 'demo', rating: 5, comment: 'Mind-bending plot and an incredible soundtrack.' },
  { movieTitle: 'Inception', author: 'critic', rating: 4, comment: 'Clever concept, sometimes too busy explaining its own rules.' },
  { movieTitle: 'Parasite', author: 'critic', rating: 5, comment: 'Funny, tense and painfully sharp about social class.' },
  { movieTitle: 'Parasite', author: 'admin', rating: 4, comment: 'I did not expect the twist in the middle at all.' },
  { movieTitle: 'The Matrix', author: 'demo', rating: 4, comment: 'Still looks amazing today. The lobby scene is iconic.' },
  { movieTitle: 'Toy Story', author: 'admin', rating: 4, comment: 'Charming and funny, a great start for computer animation.' },
  { movieTitle: 'Get Out', author: 'critic', rating: 4, comment: 'Smart horror that keeps you guessing until the end.' },
  { movieTitle: 'La La Land', author: 'demo', rating: 4, comment: 'Beautiful music and colours. That ending is bittersweet.' },
  { movieTitle: 'La La Land', author: 'critic', rating: 3, comment: 'Lovely to look at, but the story did not fully win me over.' },
  { movieTitle: 'Mad Max: Fury Road', author: 'critic', rating: 5, comment: 'Two hours of perfectly choreographed chaos.' },
  { movieTitle: 'Interstellar', author: 'demo', rating: 5, comment: 'Emotional and epic. The docking scene is unforgettable.' },
  { movieTitle: 'Alien', author: 'admin', rating: 4, comment: 'Slow-burn tension at its best.' },
  { movieTitle: 'Knives Out', author: 'demo', rating: 4, comment: 'A fun, modern whodunit with a great cast.' },
  { movieTitle: 'Free Solo', author: 'critic', rating: 4, comment: 'My palms were sweating the entire time.' },
];
