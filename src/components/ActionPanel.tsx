import React, { useState, useEffect, useRef } from 'react';
import type { Player, ActionType } from '../engine/types';
import { formatCurrency } from '../utils/format';

interface ActionPanelProps {
  hero: Player;
  pot: number;
  currentHighestBet: number;
  minRaiseAmount: number;
  isHeroTurn: boolean;
  onAction: (action: ActionType, amount?: number) => void;
  gamePhase: string;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  hero,
  pot,
  currentHighestBet,
  minRaiseAmount,
  isHeroTurn,
  onAction,
  gamePhase,
}) => {
  const toCall = currentHighestBet - hero.currentBet;
  const canCheck = toCall <= 0;
  const minBet = canCheck
    ? Math.min(hero.chips, Math.max(minRaiseAmount, 100_000))
    : Math.min(hero.chips, currentHighestBet + minRaiseAmount);
  const maxBet = hero.chips + hero.currentBet;

  const [showSlider, setShowSlider] = useState<boolean>(false);
  const [sliderAmount, setSliderAmount] = useState<number>(minBet);

  const panelRef = useRef<HTMLDivElement>(null);

  // Is Hero currently allowed to act?
  const isDisabled =
    !isHeroTurn ||
    gamePhase === 'hand_ended' ||
    gamePhase === 'idle' ||
    hero.folded ||
    hero.eliminated;

  // Auto-close slider when disabled
  useEffect(() => {
    if (isDisabled) {
      setShowSlider(false);
    }
  }, [isDisabled, gamePhase]);

  // Click outside blank area to close slider
  useEffect(() => {
    if (!showSlider) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowSlider(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [showSlider]);

  // Generate standard pot fraction milestones along the slider track (matching reference image)
  const getMilestones = () => {
    const basePot = Math.max(pot, minBet * 2);
    const p33 = Math.max(minBet, Math.round(basePot * 0.33));
    const p50 = Math.max(p33 + 10_000, Math.round(basePot * 0.50));
    const p75 = Math.max(p50 + 10_000, Math.round(basePot * 0.75));

    const steps = [
      { id: 'min', label: 'Min', sublabel: 'Min', pct: 0, amount: minBet },
      { id: '33', label: '1/3', sublabel: '1/3 Pot', pct: 25, amount: Math.min(maxBet, p33) },
      { id: '50', label: '1/2', sublabel: '1/2 Pot', pct: 50, amount: Math.min(maxBet, p50) },
      { id: '75', label: '3/4', sublabel: '3/4 Pot', pct: 75, amount: Math.min(maxBet, p75) },
      { id: 'allin', label: 'All-in', sublabel: 'All-in', pct: 100, amount: maxBet },
    ];

    for (let i = 1; i < steps.length; i++) {
      if (steps[i].amount <= steps[i - 1].amount && steps[i - 1].amount < maxBet) {
        steps[i].amount = Math.min(
          maxBet,
          steps[i - 1].amount + Math.max(10_000, Math.round((maxBet - minBet) * 0.05))
        );
      }
    }
    return steps;
  };

  const milestones = getMilestones();
  const interiorDots = milestones.filter((m) => m.pct > 0 && m.pct < 100);

  const percentToAmount = (pct: number, steps = milestones) => {
    const clamped = Math.max(0, Math.min(100, pct));
    // Check if directly matched to a milestone dot
    for (const s of steps) {
      if (Math.abs(clamped - s.pct) < 0.01) {
        return s.amount;
      }
    }

    for (let i = 0; i < steps.length - 1; i++) {
      if (clamped >= steps[i].pct && clamped <= steps[i + 1].pct) {
        const span = steps[i + 1].pct - steps[i].pct;
        const frac = span === 0 ? 0 : (clamped - steps[i].pct) / span;
        const startAmount = steps[i].amount;
        const endAmount = steps[i + 1].amount;
        const raw = startAmount + (endAmount - startAmount) * frac;

        let stepSize = 10_000;
        if (raw > 5_000_000) stepSize = 100_000;
        else if (raw > 1_000_000) stepSize = 50_000;
        else if (raw > 500_000) stepSize = 25_000;

        const rounded = Math.round(raw / stepSize) * stepSize;
        return Math.max(steps[0].amount, Math.min(steps[steps.length - 1].amount, rounded));
      }
    }
    return steps[steps.length - 1].amount;
  };

  const [sliderPercent, setSliderPercent] = useState<number>(50);

  // Recalculate default slider amount when turn changes or pot changes (default 1/2 Pot)
  useEffect(() => {
    const steps = getMilestones();
    const defaultPct = 50; // 1/2 Pot
    setSliderPercent(defaultPct);
    setSliderAmount(steps[2].amount);
  }, [pot, minBet, maxBet, isHeroTurn]);

  const isAllIn = sliderAmount >= maxBet || sliderAmount >= hero.chips;
  const actionBaseName = canCheck ? 'Bet' : 'Raise';

  const handleBlackButtonClick = () => {
    if (isDisabled) return;
    if (!showSlider) {
      setShowSlider(true);
    } else {
      if (isAllIn) {
        onAction('allin', hero.chips);
      } else {
        onAction(canCheck ? 'bet' : 'raise', sliderAmount);
      }
      setShowSlider(false);
    }
  };

  return (
    <div
      ref={panelRef}
      className={`relative flex flex-col items-center select-none transition-all duration-300 ${
        isDisabled ? 'opacity-35 pointer-events-none cursor-not-allowed' : 'opacity-100'
      }`}
    >
      {/* Interactive Slider Pill: EXACT style matching reference image */}
      {showSlider && !isDisabled && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3.5 flex items-center bg-white px-3 py-1.5 rounded-full border border-neutral-200/90 shadow-[0_8px_24px_rgba(0,0,0,0.09)] animate-fade-in z-40 select-none"
        >
          {/* Slider Box */}
          <div className="relative w-52 sm:w-60 h-[28px] flex items-center select-none">
            {/* The visual track (chunky rounded pill in #e8e8ed) */}
            <div className="relative w-full h-[22px] rounded-full bg-[#e8e8ed] overflow-hidden">
              {/* Blue fill (vibrant iOS blue #3a83f7) */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-[#3a83f7] rounded-l-full pointer-events-none"
                style={{
                  width:
                    sliderPercent >= 98
                      ? '100%'
                      : `calc(11px + (100% - 22px) * ${sliderPercent / 100})`,
                }}
              />

              {/* 3 standard interior dots (1/3 Pot, 1/2 Pot, 3/4 Pot) */}
              {interiorDots.map((m) => {
                const isPassed = sliderPercent >= m.pct;
                return (
                  <div
                    key={m.id}
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full pointer-events-none transition-colors duration-150 ${
                      isPassed ? 'bg-white/75' : 'bg-[#9ca3af]'
                    }`}
                    style={{ left: `calc(11px + (100% - 22px) * ${m.pct / 100})` }}
                  />
                );
              })}
            </div>

            {/* Circular white thumb with soft elevation shadow */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white shadow-[0_2px_7px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.12),0_0_1px_rgba(0,0,0,0.15)] border border-black/[0.04] pointer-events-none z-20 transition-transform active:scale-105"
              style={{ left: `calc(11px + (100% - 22px) * ${sliderPercent / 100})` }}
            />

            {/* Invisible native range input overlay for seamless drag / touch */}
            <input
              type="range"
              min={0}
              max={100}
              step={0.2}
              value={sliderPercent}
              onChange={(e) => {
                let val = Number(e.target.value);
                // Gentle snap to nearest milestone dot when within 2.5%
                for (const m of milestones) {
                  if (Math.abs(val - m.pct) <= 2.5) {
                    val = m.pct;
                    break;
                  }
                }
                setSliderPercent(val);
                const amt = percentToAmount(val);
                setSliderAmount(amt);
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
            />
          </div>
        </div>
      )}

      {/* Main Action Buttons (Fold, Check/Call, Bet/Raise) - FIXED IN PLACE */}
      <div
        className="flex items-center gap-2 bg-white/95 p-1.5 rounded-full border border-neutral-200/90 shadow-sm"
        style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}
      >
        {/* Fold Button */}
        <button
          type="button"
          disabled={isDisabled}
          onClick={() => {
            setShowSlider(false);
            onAction('fold');
          }}
          className="px-6 py-2 rounded-full text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          Fold
        </button>

        {/* Check or Call Button */}
        {canCheck ? (
          <button
            type="button"
            disabled={isDisabled}
            onClick={() => {
              setShowSlider(false);
              onAction('check');
            }}
            className="px-6 py-2 rounded-full text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 border border-transparent hover:border-neutral-200 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            Check
          </button>
        ) : (
          <button
            type="button"
            disabled={isDisabled}
            onClick={() => {
              setShowSlider(false);
              onAction('call');
            }}
            className="px-6 py-2 rounded-full text-xs font-semibold text-neutral-800 hover:text-neutral-950 hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            Call {formatCurrency(toCall)}
          </button>
        )}

        {/* Primary Bet / Raise Button (Dark pill) */}
        <button
          type="button"
          disabled={isDisabled}
          onClick={handleBlackButtonClick}
          className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full text-xs font-semibold shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
        >
          {showSlider ? (
            <>
              <span>{isAllIn ? 'All-in' : actionBaseName}</span>
              <span>{formatCurrency(sliderAmount)}</span>
            </>
          ) : (
            <span>{actionBaseName}</span>
          )}
        </button>
      </div>
    </div>
  );
};
