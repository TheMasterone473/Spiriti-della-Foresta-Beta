
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Card, CardType, Sigil } from './types';
import { INITIAL_DECK, CARD_LIBRARY, BOSS_LIBRARY, MAX_SLOTS, MAX_SEEDS, MAX_HAND, STARTING_HEALTH, TOKEN_APE, TOKEN_RAMETTO, TOKEN_CODA, WARDEN_OBSTACLES } from './constants';
import { CardComponent } from './components/CardComponent';
import { BoardSlot } from './components/BoardSlot';
import { getWardenDialogue, getLevelIntro } from './services/geminiService';
import { sounds } from './services/soundService';

const App: React.FC = () => {
  const [audioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    sounds.setEnabled(audioEnabled);
  }, [audioEnabled]);

  const prepareCard = (card: Card): Card => ({
    ...card,
    id: card.id.includes('-') ? card.id : `${card.id}-${Math.random().toString(36).substr(2, 4)}`,
    isShielded: card.sigils.includes('CORAZZA'),
    baseAttack: card.attack,
    baseHealth: card.health,
    age: 0
  });

  const createInitialState = (): GameState => {
    const shuffled = [...INITIAL_DECK].sort(() => Math.random() - 0.5);
    const startingHand = shuffled.slice(0, 3).map(c => prepareCard(c));

    return {
      playerHand: startingHand,
      playerBoard: Array(MAX_SLOTS).fill(null),
      opponentBoard: Array(MAX_SLOTS).fill(null),
      opponentQueue: Array(MAX_SLOTS).fill(null),
      playerSeeds: 1,
      playerHealth: STARTING_HEALTH,
      opponentHealth: 6,
      turn: 1,
      currentLevel: 1,
      isPlayerTurn: true,
      gameStatus: 'MENU',
      logs: ['Il bosco ti accoglie.', 'Capitolo I: Il Sentiero dei Sospiri.']
    };
  };

  const [gameState, setGameState] = useState<GameState>(createInitialState);
  const [selectedHandIndex, setSelectedHandIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [attackingIndices, setAttackingIndices] = useState<{ player: number[], opponent: number[] }>({ player: [], opponent: [] });
  const [recentlyDamaged, setRecentlyDamaged] = useState<Set<string>>(new Set());
  const [recentlyHealed, setRecentlyHealed] = useState<Set<string>>(new Set());
  const [wardenSaying, setWardenSaying] = useState<string>("...avvicinati al tavolo.");
  const logContainerRef = useRef<HTMLDivElement>(null);

  const resetToMenu = () => {
    setGameState(createInitialState());
    setSelectedHandIndex(null);
    setIsProcessing(false);
    setAttackingIndices({ player: [], opponent: [] });
    setWardenSaying("...avvicinati al tavolo.");
  };

  const weightedDraw = useCallback(() => {
    const maxCostAllowed = Math.min(5, gameState.turn + gameState.currentLevel);
    const availableCards = CARD_LIBRARY.filter(c => c.cost <= maxCostAllowed);
    const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
    return prepareCard(randomCard);
  }, [gameState.turn, gameState.currentLevel]);

  const startLevel = async (level: number) => {
    setIsProcessing(true);
    const isBossLevel = level % 5 === 0;
    
    try {
      let intro = await getLevelIntro(level);
      if (isBossLevel) {
        const bossIndex = (Math.floor(level / 5) - 1) % BOSS_LIBRARY.length;
        const boss = BOSS_LIBRARY[bossIndex];
        intro = `TREMATE. ${boss.name.toUpperCase()} È QUI PER DIVORARVI.`;
      }
      setWardenSaying(intro);
      
      setGameState(prev => ({
        ...prev,
        opponentHealth: isBossLevel ? 10 + (level * 8) : 5 + (level * 4),
        currentLevel: level,
        playerBoard: Array(MAX_SLOTS).fill(null),
        opponentBoard: Array(MAX_SLOTS).fill(null),
        opponentQueue: Array(MAX_SLOTS).fill(null),
        playerSeeds: Math.max(prev.playerSeeds, 1),
        gameStatus: 'PLAYING',
        isPlayerTurn: true,
        turn: 1,
        logs: [...prev.logs, `--- Capitolo ${level}${isBossLevel ? ' (BOSS FIGHT)' : ''} ---`, intro]
      }));
      
      setTimeout(() => {
        setGameState(prev => {
          const nextBoard = [...prev.opponentBoard];
          const nextQueue = [...prev.opponentQueue];
          
          if (isBossLevel) {
            const bossIndex = (Math.floor(level / 5) - 1) % BOSS_LIBRARY.length;
            const bossCard = prepareCard(BOSS_LIBRARY[bossIndex]);
            nextBoard[Math.floor(MAX_SLOTS / 2)] = bossCard;
            sounds.playLoss();
          } else {
            // All'inizio del livello 1, il Custode mette solo un Macigno
            if (level === 1) {
              nextBoard[Math.floor(Math.random() * MAX_SLOTS)] = prepareCard(WARDEN_OBSTACLES[0]);
            } else {
              const maxCost = Math.min(2, level);
              const pool = CARD_LIBRARY.filter(c => c.cost <= maxCost && c.type !== CardType.TOTEM);
              const monster = pool[Math.floor(Math.random() * pool.length)];
              nextQueue[Math.floor(Math.random() * MAX_SLOTS)] = prepareCard(monster);
            }
          }
          
          return { ...prev, opponentBoard: nextBoard, opponentQueue: nextQueue };
        });
        setIsProcessing(false);
      }, 1000);
    } catch (e) {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [gameState.logs]);

  const addLog = (msg: string) => {
    setGameState(prev => ({ ...prev, logs: [...prev.logs, msg] }));
  };

  const handleSacrifice = () => {
    if (selectedHandIndex === null || isProcessing) return;
    const card = gameState.playerHand[selectedHandIndex];
    let refund = card.cost >= 3 ? 3 : (card.cost >= 2 ? 2 : 1);
    
    sounds.playSacrifice();
    setGameState(prev => {
      const newHand = [...prev.playerHand];
      newHand.splice(selectedHandIndex, 1);
      return {
        ...prev,
        playerHand: newHand,
        playerSeeds: Math.min(MAX_SEEDS, prev.playerSeeds + refund),
        logs: [...prev.logs, `Sacrificio: ${card.name} (+${refund} semi)`]
      };
    });
    setSelectedHandIndex(null);
  };

  const handlePlayCard = (slotIndex: number, side: 'PLAYER' | 'OPPONENT' = 'PLAYER') => {
    if (selectedHandIndex === null || isProcessing) return;
    const card = gameState.playerHand[selectedHandIndex];
    const isSpecialSlot = card.sigils.includes('TRAPPOLA') || card.sigils.includes('GABBIA');

    if (side === 'OPPONENT' && !isSpecialSlot) return;
    if (side === 'PLAYER' && isSpecialSlot) return;

    const targetBoard = side === 'PLAYER' ? gameState.playerBoard : gameState.opponentBoard;
    
    if (side === 'PLAYER' && targetBoard[slotIndex] !== null && card.name === 'Totem Lupacchiotto') {
      if (gameState.playerSeeds < card.cost) {
        addLog(`Servono ${card.cost} semi.`);
        return;
      }
      
      sounds.playHeal();
      setGameState(prev => {
        const newHand = [...prev.playerHand];
        newHand.splice(selectedHandIndex, 1);
        const newPBoard = [...prev.playerBoard];
        const target = { ...newPBoard[slotIndex]! };
        
        target.baseAttack = (target.baseAttack || 0) + 1;
        target.attack += 1;
        newPBoard[slotIndex] = target;
        setRecentlyHealed(h => new Set([...h, target.id]));
        
        return {
          ...prev,
          playerHand: newHand,
          playerBoard: newPBoard,
          playerSeeds: prev.playerSeeds - card.cost,
          logs: [...prev.logs, `${card.name} potenzia ${target.name} (+1 Atk)!`]
        };
      });
      setTimeout(() => setRecentlyHealed(new Set()), 600);
      setSelectedHandIndex(null);
      return;
    }

    if (targetBoard[slotIndex] !== null) return;

    if (gameState.playerSeeds < card.cost) {
      addLog(`Servono ${card.cost} semi.`);
      return;
    }

    sounds.playCard();
    setGameState(prev => {
      const newHand = [...prev.playerHand];
      newHand.splice(selectedHandIndex, 1);
      const newPBoard = [...prev.playerBoard];
      const newOBoard = [...prev.opponentBoard];
      const placedCard = prepareCard(card);
      const logs = [...prev.logs];
      const healed = new Set<string>();
      
      if (side === 'PLAYER') {
        newPBoard[slotIndex] = placedCard;
        if (placedCard.sigils.includes('BARRIERA_COLLETTIVA')) {
          logs.push(`${placedCard.name} innalza una barriera protettiva per gli alleati!`);
          for (let i = 0; i < MAX_SLOTS; i++) {
            if (i !== slotIndex && newPBoard[i]) {
              const ally = { ...newPBoard[i]! };
              ally.maxHealth += 2;
              ally.health += 2;
              newPBoard[i] = ally;
              healed.add(ally.id);
            }
          }
          if (healed.size > 0) {
            sounds.playHeal();
            setRecentlyHealed(healed);
            setTimeout(() => setRecentlyHealed(new Set()), 600);
          }
        }
      }
      else newOBoard[slotIndex] = placedCard;

      logs.push(`${card.name} scende in campo.`);

      return {
        ...prev,
        playerHand: newHand,
        playerBoard: newPBoard,
        opponentBoard: newOBoard,
        playerSeeds: prev.playerSeeds - card.cost,
        logs
      };
    });
    setSelectedHandIndex(null);
  };

  const executeOpponentTurn = useCallback(async () => {
    setIsProcessing(true);
    const dialogue = await getWardenDialogue(gameState, "Turno avversario");
    setWardenSaying(dialogue);

    setTimeout(() => {
      setGameState(prev => {
        if (prev.gameStatus !== 'PLAYING') return prev;

        const nextO = [...prev.opponentBoard];
        const nextQ = [...prev.opponentQueue];
        const logs = [...prev.logs];
        const currentLevel = prev.currentLevel;

        // 1. Gestione Coda Nemica
        for (let i = 0; i < MAX_SLOTS; i++) {
          if (nextQ[i]) {
            const arrivingEnemy = { ...nextQ[i]! };
            const boardSlotContent = nextO[i]; 

            if (boardSlotContent && boardSlotContent.sigils.includes('TRAPPOLA')) {
              const trapDamage = 3;
              arrivingEnemy.health -= trapDamage;
              sounds.playDamage();
              setRecentlyDamaged(d => new Set([...d, arrivingEnemy.id]));
              logs.push(`Trappola! ${arrivingEnemy.name} subisce ${trapDamage} danni.`);
              if (arrivingEnemy.health > 0) nextO[i] = arrivingEnemy;
              else nextO[i] = null;
              nextQ[i] = null;
            } 
            else if (boardSlotContent && boardSlotContent.sigils.includes('GABBIA')) {
              logs.push(`La Gabbia blocca ${arrivingEnemy.name}!`);
              arrivingEnemy.isStunned = true; 
              nextO[i] = arrivingEnemy; 
              nextQ[i] = null;
            }
            else if (!boardSlotContent) {
              nextO[i] = arrivingEnemy;
              nextQ[i] = null;
            }
          }
        }
        
        // 2. Schieramento Ostacoli del Custode - Progressione
        // Livello 1: Molti Macigni. Livelli alti: Dinamite e Rovi.
        const obstacleProb = currentLevel === 1 ? 0.3 : 0.15;
        for (let i = 0; i < MAX_SLOTS; i++) {
          if (!nextO[i] && !nextQ[i] && Math.random() < obstacleProb) {
             let obstacle;
             if (currentLevel === 1) obstacle = WARDEN_OBSTACLES[0]; // Solo Macigno
             else if (currentLevel < 4) obstacle = WARDEN_OBSTACLES[Math.floor(Math.random() * 2)]; // Macigno o Rovi
             else obstacle = WARDEN_OBSTACLES[Math.floor(Math.random() * WARDEN_OBSTACLES.length)]; // Tutto
             
             nextO[i] = prepareCard(obstacle);
             logs.push(`Il Custode piazza un ${obstacle.name}!`);
          }
        }

        // 3. Nuove Creature in Coda - Progressione Difficoltà
        const isBossLevel = currentLevel % 5 === 0;
        const emptyQueueSlots = nextQ.map((s, idx) => s === null ? idx : -1).filter(idx => idx !== -1);
        
        if (emptyQueueSlots.length > 0) {
          // Probabilità di schieramento aumenta col livello
          let spawnProb = 0.4 + (currentLevel * 0.1); 
          if (isBossLevel) spawnProb = 0.3; // I boss schierano meno minion perché sono già forti
          spawnProb = Math.min(0.95, spawnProb);

          if (Math.random() < spawnProb) {
            // Mazzo del Custode filtrato per costo e potenza in base al livello
            const maxCost = Math.min(5, Math.floor(currentLevel / 2) + 1);
            let pool = CARD_LIBRARY.filter(c => c.cost <= maxCost && c.type !== CardType.TOTEM);
            
            // Al livello 1, il Custode usa solo Scoiattoli, Topi o Trote (Costo 1 semplici)
            if (currentLevel === 1) {
              pool = pool.filter(c => c.cost === 1 && c.sigils.length === 0);
            }

            if (pool.length > 0) {
              const monster = pool[Math.floor(Math.random() * pool.length)];
              const slot = emptyQueueSlots[Math.floor(Math.random() * emptyQueueSlots.length)];
              nextQ[slot] = prepareCard(monster);
            }
          }
        }
        
        let newHand = [...prev.playerHand];
        if (newHand.length < MAX_HAND) {
          newHand.push(weightedDraw());
          sounds.playCard();
        }

        setTimeout(() => setRecentlyDamaged(new Set()), 600);
        setIsProcessing(false);
        return { 
          ...prev, 
          opponentBoard: nextO, 
          opponentQueue: nextQ, 
          playerHand: newHand,
          isPlayerTurn: true, 
          turn: prev.turn + 1,
          logs
        };
      });
    }, 800);
  }, [gameState.currentLevel, gameState.turn, weightedDraw]);

  const executeCombat = useCallback(async (playerSkips: boolean = false) => {
    setIsProcessing(true);
    addLog(playerSkips ? "Hai esitato. Il nemico ne approfitta!" : "--- Inizio Scontro ---");

    setGameState(prev => {
      let pHealth = prev.playerHealth;
      let oHealth = prev.opponentHealth;
      let pBoard = prev.playerBoard.map(c => c ? { ...c, age: (c.age || 0) + 1 } : null);
      let oBoard = prev.opponentBoard.map(c => c ? { ...c, age: (c.age || 0) + 1 } : null);
      let pHand = [...prev.playerHand];
      const logs = [...prev.logs];
      const damaged = new Set<string>();
      const healed = new Set<string>();

      const processStartEffects = (board: (Card | null)[]) => {
        board.forEach((card, idx) => {
          if (!card) return;
          card.attack = card.baseAttack !== undefined ? card.baseAttack : card.attack;
          
          if (card.sigils.includes('CURA')) {
            const targets = [idx - 1, idx, idx + 1];
            targets.forEach(tIdx => {
              if (tIdx >= 0 && tIdx < MAX_SLOTS && board[tIdx]) {
                const target = board[tIdx]!;
                if (target.health < target.maxHealth) {
                  target.health = Math.min(target.maxHealth, target.health + 1);
                  healed.add(target.id);
                  sounds.playHeal();
                  logs.push(`Rugiada curativa: ${target.name} +1 HP.`);
                }
              }
            });
          }
          if (card.sigils.includes('BUFF_TURNO')) {
             [idx - 1, idx + 1].forEach(tIdx => {
               if (tIdx >= 0 && tIdx < MAX_SLOTS && board[tIdx]) {
                 board[tIdx]!.attack += 1;
               }
             });
          }
        });
      };

      processStartEffects(pBoard);
      processStartEffects(oBoard);

      const updateDynamicStats = (board: (Card | null)[], enemyBoard: (Card | null)[]) => {
        const ants = board.filter(c => c?.sigils.includes('FORZA_BRANCO')).length;
        const hasLupo = board.some(c => c?.name === 'Lupo');
        const hasOrso = board.some(c => c?.name === 'Orso');
        
        board.forEach((c, idx) => {
          if (!c) return;

          if (c.sigils.includes('FORZA_BRANCO')) {
            c.attack += ants;
          }

          if (c.name === 'Lupacchiotto' && hasLupo) {
            c.attack += 1;
          }

          if (c.name === 'Cucciolo d\'Orso' && hasOrso) {
            c.attack += 1;
          }

          [idx - 1, idx + 1].forEach(nIdx => {
            if (nIdx >= 0 && nIdx < MAX_SLOTS && board[nIdx]) {
              const totem = board[nIdx]!;
              if (totem.sigils.includes('AURA_ATK')) c.attack += 1;
              if (totem.sigils.includes('AURA_HP')) {
                c.health += 2;
                if (c.health > (c.maxHealth + 2)) c.health = c.maxHealth + 2;
              }
            }
          });

          if (enemyBoard[idx]?.sigils.includes('INTIMIDAZIONE')) {
            c.attack = Math.max(0, c.attack - 1);
          }
        });
      };

      updateDynamicStats(pBoard, oBoard);
      updateDynamicStats(oBoard, pBoard);

      if (!playerSkips) {
        const activePIndices = pBoard.map((c, i) => (c && c.attack > 0 && !c.sigils.includes('TRAPPOLA') && !c.sigils.includes('GABBIA')) ? i : -1).filter(i => i !== -1);
        setAttackingIndices(prev => ({ ...prev, player: activePIndices }));
        if (activePIndices.length > 0) sounds.playAttack();

        pBoard.forEach((card, i) => {
          if (!card || card.attack <= 0 || card.sigils.includes('TRAPPOLA') || card.sigils.includes('GABBIA')) return;
          const targetIndices = card.sigils.includes('CECCHINO') ? [i - 1, i + 1] : [i];
          targetIndices.forEach(tIdx => {
            if (tIdx < 0 || tIdx >= MAX_SLOTS) return;
            let target = oBoard[tIdx];
            if (card.sigils.includes('DIRETTO') || !target) {
              oHealth -= card.attack;
            } else {
              if (target.isShielded) {
                target.isShielded = false;
                logs.push(`${target.name} para con la corazza!`);
              } else {
                target.health -= card.attack;
                damaged.add(target.id);
                sounds.playDamage();
                if (target.sigils.includes('SPINE')) {
                  card.health -= 1;
                  damaged.add(card.id);
                  logs.push(`Spine di ${target.name} feriscono ${card.name}!`);
                }
                if (target.health <= 0) {
                  if (target.sigils.includes('DETONAZIONE')) {
                    card.health = 0;
                    logs.push(`BOOM! L'esplosione di ${target.name} travolge ${card.name}!`);
                  }
                  if (card.sigils.includes('VAMPIRISMO')) {
                    card.health = Math.min(card.maxHealth, card.health + 1);
                    healed.add(card.id);
                    sounds.playHeal();
                  }
                  if (card.sigils.includes('LADRO') || card.sigils.includes('LADRO_MANO')) {
                    if (pHand.length < MAX_HAND) {
                      const baseCard = CARD_LIBRARY.find(lib => lib.name === target!.name) || BOSS_LIBRARY.find(lib => lib.name === target!.name);
                      if (baseCard) pHand.push(prepareCard(baseCard));
                    }
                  }
                }
                if (card.sigils.includes('VELENO')) target.health = 0;
              }
            }
          });
        });
      }

      const activeOIndices = oBoard.map((c, i) => (c && c.attack > 0 && !c.isStunned) ? i : -1).filter(i => i !== -1);
      setTimeout(() => {
        setAttackingIndices(prev => ({ ...prev, opponent: activeOIndices }));
        if (activeOIndices.length > 0) sounds.playAttack();
      }, 400);

      oBoard.forEach((enemy, i) => {
        if (!enemy || enemy.attack <= 0 || enemy.sigils.includes('TRAPPOLA')) return;
        if (enemy.isStunned) {
           enemy.isStunned = false;
           return;
        }
        const targetIndices = enemy.sigils.includes('CECCHINO') ? [i - 1, i + 1] : [i];
        targetIndices.forEach(tIdx => {
          if (tIdx < 0 || tIdx >= MAX_SLOTS) return;
          const defender = pBoard[tIdx];
          if (defender) {
            if (defender.isShielded) {
              defender.isShielded = false;
            } else {
              defender.health -= enemy.attack;
              damaged.add(defender.id);
              sounds.playDamage();
              if (defender.sigils.includes('SPINE')) {
                enemy.health -= 1;
                damaged.add(enemy.id);
              }
              if (defender.health <= 0) {
                 if (defender.sigils.includes('DETONAZIONE')) enemy.health = 0;
              }
              if (enemy.sigils.includes('VELENO')) defender.health = 0;
            }
          } else {
            pHealth -= enemy.attack;
          }
        });
      });

      setRecentlyDamaged(damaged);
      setRecentlyHealed(healed);
      setTimeout(() => {
        setRecentlyDamaged(new Set());
        setRecentlyHealed(new Set());
      }, 600);
      setTimeout(() => setAttackingIndices({ player: [], opponent: [] }), 800);

      const resolveDeath = (c: Card | null, board: (Card | null)[], idx: number) => {
        if (!c) return null;
        if (c.health <= 0) {
          if (c.sigils.includes('CODA_REAZIONE')) return prepareCard(TOKEN_CODA);
          return null;
        }
        if (c.sigils.includes('EVOLUZIONE') && (c.age || 0) >= 2) {
             const evolved = CARD_LIBRARY.find(lib => lib.name === 'Scarabeo');
             if (evolved) return prepareCard(evolved);
        }
        return c;
      };

      let finalP = pBoard.map((c, i) => resolveDeath(c, pBoard, i));
      let finalO = oBoard.map((c, i) => resolveDeath(c, oBoard, i));

      const handleMovement = (board: (Card | null)[]) => {
        const nextBoard = [...board];
        const moveIndices = nextBoard.map((c, i) => (c && c.sigils.includes('MOVIMENTO_CASUALE') && c.health > 0) ? i : -1).filter(i => i !== -1);
        moveIndices.forEach(idx => {
          const card = nextBoard[idx];
          const emptyIndices = nextBoard.map((c, i) => c === null ? i : -1).filter(i => i !== -1);
          if (emptyIndices.length > 0) {
            const newIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
            nextBoard[newIdx] = card;
            nextBoard[idx] = null;
          }
        });
        return nextBoard;
      };

      finalP = handleMovement(finalP);
      finalO = handleMovement(finalO);

      let deathSeeds = 0;
      pBoard.forEach(c => { if(c && c.health <= 0 && c.sigils.includes('SEMI_MORTE')) deathSeeds += 2; });
      
      let status: any = pHealth <= 0 ? 'PLAYER_LOSS' : (oHealth <= 0 ? 'LEVEL_TRANSITION' : 'PLAYING');
      
      if (status === 'LEVEL_TRANSITION') sounds.playVictory();
      if (status === 'PLAYER_LOSS') sounds.playLoss();

      return {
        ...prev,
        playerBoard: finalP,
        opponentBoard: finalO,
        playerHand: pHand,
        playerHealth: pHealth,
        opponentHealth: oHealth,
        playerSeeds: Math.min(MAX_SEEDS, prev.playerSeeds + 1 + deathSeeds),
        gameStatus: status,
        logs
      };
    });
    executeOpponentTurn();
  }, [executeOpponentTurn, prepareCard]);

  const handleEndTurn = () => {
    if (!gameState.isPlayerTurn || isProcessing) return;
    setGameState(prev => ({ ...prev, isPlayerTurn: false }));
    executeCombat(false);
  };

  const handleSkipAndDraw = () => {
    if (!gameState.isPlayerTurn || isProcessing) return;
    setGameState(prev => ({ ...prev, isPlayerTurn: false }));
    executeCombat(true);
  };

  const handleStartGame = () => {
    sounds.playVictory();
    startLevel(1);
  };

  const handleNextLevel = () => {
    sounds.playVictory();
    startLevel(gameState.currentLevel + 1);
  };

  const selectedCard = selectedHandIndex !== null ? gameState.playerHand[selectedHandIndex] : null;

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-[#050705] forest-gradient overflow-hidden">
      <div className="absolute top-4 right-4 z-[500] flex gap-2">
        <button 
          onClick={() => setAudioEnabled(!audioEnabled)}
          className="p-2 bg-black/60 border border-stone-800 rounded-full hover:bg-stone-800 transition-all text-stone-400"
          title={audioEnabled ? "Disattiva Audio" : "Attiva Audio"}
        >
          {audioEnabled ? '🔊' : '🔇'}
        </button>
      </div>

      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-stone-800 p-4 bg-black/60 flex flex-col z-[150] shrink-0 shadow-2xl">
        <div className="mb-6 space-y-3">
          <div className="text-center mb-4">
             <span className="text-[11px] text-stone-500 font-mystic uppercase tracking-[0.5em]">Capitolo {gameState.currentLevel}</span>
          </div>
          <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded flex justify-between items-center shadow-lg">
             <span className="text-[10px] text-rose-500 uppercase font-mystic tracking-widest">Custode</span>
             <span className="text-3xl font-mystic text-rose-100">{gameState.opponentHealth}</span>
          </div>
          <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded flex justify-between items-center shadow-lg">
             <span className="text-[10px] text-emerald-500 uppercase font-mystic tracking-widest">Viandante</span>
             <span className="text-3xl font-mystic text-emerald-100">{gameState.playerHealth}</span>
          </div>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col border-t border-stone-800 pt-4">
          <div ref={logContainerRef} className="flex-1 overflow-y-auto text-[10px] space-y-2 text-stone-500 scroll-smooth pr-1">
            {gameState.logs.map((l, i) => <p key={i} className="border-l-2 border-stone-800 pl-3 py-0.5 leading-relaxed">{l}</p>)}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative min-h-0">
        {gameState.gameStatus === 'MENU' && (
          <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-[#050705] forest-gradient text-stone-200">
            <div className="p-12 bg-black/40 border border-stone-800 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col items-center space-y-8 max-w-lg text-center">
              <h1 className="text-6xl font-mystic text-emerald-500 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)] tracking-tighter">
                Spiriti della Foresta
              </h1>
              <p className="font-mystic italic text-stone-500 text-sm leading-relaxed">
                "Il Custode ti attende al tavolo delle radici. <br/>
                Ogni spirito ha un prezzo, ogni sacrificio una consequence."
              </p>
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-stone-800 to-transparent my-4" />
              <button 
                onClick={handleStartGame} 
                className="group relative px-12 py-4 font-mystic text-xl overflow-hidden rounded-lg bg-emerald-950 border border-emerald-800 hover:bg-emerald-900 transition-all shadow-[0_0_30px_rgba(16,185,129,0.1)]"
              >
                <span className="relative z-10 uppercase tracking-widest group-hover:text-emerald-300 transition-colors">Inizia il Viaggio</span>
                <div className="absolute inset-0 bg-emerald-400/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              </button>
              <p className="text-[10px] uppercase text-stone-600 tracking-widest font-mystic opacity-50">Ispirato a Inscryption</p>
            </div>
          </div>
        )}

        {gameState.gameStatus === 'LEVEL_TRANSITION' && (
          <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-black/90 backdrop-blur-3xl text-stone-200">
            <div className="p-12 text-center space-y-12 animate-in fade-in zoom-in duration-1000">
               <div className="space-y-2">
                 <h2 className="text-stone-500 font-mystic uppercase tracking-[1em] text-xs">Capitolo {gameState.currentLevel} Completato</h2>
                 <h1 className="text-6xl font-mystic text-emerald-500 drop-shadow-[0_0_30px_rgba(16,185,129,0.2)]">Vittoria nel Bosco</h1>
               </div>
               <div className="max-w-md mx-auto p-6 bg-stone-900/40 border border-stone-800 rounded-lg italic text-stone-400 font-mystic">
                 "{wardenSaying}"
               </div>
               <div className="flex flex-col items-center space-y-4">
                 <button onClick={handleNextLevel} className="px-16 py-4 bg-emerald-950 border border-emerald-800 rounded font-mystic uppercase tracking-[0.3em] hover:bg-emerald-900 transition-all shadow-xl hover:shadow-emerald-500/10">
                   Prosegui nel Profondo
                 </button>
                 <p className="text-[10px] text-stone-600 uppercase font-mystic">Il sentiero si stringe...</p>
               </div>
            </div>
          </div>
        )}

        {gameState.gameStatus === 'PLAYER_LOSS' && (
          <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-black text-white font-mystic space-y-8">
            <h1 className="text-8xl text-rose-900 animate-pulse drop-shadow-[0_0_50px_rgba(153,27,27,0.5)]">OSSIDATO</h1>
            <p className="text-stone-600 italic">"La tua carne nutrirà le radici."</p>
            <button onClick={resetToMenu} className="px-12 py-4 bg-stone-900 border border-stone-700 hover:bg-stone-800 transition-all uppercase tracking-widest text-lg shadow-[0_0_50px_rgba(153,27,27,0.4)]">
              Rinasci
            </button>
          </div>
        )}

        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full text-center pointer-events-none z-[200]">
           <p className="text-stone-300 font-mystic text-sm md:text-base italic opacity-90 px-8 drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">"{wardenSaying}"</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-2 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] overflow-hidden pb-16">
           <div className="flex gap-2 mb-4 p-2 bg-stone-950/60 rounded border border-stone-800 shadow-2xl z-[50]">
              {gameState.opponentQueue.map((c, i) => (
                <div key={`q-wrap-${i}`} className="opacity-40 scale-[0.55] transition-all">
                  <BoardSlot 
                    card={c} 
                    isOpponent 
                    isQueue 
                    isDamaged={c ? recentlyDamaged.has(c.id) : false}
                    isHealed={c ? recentlyHealed.has(c.id) : false}
                  />
                </div>
              ))}
           </div>

           <div className="flex gap-4 z-[60]">
              {gameState.opponentBoard.map((c, i) => (
                <div key={`o-wrap-${i}`} className={`${attackingIndices.opponent.includes(i) ? 'animate-attack-o' : ''} ${c?.type === CardType.SPECIAL ? 'animate-shake' : ''}`}>
                    <BoardSlot 
                        card={c} 
                        isOpponent 
                        canPlace={(selectedCard?.sigils.includes('TRAPPOLA') || selectedCard?.sigils.includes('GABBIA')) && !c}
                        onClick={() => handlePlayCard(i, 'OPPONENT')}
                        isDamaged={c ? recentlyDamaged.has(c.id) : false}
                        isHealed={c ? recentlyHealed.has(c.id) : false}
                    />
                </div>
              ))}
           </div>

           <div className="w-full max-w-2xl h-[2px] bg-gradient-to-r from-transparent via-stone-800/60 to-transparent shadow-2xl my-6 z-[40]" />

           <div className="flex gap-4 -mt-20 mb-16 z-[70]">
              {gameState.playerBoard.map((c, i) => (
                <div key={`p-wrap-${i}`} className={attackingIndices.player.includes(i) ? 'animate-attack-p' : ''}>
                    <BoardSlot 
                        card={c} 
                        canPlace={(selectedCard && !selectedCard.sigils.includes('TRAPPOLA') && !selectedCard.sigils.includes('GABBIA') && !c) || (selectedCard?.name === 'Totem Lupacchiotto' && c !== null)} 
                        onClick={() => handlePlayCard(i, 'PLAYER')} 
                        isDamaged={c ? recentlyDamaged.has(c.id) : false}
                        isHealed={c ? recentlyHealed.has(c.id) : false}
                    />
                </div>
              ))}
           </div>
        </div>

        <div className="h-48 md:h-52 bg-[#080808] border-t border-stone-800 p-2 flex flex-col items-center relative z-[150] shrink-0 shadow-[0_-30px_60px_rgba(0,0,0,1)]">
           <div className="w-full max-w-5xl flex justify-between items-center mb-2 px-10">
              <div className="flex items-center gap-3">
                 <div className="flex items-center gap-2 bg-emerald-950/40 px-5 py-1.5 rounded-full border border-emerald-900/60 shadow-inner">
                    <span className="text-emerald-500 text-xl">🌱</span>
                    <span className="text-2xl font-mystic text-emerald-400">{gameState.playerSeeds}</span>
                 </div>
              </div>
              <div className="flex gap-3">
                 <button onClick={handleSacrifice} disabled={selectedHandIndex === null || isProcessing} className="px-5 py-1.5 bg-rose-950/80 border border-rose-800 text-rose-100 text-[11px] font-mystic uppercase rounded hover:bg-rose-900 transition-all disabled:opacity-20 shadow-lg">Sacrifica</button>
                 <button onClick={handleSkipAndDraw} disabled={!gameState.isPlayerTurn || isProcessing} className="px-5 py-1.5 bg-stone-900 border border-stone-800 text-stone-400 text-[11px] font-mystic uppercase rounded hover:bg-stone-800 transition-all shadow-lg">Passa & Pesca</button>
                 <button onClick={handleEndTurn} disabled={!gameState.isPlayerTurn || isProcessing} className="px-12 py-1.5 bg-emerald-950 border border-emerald-800 font-mystic hover:bg-emerald-800 text-stone-100 text-[12px] uppercase tracking-widest rounded disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                   {isProcessing ? '...' : 'Attacca'}
                 </button>
              </div>
           </div>
           
           <div className="flex-1 w-full flex justify-center items-end gap-3 overflow-visible pb-3 px-10">
              {gameState.playerHand.map((c, i) => (
                <div key={c.id} className="relative transition-transform hover:-translate-y-8 z-[160]">
                  <CardComponent 
                    card={c} 
                    isSelected={selectedHandIndex === i} 
                    onClick={() => {
                      setSelectedHandIndex(selectedHandIndex === i ? null : i);
                      if (selectedHandIndex !== i) sounds.playCard();
                    }} 
                    isDamaged={recentlyDamaged.has(c.id)}
                    isHealed={recentlyHealed.has(c.id)}
                  />
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;
