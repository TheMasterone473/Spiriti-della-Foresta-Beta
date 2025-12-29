
import { Card, CardType, Sigil } from './types';

// Mappatura nomi carte -> Icone Lucide
const ICON_MAP: Record<string, string> = {
  'Scoiattolo': 'cat',
  'Topo': 'mouse',
  'Trota': 'fish',
  'Cozza': 'shell',
  'Coniglio': 'rabbit',
  'Formica': 'bug',
  'Rametto': 'leaf',
  'Rametto di Bacche': 'leaf',
  'Totem Lupacchiotto': 'component',
  'Lumaca': 'snail',
  'Lupacchiotto': 'dog',
  'Cucciolo d\'Orso': 'cat',
  'Gufo': 'bird',
  'Volpe': 'fox',
  'Alce': 'deer',
  'Talpa': 'mountain',
  'Trappola': 'skull',
  'Larva': 'caterpillar',
  'Scorpione': 'bug',
  'Scarafaggio': 'bug',
  'Cane da Guardia': 'shield',
  'Porcospino': 'snowflake',
  'Pipistrello': 'bird',
  'Serpente': 'infinity',
  'Totem dell\'Orso': 'component',
  'Totem del Lupo': 'component',
  'Alveare': 'hexagon',
  'Gabbia': 'lock',
  'Mantide': 'bug',
  'Lucertola': 'lizard',
  'Cespuglio di Bacche': 'tree-pine',
  'Lupo': 'dog',
  'Orso': 'cat',
  'Falco': 'bird',
  'Tartaruga': 'shield',
  'Ape': 'bug',
  'Coda di Lucertola': 'spline',
  'Scarabeo': 'shield-check',
  'Puzzola': 'wind',
  'Macigno': 'mountain',
  'Rovi': 'flower',
  'Dinamite': 'bomb',
  'Castoro': 'hammer',
  'Mostro del lago': 'waves',
  // Boss Icons
  'Silva': 'tree-pine',
  'Conifo': 'zap',
  'La Prima Donna': 'flower-2',
  'Mato Tope': 'ghost'
};

export const createCard = (name: string, atk: number, hp: number, cost: number, desc: string, sigils: Sigil[] = [], type = CardType.BEAST): Card => {
  const iconName = ICON_MAP[name] || 'help-circle';
  return {
    id: Math.random().toString(36).substr(2, 9),
    name,
    attack: atk,
    health: hp,
    maxHealth: hp,
    cost,
    description: desc,
    imageUrl: `https://api.iconify.design/lucide/${iconName}.svg?color=%23d1d5db`,
    sigils,
    type,
    baseAttack: atk,
    baseHealth: hp,
    age: 0
  };
};

// Carte del Custode (Ostacoli)
export const WARDEN_OBSTACLES: Card[] = [
  createCard('Macigno', 0, 4, 0, 'Una pietra inamovibile che blocca il sentiero.', [], CardType.OBSTACLE),
  createCard('Rovi', 0, 3, 0, 'Piante spinose che graffiano chi le tocca.', ['SPINE'], CardType.OBSTACLE),
  createCard('Dinamite', 0, 2, 0, 'Un pericolo esplosivo. Non colpirlo troppo forte.', ['DETONAZIONE'], CardType.OBSTACLE),
];

export const BOSS_LIBRARY: Card[] = [
  createCard('Silva', 2, 30, 0, 'Lo spirito antico della quercia. Non perdona chi calpesta le radici.', ['SPINE', 'BARRIERA'], CardType.SPECIAL),
  createCard('Conifo', 4, 40, 0, 'L\'oscuro signore dei sempreverdi. La sua ombra è tossica.', ['VELENO', 'CORAZZA'], CardType.SPECIAL),
  createCard('La Prima Donna', 2, 60, 0, 'Il primo fiore sbocciato nel sangue. Bellissima e letale.', ['CURA', 'GABBIA'], CardType.SPECIAL),
  createCard('Mato Tope', 5, 50, 0, 'Colui che divora il mondo dal basso. Niente è al sicuro.', ['DIRETTO', 'INTIMIDAZIONE'], CardType.SPECIAL),
];

// Carte Token
export const TOKEN_APE = createCard('Ape', 1, 1, 0, 'Svolazza irritata.', ['VOLO'], CardType.INSECT);
export const TOKEN_RAMETTO = createCard('Rametto di Bacche', 0, 1, 0, 'Un piccolo dono del bosco.', ['CURA'], CardType.PLANT);
export const TOKEN_CODA = createCard('Coda di Lucertola', 0, 2, 0, 'Si muove ancora convulsamente...', [], CardType.BEAST);

