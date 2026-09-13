import React from 'react';
import { X, History } from 'lucide-react';
import type { HandLog } from '../engine/types';

interface HandLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: HandLog[];
}

export const HandLogDrawer: React.FC<HandLogDrawerProps> = ({
  isOpen,
  onClose,
  logs,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-neutral-900/20 backdrop-blur-2xs z-40 transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <aside className="fixed inset-y-0 right-0 w-84 max-w-[85vw] bg-white/95 backdrop-blur-md border-l border-neutral-200 shadow-2xl z-50 flex flex-col transition-all select-none animate-slide-in">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100">
          <div className="flex items-center gap-2 text-neutral-800 font-semibold text-sm">
            <History className="w-4 h-4 text-neutral-500" />
            <span>Hand History</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close hand history"
            className="w-7 h-7 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Log list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs">
          {logs.length === 0 ? (
            <div className="text-center text-neutral-400 py-12 flex flex-col items-center gap-2">
              <History className="w-8 h-8 text-neutral-300 stroke-1" />
              <p className="font-medium text-neutral-500">No hand history yet</p>
              <p className="text-[11px] text-neutral-400">Actions will be logged as hands are played.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 flex flex-col gap-1 shadow-2xs"
              >
                <div className="flex items-center justify-between text-[10px] text-neutral-400">
                  <span className="font-bold text-neutral-600 tracking-wide">
                    {log.round}
                  </span>
                  <span>{log.timestamp}</span>
                </div>
                <div className="text-neutral-800 font-medium leading-snug">{log.text}</div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
};

