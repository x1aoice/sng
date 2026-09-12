import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { Player } from '../engine/types';
import { Trophy, Award } from 'lucide-react';
import { formatTokens } from '../utils/format';
import { PlayerAvatar } from './Avatars';
import { PAYOUT_FIRST_PLACE, PAYOUT_SECOND_PLACE } from '../engine/gameEngine';

interface GameOverModalProps {
  players: Player[];
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  players,
  onRestart,
}) => {
  const sortedByRank = [...players].sort((a, b) => {
    const rankA = a.finishRank || (a.chips > 0 ? 1 : 99);
    const rankB = b.finishRank || (b.chips > 0 ? 1 : 99);
    return rankA - rankB;
  });

  const winner = sortedByRank[0];
  const isHeroWinner = winner?.isUser;
  const heroPlayer = players.find((p) => p.isUser);
  const heroRank = heroPlayer?.finishRank || (heroPlayer?.chips && heroPlayer.chips > 0 ? 1 : 99);

  useEffect(() => {
    if (isHeroWinner) {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti fallback
      }
    }
  }, [isHeroWinner]);

  return (
    <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
      <div
        className="bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center"
        style={{ boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)' }}
      >
        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 mb-4 shadow-sm">
          {isHeroWinner ? <Trophy className="w-7 h-7" /> : <Award className="w-7 h-7" />}
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-neutral-900">锦标赛结束</h2>
        <p className="text-xs text-neutral-500 mt-1 mb-6">
          {isHeroWinner
            ? `🎉 恭喜斩获冠军！赢得 ${formatTokens(PAYOUT_FIRST_PLACE)} 巨额奖金！`
            : heroRank === 2
            ? `🥈 获得亚军！赢得 ${formatTokens(PAYOUT_SECOND_PLACE)} 奖金！`
            : `你获得了第 ${heroRank} 名。${winner?.name || '冠军'} 斩获第一名 (${formatTokens(PAYOUT_FIRST_PLACE)})。`}
        </p>

        {/* Final Standings Table */}
        <div className="w-full space-y-2 mb-6">
          {sortedByRank.map((p, idx) => {
            const rank = idx + 1;
            const isWinner = rank === 1;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs ${
                  p.isUser
                    ? 'bg-blue-50/80 border border-blue-200/80 font-medium text-blue-900'
                    : isWinner
                    ? 'bg-amber-50/60 border border-amber-200/60 text-neutral-800'
                    : 'bg-neutral-50 border border-neutral-100 text-neutral-600'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                      isWinner
                        ? 'bg-amber-400 text-white'
                        : rank === 2
                        ? 'bg-neutral-300 text-neutral-700'
                        : rank === 3
                        ? 'bg-amber-700/60 text-white'
                        : 'text-neutral-400'
                    }`}
                  >
                    {rank}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                      <PlayerAvatar name={p.name} />
                    </div>
                    <span className="font-semibold">{p.name}</span>
                    {p.isUser && (
                      <span className="text-[10px] text-blue-600 font-bold bg-blue-100/60 px-1.5 py-0.2 rounded-full">
                        YOU
                      </span>
                    )}
                  </div>
                </div>

                <div className="font-semibold text-right">
                  {rank === 1 ? (
                    <span className="text-amber-600 font-bold">+{formatTokens(PAYOUT_FIRST_PLACE)}</span>
                  ) : rank === 2 ? (
                    <span className="text-neutral-700 font-medium">+{formatTokens(PAYOUT_SECOND_PLACE)}</span>
                  ) : (
                    <span className="text-neutral-400 font-normal">Eliminated</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Play Again Button */}
        <button
          type="button"
          onClick={onRestart}
          className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold rounded-full shadow-md active:scale-98 transition-all cursor-pointer"
        >
          再来一局 (Play Again)
        </button>
      </div>
    </div>
  );
};

