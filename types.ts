
export enum CardType {
  BEAST = 'BEAST',
  PLANT = 'PLANT',
  INSECT = 'INSECT',
  TOTEM = 'TOTEM',
  SPECIAL = 'SPECIAL',
  OBSTACLE = 'OBSTACLE'
}

export type Sigil = 
  | 'SEMI_MORTE'    // Cozza: +2 semi alla morte
  | 'INTIMIDAZIONE' // Coniglio: -1 Atk nemico davanti
  | 'FORZA_BRANCO'  // Formica: +1 Atk per ogni formica
  | 'CURA'          // Rametto: Cura 1 HP
  | 'BUFF_TURNO'    // Totem Lupacchiotto: +1 Atk per 1 turno
  | 'CORAZZA'       // Lumaca: Ignora primo attacco
  | 'LADRO'         // Volpe: Ruba carta nemica eliminata
  | 'DIRETTO'       // Talpa: Attacca direttamente il giocatore
  | 'TRAPPOLA'      // Trappola: Danni al primo che ci passa
  | 'EVOLUZIONE'    // Larva -> Scarabeo (dopo 2 turni)
  | 'SINFONIA'      // Scarafaggio: Dona scudo alla morte
  | 'PARATA'        // Cane/Tartaruga: Si sposta per parare
  | 'SPINE'         // Porcospino/Alveare/Rovi: Ritorna 1 danno
  | 'VELENO'        // Serpente: Insta-kill
  | 'BARRIERA'      // Castoro: Crea barriere da 2 HP
  | 'SERBATOIO'     // Cespuglio: Dona rametto alla morte
  | 'BRANCO'        // Lupo: Buffa Lupacchiotto
  | 'CECCHINO'      // Gufo/Mantide/Rana: Attacchi laterali o mirati
  | 'VOLO'          // Pipistrello: Cura giocatore
  | 'LADRO_MANO'    // Falco: Ruba dalla mano
  | 'CODA_REAZIONE' // Lucertola: Lascia coda
  | 'AURA_ATK'      // Totem Lupo: +1 Atk adiacenti
  | 'AURA_HP'       // Totem Orso: +2 HP adiacenti
  | 'GABBIA'        // Gabbia: Blocca nemico
  | 'VAMPIRISMO'    // Pipistrello: Cura su uccisione
  | 'ESALAZIONE'    // Puzzola: Dona Atk alla morte
  | 'DETONAZIONE'   // Dinamite: Distrugge chi la sconfigge
  | 'BARRIERA_COLLETTIVA' // Castoro: +2 HP agli alleati all'entrata
  | 'MOVIMENTO_CASUALE';  // Mostro del lago: Si sposta dopo l'attacco

export interface Card {
  id: string;
  name: string;
  attack: number;
  health: number;
  maxHealth: number;
  cost: number;
  type: CardType;
  description: string;
  imageUrl: string;
  sigils: Sigil[];
  isShielded?: boolean;
  isStunned?: boolean;
  baseAttack?: number;
  baseHealth?: number;
  age?: number; // Traccia i turni sul campo
}

export interface GameState {
  playerHand: Card[];
  playerBoard: (Card | null)[];
  opponentBoard: (Card | null)[];
  opponentQueue: (Card | null)[];
  playerSeeds: number;
  playerHealth: number;
  opponentHealth: number;
  turn: number;
  currentLevel: number;
  isPlayerTurn: boolean;
  gameStatus: 'MENU' | 'PLAYING' | 'PLAYER_WIN' | 'PLAYER_LOSS' | 'LOADING' | 'LEVEL_TRANSITION';
  logs: string[];
}
