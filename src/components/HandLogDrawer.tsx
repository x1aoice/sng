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
    <aside className="fixed inset-y-0 right-0 w-80 bg-white/95 backdrop-blur-md border-l border-neutral-200 shadow-xl z-50 flex flex-col transition-transform select-none">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
        <div className="flex items-center gap-2 text-neutral-800 font-semibold text-sm">
          <History className="w-4 h-4 text-neutral-500" />
          <span>Hand History</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Log list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 text-xs">
        {logs.length === 0 ? (
          <div className="text-center text-neutral-400 py-8">
            No hand logs yet. Start the game!
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-100 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between text-[10px] text-neutral-400">
                <span className="font-semibold text-neutral-600 uppercase tracking-wider">
                  {log.round}
                </span>
                <span>{log.timestamp}</span>
              </div>
              <div className="text-neutral-700 leading-snug">{log.text}</div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};

