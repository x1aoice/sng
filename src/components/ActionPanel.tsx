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

  const sliderBoxRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const updateFromPointer = (clientX: number) => {
    if (!sliderBoxRef.current) return;
    const rect = sliderBoxRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;

    // Track interior: thumb center travels from 11px to (rect.width - 11px)
    const padding = 11;
    const usableWidth = rect.width - padding * 2;
    const relativeX = clientX - rect.left - padding;
    const rawPct = (relativeX / usableWidth) * 100;

    let pct: number;
    if (rawPct <= 1.5) {
      pct = 0;
    } else if (rawPct >= 98.5) {
      pct = 100;
    } else {
      pct = Math.max(0, Math.min(100, rawPct));
    }

    setSliderPercent(pct);
    const amt = percentToAmount(pct);
    setSliderAmount(amt);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    updateFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    updateFromPointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

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
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3.5 flex items-center bg-white px-3 py-1.5 rounded-full border border-neutral-200/90 shadow-[0_8px_24px_rgba(0,0,0,0.09)] z-40 select-none animate-fade-in">
          {/* Slider Box with Direct Pointer Dragging */}
          <div
            ref={sliderBoxRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onLostPointerCapture={() => {
              isDraggingRef.current = false;
            }}
            className="relative w-52 sm:w-60 h-[28px] flex items-center select-none cursor-pointer touch-none"
          >
            {/* The visual track (chunky rounded pill in #f1f1f4) */}
            <div className="relative w-full h-[22px] rounded-full bg-[#f1f1f4] overflow-hidden pointer-events-none shadow-inner">
              {/* Red gradient fill: Gentle unidirectional ruby flow when All-In */}
              <div
                className={`absolute left-0 top-0 bottom-0 rounded-l-full pointer-events-none ${
                  isAllIn ? 'allin-ruby-flow rounded-r-full' : ''
                }`}
                style={{
                  width:
                    sliderPercent >= 98.5
                      ? '100%'
                      : `calc(11px + (100% - 22px) * ${sliderPercent / 100})`,
                  background: isAllIn
                    ? undefined
                    : 'linear-gradient(90deg, #fb7185 0%, #f43f5e 45%, #e11d48 100%)',
                }}
              />

              {/* Subtle glass specular highlight along top edge */}
              <div className="absolute inset-x-0 top-0 h-[38%] bg-gradient-to-b from-white/20 to-transparent rounded-t-full pointer-events-none" />

              {/* 3 standard interior dots (1/3 Pot, 1/2 Pot, 3/4 Pot) */}
              {interiorDots.map((m) => {
                const isPassed = sliderPercent >= m.pct;
                return (
                  <div
                    key={m.id}
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full pointer-events-none transition-colors duration-150 ${
                      isPassed ? 'bg-white/85' : 'bg-[#9ca3af]'
                    }`}
                    style={{ left: `calc(11px + (100% - 22px) * ${m.pct / 100})` }}
                  />
                );
              })}
            </div>

            {/* Circular white thumb: Pure clean white circle with smooth natural elevation shadow, no borders, no inner dot, zero lag */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.1)] pointer-events-none z-20"
              style={{ left: `calc(11px + (100% - 22px) * ${sliderPercent / 100})` }}
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

        {/* Primary Bet / Raise Button (Transforms into clean ruby All-In button) */}
        <button
          type="button"
          disabled={isDisabled || !canIncreaseBet}
          onClick={handleBlackButtonClick}
          className={`px-3 sm:px-6 py-2 rounded-full text-[11px] sm:text-xs font-semibold shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:bg-neutral-400 ${
            isAllIn && showSlider
              ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold shadow-[0_2px_10px_rgba(225,29,72,0.35)]'
              : 'bg-neutral-900 hover:bg-neutral-800 text-white'
          }`}
        >
          {!canIncreaseBet ? (
            <span>Raise Closed</span>
          ) : showSlider ? (
            <>
              <span>{isAllIn ? 'All-in' : actionBaseName}</span>
              <span className="font-semibold">{formatCurrency(sliderAmount)}</span>
            </>
          ) : (
            <span>{actionBaseName}</span>
          )}
        </button>
      </div>
    </div>
  );
};
