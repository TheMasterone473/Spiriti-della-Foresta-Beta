
import React from 'react';
import { Card, CardType, Sigil } from '../types';

interface CardProps {
  card: Card;
  onClick?: () => void;
  isSelected?: boolean;
  disabled?: boolean;
  isSacrificable?: boolean;
  isAttacking?: boolean;
  isDamaged?: boolean;
  isHealed?: boolean;
  isOpponent?: boolean;
}

const getSigilDetails = (sigil: Sigil): { icon: string; label: string; desc: string } => {
  switch(sigil) {
    case 'DIRETTO': return { icon: '🎯', label: 'Diretto', desc: 'Attacca direttamente il giocatore ignorando i nemici.' };
    case 'EVOLUZIONE': return { icon: '🥚', label: 'Evoluzione', desc: 'Si trasforma dopo un turno.' };
    case 'SPINE': return { icon: '🌵', label: 'Spine', desc: 'Ritorna 1 danno a chi lo attacca.' };
    case 'PARATA': return { icon: '🛡️', label: 'Parata', desc: 'Si sposta per bloccare gli attacchi diretti.' };
    case 'VELENO': return { icon: '🐍', label: 'Veleno', desc: 'Uccide istantaneamente chi colpisce.' };
    case 'SEMI_MORTE': return { icon: '💎', label: 'Dono', desc: 'Rilascia 2 semi alla morte.' };
    case 'CORAZZA': return { icon: '🐚', label: 'Corazza', desc: 'Annulla il primo attacco ricevuto.' };
    case 'VOLO': return { icon: '🦇', label: 'Volo', desc: 'Aura di leggerezza.' };
    case 'CECCHINO': return { icon: '🏹', label: 'Cecchino', desc: 'Attacca lateralmente invece che frontalmente.' };
    case 'BARRIERA': return { icon: '🚧', label: 'Barriera', desc: 'Crea muri protettivi.' };
    case 'TRAPPOLA': return { icon: '🪤', label: 'Trappola', desc: 'Piazzala sul campo nemico.' };
    case 'CURA': return { icon: '🍵', label: 'Rugiada', desc: 'Cura 1 HP agli alleati a ogni turno.' };
    case 'GABBIA': return { icon: '🕸️', label: 'Gabbia', desc: 'Impedisce al nemico davanti di attaccare.' };
    case 'CODA_REAZIONE': return { icon: '🦎', label: 'Muta', desc: 'Lascia una coda se viene distrutta.' };
    case 'AURA_ATK': return { icon: '🐺', label: 'Aura Lupo', desc: 'Fornisce +1 Atk agli alleati adiacenti.' };
    case 'AURA_HP': return { icon: '🐻', label: 'Aura Orso', desc: 'Fornisce +2 HP agli alleati adiacenti.' };
    case 'LADRO': return { icon: '🦊', label: 'Ladro', desc: 'Ruba lo spirito del nemico sconfitto portandolo in mano.' };
    case 'LADRO_MANO': return { icon: '🦅', label: 'Rapitore', desc: 'Aggiunge il nemico sconfitto alla tua mano.' };
    case 'FORZA_BRANCO': return { icon: '🐜', label: 'Brancomente', desc: 'Attacco pari al numero di Formiche alleate in campo.' };
    case 'VAMPIRISMO': return { icon: '🧛', label: 'Vampirismo', desc: 'Recupera 1 HP quando abbatte un nemico.' };
    case 'ESALAZIONE': return { icon: '💨', label: 'Esalazione', desc: 'Dona +1 Atk alle carte adiacenti alla morte.' };
    case 'DETONAZIONE': return { icon: '💥', label: 'Detonazione', desc: 'Distrugge istantaneamente chi sconfigge questa carta.' };
    case 'BARRIERA_COLLETTIVA': return { icon: '🏗️', label: 'Barriera', desc: 'Dona +2 HP massimi e attuali a tutti gli altri alleati in campo al momento dello schieramento.' };
    case 'MOVIMENTO_CASUALE': return { icon: '🌀', label: 'Marea', desc: 'Si sposta casualmente in una casella libera dopo aver sferrato un attacco.' };
    default: return { icon: '✨', label: 'Antico', desc: 'Potere della foresta.' };
  }
};

