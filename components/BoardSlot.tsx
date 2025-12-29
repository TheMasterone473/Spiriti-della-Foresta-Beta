
import React from 'react';
import { Card } from '../types';
import { CardComponent } from './CardComponent';

interface BoardSlotProps {
  card: Card | null;
  isOpponent?: boolean;
  isQueue?: boolean;
  onClick?: () => void;
  canPlace?: boolean;
  canSacrifice?: boolean;
  isDamaged?: boolean;
  isHealed?: boolean;
}

export const BoardSlot: React.FC<BoardSlotProps> = ({ 
  card, 
  isOpponent, 
  isQueue, 
  onClick, 
  canPlace, 
  canSacrifice,
  isDamaged,
  isHealed
}) => {
  return (
    <div 
      onClick={onClick}
      className={`
        w-28 h-40 md:w-32 md:h-48 border-2 border-dashed rounded-sm flex items-center justify-center transition-all duration-300 overflow-visible
        ${isQueue ? 'opacity-40 scale-90 border-stone-800' : 'border-stone-800/40'}
        ${canPlace ? (isOpponent ? 'border-purple-600/50 bg-purple-900/10 cursor-pointer' : 'border-green-600/50 bg-green-900/10 cursor-pointer') : ''}
        ${canSacrifice ? 'border-red-600/50 bg-red-900/10 cursor-pointer hover:bg-red-900/20' : ''}
        ${!card && !canPlace && !canSacrifice ? 'bg-black/20' : ''}
        relative group z-10
      `}
    >
      {card ? (
        <CardComponent 
          card={card} 
          isSacrificable={canSacrifice} 
          disabled={isQueue}
          isOpponent={isOpponent}
          isDamaged={isDamaged}
          isHealed={isHealed}
          onClick={onClick}
        />
      ) : (
        <div className="text-stone-800 font-mystic text-2xl select-none opacity-20 group-hover:opacity-40 transition-opacity">
          {isOpponent ? (isQueue ? '👁️' : '💀') : '🌲'}
        </div>
      )}
      
      {canPlace && !card && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`w-12 h-12 border-2 rounded-full animate-ping ${isOpponent ? 'border-purple-500/50' : 'border-green-500/50'}`}></div>
          <span className={`text-[10px] font-mystic uppercase ${isOpponent ? 'text-purple-400' : 'text-green-400'}`}>
            {isOpponent ? 'Piazza' : 'Piazza'}
          </span>
        </div>
      )}
    </div>
  );
};
