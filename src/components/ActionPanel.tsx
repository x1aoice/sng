import React, { useState, useEffect, useRef } from 'react';
import type { Player, ActionType } from '../engine/types';
import { formatCurrency } from '../utils/format';
import { getBettingBounds, isAllInTarget } from '../utils/betting';
import { sound } from '../utils/sound';

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
  const {
    maxTarget: maxBet,
    minTarget: minBet,
    canIncreaseBet,
  } = getBettingBounds(hero, currentHighestBet, minRaiseAmount);

  const [showSlider, setShowSlider] = useState<boolean>(false);
  const [sliderAmount, setSliderAmount] = useState<number>(minBet);

  const panelRef = useRef<HTMLDivElement>(null);

  // Is Hero currently allowed to act?
  const isDisabled =
    !isHeroTurn ||
    gamePhase === 'hand_ended' ||
    gamePhase === 'idle' ||
    hero.folded ||
    hero.isAllIn ||
    hero.eliminated;

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

  const [sliderPercent, setSliderPercent] = useState<number>(0);

  const isAllIn = isAllInTarget(sliderAmount, maxBet);
  const actionBaseName = canCheck ? 'Bet' : 'Raise';

  // Dramatic sound & haptic feedback when pulling all the way to All-In
  const prevIsAllInRef = useRef(false);
  useEffect(() => {
    if (isAllIn && !prevIsAllInRef.current && showSlider) {
      sound.playAllIn();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([25, 40, 25]);
        } catch {
          // ignore
        }
      }
    }
    prevIsAllInRef.current = isAllIn;
  }, [isAllIn, showSlider]);

  const handleBlackButtonClick = () => {
    if (isDisabled) return;
    if (!showSlider) {
      const defaultPercent = 0;
      setSliderPercent(defaultPercent);
      setSliderAmount(milestones[0].amount);
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
      {/* Interactive Slider Pill: Red gradient track with All-In fiery effects */}
      {showSlider && !isDisabled && (
        <div
          className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3.5 flex items-center bg-white px-3 py-1.5 rounded-full border transition-all duration-300 z-40 select-none ${
            isAllIn
              ? 'border-rose-400 shadow-[0_0_24px_rgba(239,68,68,0.35),0_8px_24px_rgba(0,0,0,0.1)] allin-container-glow'
              : 'border-neutral-200/90 shadow-[0_8px_24px_rgba(0,0,0,0.09)]'
          } animate-fade-in`}
        >
          {/* Floating All-In Tag with Flame */}
          {isAllIn && (
            <div className="absolute -top-7 right-2 bg-gradient-to-r from-rose-600 via-red-600 to-amber-500 text-white font-black text-[10px] tracking-wider px-2 py-0.5 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.7)] flex items-center gap-1 animate-bounce pointer-events-none select-none">
              <span>🔥</span>
              <span>ALL IN</span>
            </div>
          )}

          {/* Slider Box */}
          <div className="relative w-52 sm:w-60 h-[28px] flex items-center select-none">
            {/* The visual track (chunky rounded pill in #f1f1f4) */}
            <div className="relative w-full h-[22px] rounded-full bg-[#f1f1f4] overflow-hidden">
              {/* Red gradient fill with fiery All-In shimmer */}
              <div
                className={`absolute left-0 top-0 bottom-0 rounded-l-full pointer-events-none transition-all duration-100 ${
                  isAllIn ? 'allin-track-shimmer rounded-r-full' : ''
                }`}
                style={{
                  width:
                    sliderPercent >= 98
                      ? '100%'
                      : `calc(11px + (100% - 22px) * ${sliderPercent / 100})`,
                  background: isAllIn
                    ? undefined
                    : 'linear-gradient(90deg, #fb7185 0%, #f43f5e 45%, #e11d48 100%)',
                }}
              />

              {/* 3 standard interior dots (1/3 Pot, 1/2 Pot, 3/4 Pot) */}
              {interiorDots.map((m) => {
                const isPassed = sliderPercent >= m.pct;
                return (
                  <div
                    key={m.id}
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full pointer-events-none transition-all duration-150 ${
                      isPassed
                        ? isAllIn
                          ? 'bg-white shadow-[0_0_4px_white]'
                          : 'bg-white/85'
                        : 'bg-[#9ca3af]'
                    }`}
                    style={{ left: `calc(11px + (100% - 22px) * ${m.pct / 100})` }}
                  />
                );
              })}
            </div>

            {/* Circular white thumb with red gradient indicator and All-In flame effect */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white flex items-center justify-center pointer-events-none z-20 transition-all duration-200 ${
                isAllIn
                  ? 'scale-110 ring-4 ring-rose-500/70 shadow-[0_0_16px_rgba(239,68,68,0.9)]'
                  : 'shadow-[0_2px_7px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.12)] border border-rose-200 active:scale-105'
              }`}
              style={{ left: `calc(11px + (100% - 22px) * ${sliderPercent / 100})` }}
            >
              {isAllIn ? (
                <span className="text-[12px] leading-none select-none">🔥</span>
              ) : (
                <div className="w-2 h-2 rounded-full bg-rose-500" />
              )}
            </div>

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
        className="flex items-center gap-1 sm:gap-2 bg-white/95 p-1.5 rounded-full border border-neutral-200/90 shadow-sm"
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
          className="px-3 sm:px-6 py-2 rounded-full text-[11px] sm:text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed"
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
            className="px-3 sm:px-6 py-2 rounded-full text-[11px] sm:text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 border border-transparent hover:border-neutral-200 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed"
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
            className="px-3 sm:px-6 py-2 rounded-full text-[11px] sm:text-xs font-semibold text-neutral-800 hover:text-neutral-950 hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            Call {formatCurrency(toCall)}
          </button>
        )}

        {/* Primary Bet / Raise Button (Transforms into glowing flame pill on All-In) */}
        <button
          type="button"
          disabled={isDisabled || !canIncreaseBet}
          onClick={handleBlackButtonClick}
          className={`px-3 sm:px-6 py-2 rounded-full text-[11px] sm:text-xs font-semibold shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:bg-neutral-400 ${
            isAllIn && showSlider
              ? 'bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold shadow-[0_0_20px_rgba(225,29,72,0.6)] animate-pulse'
              : 'bg-neutral-900 hover:bg-neutral-800 text-white'
          }`}
        >
          {!canIncreaseBet ? (
            <span>Raise Closed</span>
          ) : showSlider ? (
            <>
              {isAllIn && <span>🔥</span>}
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