export const CardComponent: React.FC<CardProps> = ({ 
  card, onClick, isSelected, disabled, isSacrificable, isAttacking, isDamaged, isHealed, isOpponent 
}) => {
  const isBoss = card.type === CardType.SPECIAL;
  const isObstacle = card.type === CardType.OBSTACLE;

  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled && onClick) onClick();
      }}
      className={`
        relative w-28 h-40 md:w-32 md:h-48 border-2 rounded-sm cursor-pointer transition-all duration-300 flex flex-col group overflow-visible
        ${isSelected 
          ? 'scale-110 -translate-y-6 border-emerald-400 z-[450] ring-4 ring-emerald-500/20 bg-[#151a15]' 
          : 'border-stone-800 bg-[#0c0e0c] hover:-translate-y-2 hover:border-stone-500 hover:z-[400] shadow-2xl'}
        ${isSacrificable ? 'border-rose-500 ring-2 ring-rose-500/30 animate-pulse' : ''}
        ${isAttacking ? 'z-[500]' : ''}
        ${isDamaged ? 'damage-flash' : ''}
        ${isHealed ? 'heal-flash' : ''}
        ${disabled ? 'opacity-90' : ''}
        ${isBoss ? 'shadow-[0_0_20px_rgba(153,27,27,0.4)] border-rose-900 scale-105' : ''}
        ${isObstacle ? 'border-stone-700 bg-stone-900/20 shadow-inner' : ''}
      `}
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')]"></div>

      {(isBoss || isObstacle) && (
        <div className={`absolute inset-0 animate-pulse pointer-events-none rounded-sm ${isBoss ? 'bg-rose-900/10' : 'bg-stone-500/5'}`}></div>
      )}

      <div className={`
        absolute bottom-full left-1/2 -translate-x-1/2 mb-6 w-56 p-4 bg-[#0a0a0a]/95 border-2 border-stone-700 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.9)] opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-[600] backdrop-blur-md
        scale-90 md:scale-100 transform origin-bottom
      `}>
        <div className={`absolute left-1/2 -translate-x-1/2 -bottom-2 w-3 h-3 bg-[#0a0a0a] border-r-2 border-b-2 border-stone-700 transform rotate-45`}></div>

        <div className="flex justify-between items-start mb-3 border-b border-stone-800 pb-2">
           <div className="pr-2">
              <p className={`text-[12px] font-mystic leading-none mb-1 ${isBoss ? 'text-rose-500' : (isObstacle ? 'text-stone-400' : 'text-emerald-400')}`}>{card.name}</p>
              <p className="text-[8px] text-stone-500 uppercase tracking-[0.2em]">{isBoss ? 'ENTITÀ ANTICA' : card.type}</p>
           </div>
           <div className="flex gap-3 font-mystic shrink-0">
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-stone-600 uppercase">Atk</span>
                <span className="text-rose-500 text-sm font-bold">{card.attack}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-stone-600 uppercase">Hp</span>
                <span className="text-emerald-500 text-sm font-bold">{card.health}</span>
              </div>
           </div>
        </div>
        
        <p className="text-[11px] text-stone-300 italic leading-relaxed mb-4 font-serif">"{card.description}"</p>
        
        {card.sigils.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-stone-900">
            {card.sigils.map(s => {
              const details = getSigilDetails(s);
              return (
                <div key={s} className="flex gap-3 items-start">
                  <span className="text-lg bg-stone-900/80 p-1.5 rounded-sm border border-stone-800 shadow-inner shrink-0">{details.icon}</span>
                  <div className="flex flex-col">
                    <p className="text-[10px] font-bold text-stone-200 uppercase tracking-wider leading-none mb-1">{details.label}</p>
                    <p className="text-[9px] text-stone-500 leading-tight">{details.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={`p-1.5 flex justify-between items-center border-b shrink-0 z-10 ${isBoss ? 'bg-rose-950/40 border-rose-900/60' : (isObstacle ? 'bg-stone-800/40 border-stone-700/60' : 'bg-stone-900/40 border-stone-800/60')}`}>
        <span className={`text-[9px] font-mystic truncate uppercase tracking-tighter ${isBoss ? 'text-rose-200' : 'text-stone-300'}`}>{card.name}</span>
        <div className="flex gap-0.5 shrink-0">
          {Array.from({ length: Math.min(card.cost, 5) }).map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.5)] ${isBoss ? 'bg-rose-600' : (isObstacle ? 'bg-stone-600' : 'bg-emerald-600/80')}`}></div>
          ))}
        </div>
      </div>

      <div className={`flex-1 relative flex items-center justify-center transition-colors overflow-hidden ${isBoss ? 'bg-rose-950/20 group-hover:bg-rose-900/30' : (isObstacle ? 'bg-stone-950/40 group-hover:bg-stone-900/40' : 'bg-stone-950/20 group-hover:bg-stone-900/10')}`}>
        <div className={`w-16 h-16 md:w-20 md:h-20 transition-opacity ${isBoss ? 'opacity-60 scale-110' : 'opacity-30 group-hover:opacity-50'} ${isObstacle ? 'brightness-50' : ''}`}>
            <img 
                src={card.imageUrl} 
                className={`w-full h-full object-contain filter grayscale brightness-125 ${isBoss ? 'drop-shadow-[0_0_15px_rgba(153,27,27,0.6)]' : 'drop-shadow-[0_0_8px_rgba(209,213,219,0.1)]'}`} 
                alt={card.name} 
            />
        </div>
        <div className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent ${isBoss ? 'from-rose-950/60' : (isObstacle ? 'from-stone-900/60' : 'from-black/60')}`}></div>
        <div className="absolute bottom-1 right-1 flex flex-wrap gap-1 justify-end z-20">
          {card.sigils.map((s, i) => (
            <div key={i} className="bg-black/60 border border-stone-800 rounded px-1 py-0.5 text-[9px] shadow-lg">
              {getSigilDetails(s).icon}
            </div>
          ))}
        </div>
      </div>

      <div className={`p-1.5 flex justify-between items-center font-mystic border-t shrink-0 z-10 ${isBoss ? 'bg-rose-950/60 border-rose-900/60' : (isObstacle ? 'bg-stone-800/60 border-stone-700/60' : 'bg-stone-900/60 border-stone-800/60')}`}>
        <div className="flex items-center gap-1.5">
          <span className="text-rose-600 text-[10px]">⚔️</span>
          <span className="text-stone-100 text-sm font-bold">{card.attack}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-600 text-[10px]">🩸</span>
          <span className="text-stone-100 text-sm font-bold">{card.health}</span>
        </div>
      </div>

      {card.isStunned && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-30">
          <div className="text-4xl">🕸️</div>
        </div>
      )}
      
      {card.isShielded && (
        <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-sm pointer-events-none shadow-[inset_0_0_15px_rgba(16,185,129,0.2)] z-30"></div>
      )}
    </div>
  );
};