export const CARD_LIBRARY: Card[] = [
  // Costo 1
  createCard('Scoiattolo', 1, 1, 1, 'Un umile inizio.'),
  createCard('Topo', 2, 1, 1, 'Veloce e famelico.'),
  createCard('Trota', 1, 2, 1, 'Scivola tra i sassi.'),
  createCard('Cozza', 0, 3, 1, 'Ricevi 2 semi quando sconfitta.', ['SEMI_MORTE']),
  createCard('Coniglio', 0, 2, 1, 'Abbassa Atk nemico davanti.', ['INTIMIDAZIONE']),
  createCard('Formica', 0, 1, 1, 'Brancomente: ottiene +1 Atk per ogni Formica alleata.', ['FORZA_BRANCO'], CardType.INSECT),
  createCard('Rametto di Bacche', 0, 1, 1, 'Cura 1 HP.', ['CURA'], CardType.PLANT),
  createCard('Totem Lupacchiotto', 0, 1, 1, '+1 Atk per un turno.', ['BUFF_TURNO'], CardType.TOTEM),
  
  // Costo 2
  createCard('Lumaca', 1, 2, 2, 'Ignora il primo attacco.', ['CORAZZA']),
  createCard('Lupacchiotto', 2, 2, 2, 'Diventa più forte in presenza del Lupo.', ['BRANCO']),
  createCard('Gufo', 2, 1, 2, 'Attacca a destra o sinistra.', ['CECCHINO']),
  createCard('Volpe', 2, 2, 2, 'Ruba la prima carta eliminata.', ['LADRO']),
  createCard('Alce', 1, 5, 2, 'Maestosa resistenza.'),
  createCard('Talpa', 1, 1, 2, 'Attacca direttamente il giocatore.', ['DIRETTO']),
  createCard('Trappola', 0, 3, 2, 'Danneggia chi la calpesta.', ['TRAPPOLA']),
  createCard('Larva', 1, 1, 2, 'Diventa Scarabeo (2/4) dopo 2 turni.', ['EVOLUZIONE']),
  createCard('Scorpione', 3, 1, 2, 'Letale ma fragile.'),
  createCard('Scarafaggio', 1, 2, 2, 'Dona Corazza alla morte.', ['SINFONIA']),
  createCard('Cane da Guardia', 1, 4, 2, 'Si sposta per parare i danni.', ['PARATA']),
  createCard('Porcospino', 1, 3, 2, 'Danneggia chi lo attacca.', ['SPINE']),
  createCard('Puzzola', 2, 2, 2, 'Un odore acre che infonde ferocia.', ['ESALAZIONE']),

  // Costo 3
  createCard('Cucciolo d\'Orso', 3, 4, 3, 'Diventa più forte in presenza dell\'Orso.', ['BRANCO']),
  createCard('Pipistrello', 2, 3, 3, 'Si nutre della forza vitale altrui.', ['VAMPIRISMO']),
  createCard('Serpente', 1, 2, 3, 'Uccide in un colpo.', ['VELENO']),
  createCard('Totem dell\'Orso', 0, 4, 3, '+2 HP alleati adiacenti.', ['AURA_HP'], CardType.TOTEM),
  createCard('Totem del Lupo', 0, 4, 3, '+1 Atk alleati adiacenti.', ['AURA_ATK'], CardType.TOTEM),
  createCard('Alveare', 0, 5, 3, 'Rilascia un\'Ape quando colpito.', ['SPINE', 'SERBATOIO']),
  createCard('Gabbia', 0, 6, 3, 'Impedisce al nemico davanti di attaccare.', ['GABBIA']),
  createCard('Mantide', 1, 2, 3, 'Attacca lateralmente.', ['CECCHINO']),
  createCard('Lucertola', 1, 3, 3, 'Lascia la coda quando muore.', ['CODA_REAZIONE']),
  createCard('Cespuglio di Bacche', 0, 4, 3, 'Dona Rametto quando colpito.', ['SERBATOIO']),
  createCard('Scarabeo', 2, 4, 2, 'Una corazza impenetrabile.', [], CardType.INSECT),

  // Costo 4+
  createCard('Lupo', 4, 4, 4, 'Guida i cuccioli del bosco.', ['BRANCO']),
  createCard('Orso', 5, 7, 4, 'La furia della foresta incute rispetto.'),
  createCard('Castoro', 2, 2, 4, 'Instancabile protettore. Fortifica le difese degli alleati.', ['BARRIERA_COLLETTIVA']),
  createCard('Falco', 3, 3, 4, 'Ruba carta nemica giocata.', ['LADRO_MANO']),
  createCard('Mostro del lago', 5, 5, 5, 'Emerge dagli abissi per poi sparire tra le nebbie.', ['MOVIMENTO_CASUALE']),
  createCard('Tartaruga', 1, 12, 5, 'Para da tutte le caselle.', ['PARATA']),
];

export const INITIAL_DECK = [
  CARD_LIBRARY[0], // Scoiattolo
  CARD_LIBRARY[5], // Formica
  CARD_LIBRARY[41], // Mostro del lago (Forzato per test)
  CARD_LIBRARY[2], // Trota
];

export const MAX_SEEDS = 10;
export const MAX_HAND = 5;
export const MAX_SLOTS = 4;
export const STARTING_HEALTH = 12;
