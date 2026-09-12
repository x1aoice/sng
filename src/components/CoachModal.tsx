import React, { useState, useEffect } from 'react';
import type { Player, Card } from '../engine/types';
import { formatCurrency } from '../utils/format';
import { generateCoachAdvice, type LLMConfig } from '../services/llmService';

interface CoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  hero: Player;
  communityCards: Card[];
  phase: string;
  pot: number;
  currentHighestBet: number;
  minRaiseAmount: number;
  config: LLMConfig;
}

export const CoachModal: React.FC<CoachModalProps> = ({
  isOpen,
  onClose,
  hero,
  communityCards,
  phase,
  pot,
  currentHighestBet,
  minRaiseAmount,
  config,
}) => {
  const [advice, setAdvice] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const toCall = Math.max(0, currentHighestBet - hero.currentBet);
  const bbSize = minRaiseAmount > 0 ? minRaiseAmount : 1;
  const bbCount = hero.chips / bbSize;

  const heroCardsStr = hero.cards.map((c) => `${c.rank}${c.suit}`).join(' ');
  const commCardsStr = communityCards.map((c) => `${c.rank}${c.suit}`).join(' ');

  const fetchAdvice = async () => {
    setIsLoading(true);
    const text = await generateCoachAdvice(
      heroCardsStr || '无',
      commCardsStr,
      phase,
      formatCurrency(pot),
      formatCurrency(toCall),
      formatCurrency(heroChips),
      bbCount,
      config
    );
    setAdvice(text);
    setIsLoading(false);
  };

  const heroChips = hero.chips;

  useEffect(() => {
    if (isOpen) {
      fetchAdvice();
    }
  }, [isOpen, phase, currentHighestBet, pot]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200 select-none">
      <div
        className="w-full max-w-[440px] bg-white rounded-3xl p-6 shadow-2xl border border-neutral-200/80 flex flex-col text-neutral-900"
        style={{
          boxShadow: '0 20px 50px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧠</span>
            <div>
              <h3 className="text-[15px] font-bold tracking-tight text-neutral-900">
                AI 德州大师实时教练
              </h3>
              <p className="text-[11px] text-neutral-400">
                基于急速 SNG 结构与短码 GTO 理论推演
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Current Table Spot Card */}
        <div className="grid grid-cols-3 gap-2 my-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-100 text-center">
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider">我的手牌</span>
            <span className="text-sm font-bold text-neutral-800 tracking-wide mt-0.5">
              {heroCardsStr || '无'}
            </span>
          </div>
          <div className="flex flex-col border-x border-neutral-200/60">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider">筹码深度</span>
            <span className="text-sm font-bold text-sky-600 mt-0.5">
              {bbCount.toFixed(1)} BB
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider">跟注需付</span>
            <span className="text-sm font-bold text-neutral-800 mt-0.5">
              {toCall > 0 ? formatCurrency(toCall) : '免费看牌'}
            </span>
          </div>
        </div>

        {/* AI Advice Body */}
        <div className="flex flex-col min-h-[120px] p-3.5 rounded-2xl bg-neutral-900 text-white text-xs leading-relaxed">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <span className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              GTO 策略建议
            </span>
            <button
              onClick={fetchAdvice}
              disabled={isLoading}
              className="text-[11px] text-neutral-400 hover:text-white transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
            >
              <span>↻</span>
              <span>重新推演</span>
            </button>
          </div>

          <div className="pt-2.5">
            {isLoading ? (
              <div className="flex items-center gap-2 text-neutral-400 py-4">
                <span className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                <span>正在向 LLM 询问最佳策略...</span>
              </div>
            ) : (
              <p className="whitespace-pre-line text-neutral-200 text-[12px] font-normal leading-relaxed">
                {advice}
              </p>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between pt-3 text-[11px] text-neutral-400">
          <span>模型: {config.model || 'deepseek-chat'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold rounded-xl transition-all cursor-pointer"
          >
            明白
          </button>
        </div>
      </div>
    </div>
  );
};
