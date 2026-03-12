"use client";

import { FigmaConnection } from "@/types";
import Button from "@/components/ui/Button";

interface FigmaCardProps {
  connection: FigmaConnection;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function FigmaCard({ connection, onConnect, onDisconnect }: FigmaCardProps) {
  const isConnected = connection.status === "connected";

  return (
    <div className={`rounded-2xl border-2 p-5 transition-all ${isConnected ? "border-emerald-500/30 bg-emerald-50/5" : "border-border bg-card-bg"}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted-bg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />
              <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" />
              <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z" />
              <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" />
              <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" />
            </svg>
          </span>
          <div>
            <h3 className="text-sm font-bold">Figma</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-400" : "bg-zinc-400"}`} />
              <span className={`text-xs ${isConnected ? "text-emerald-500" : "text-muted"}`}>
                {isConnected ? "Connected" : "Not connected"}
              </span>
            </div>
          </div>
        </div>
        <span className="rounded-lg bg-violet-100 dark:bg-violet-900/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
          OAuth
        </span>
      </div>

      {/* Connected Info */}
      {isConnected && (
        <div className="mb-4 rounded-xl bg-muted-bg/50 px-4 py-3">
          <div className="flex items-center gap-3">
            {connection.userAvatar ? (
              <img src={connection.userAvatar} alt="" className="h-8 w-8 rounded-full" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white text-xs font-bold">
                {connection.userName?.charAt(0) || "F"}
              </div>
            )}
            <div>
              <p className="text-xs font-semibold">{connection.userName || "Figma User"}</p>
              {connection.teamName && (
                <p className="text-[10px] text-muted">{connection.teamName}</p>
              )}
            </div>
          </div>
          {connection.lastConnected && (
            <p className="text-[10px] text-muted mt-2">
              Connected {new Date(connection.lastConnected).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Description */}
      {!isConnected && (
        <p className="text-xs text-muted leading-relaxed mb-4">
          Connect your Figma account to sync generated assets directly to your design files and access shared design system components.
        </p>
      )}

      {/* Features */}
      {!isConnected && (
        <div className="mb-4 space-y-2">
          {[
            "Push assets to Figma design files",
            "Sync design tokens (colors, typography)",
            "Auto-register as Figma components",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-xs text-muted">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent flex-shrink-0" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {feature}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {isConnected ? (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Sync Now
          </Button>
          <Button variant="ghost" size="sm" onClick={onDisconnect}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
            Disconnect
          </Button>
        </div>
      ) : (
        <Button size="sm" onClick={onConnect} className="w-full">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />
            <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" />
          </svg>
          Connect with Figma
        </Button>
      )}
    </div>
  );
}
