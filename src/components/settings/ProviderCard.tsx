"use client";

import { useState } from "react";
import { AIModel, AIProviderConnection, AuthMethod } from "@/types";
import { AI_PROVIDER_META } from "@/lib/settings-store";
import Button from "@/components/ui/Button";

interface ProviderCardProps {
  provider: AIModel;
  connection: AIProviderConnection;
  onConnect: (provider: AIModel, apiKey: string) => void;
  onDisconnect: (provider: AIModel) => void;
  onTest: (provider: AIModel) => void;
  onOAuthConnect: (provider: AIModel) => void;
}

export default function ProviderCard({
  provider,
  connection,
  onConnect,
  onDisconnect,
  onTest,
  onOAuthConnect,
}: ProviderCardProps) {
  const meta = AI_PROVIDER_META[provider];
  const [showInput, setShowInput] = useState(false);
  const [keyValue, setKeyValue] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState<AuthMethod>(
    connection.authMethod || "api_key"
  );

  const isConnected = connection.status === "connected";
  const isError = connection.status === "error";
  const isOAuthConnected = isConnected && connection.authMethod === "oauth";

  const handleSave = () => {
    if (!keyValue.trim()) return;
    onConnect(provider, keyValue.trim());
    setKeyValue("");
    setShowInput(false);
  };

  const handleOAuthClick = () => {
    onOAuthConnect(provider);
  };

  const statusColor = isConnected
    ? "bg-emerald-400"
    : isError
    ? "bg-red-400"
    : "bg-zinc-400";

  const statusText = isConnected
    ? connection.authMethod === "oauth"
      ? "Connected (OAuth)"
      : "Connected (API Key)"
    : isError
    ? "Error"
    : "Not connected";

  return (
    <div className={`rounded-2xl border-2 p-5 transition-all ${isConnected ? "border-emerald-500/30 bg-emerald-50/5" : isError ? "border-red-500/30 bg-red-50/5" : "border-border bg-card-bg"}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted-bg text-xl">
            {meta.icon}
          </span>
          <div>
            <h3 className="text-sm font-bold">{meta.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`h-2 w-2 rounded-full ${statusColor}`} />
              <span className={`text-xs ${isConnected ? "text-emerald-500" : isError ? "text-red-500" : "text-muted"}`}>
                {statusText}
              </span>
            </div>
          </div>
        </div>

        <span className="rounded-lg bg-muted-bg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
          {isConnected ? connection.authMethod === "oauth" ? "OAuth" : "API Key" : "Auth"}
        </span>
      </div>

      {/* Auth Method Tabs (only show when not connected and OAuth is supported) */}
      {!isConnected && meta.oauthSupported && (
        <div className="flex mb-4 rounded-xl bg-muted-bg/50 p-1">
          <button
            type="button"
            onClick={() => { setActiveTab("api_key"); setShowInput(false); }}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
              activeTab === "api_key"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              API Key
            </span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("oauth"); setShowInput(false); }}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
              activeTab === "oauth"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              OAuth
            </span>
          </button>
        </div>
      )}

      {/* Connection Info - API Key */}
      {isConnected && connection.authMethod !== "oauth" && connection.apiKey && (
        <div className="mb-4 rounded-xl bg-muted-bg/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted mb-1">API Key</p>
              <p className="text-xs font-mono">{connection.apiKey}</p>
            </div>
            {connection.lastVerified && (
              <p className="text-[10px] text-muted">
                Verified {new Date(connection.lastVerified).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Connection Info - OAuth */}
      {isOAuthConnected && (
        <div className="mb-4 rounded-xl bg-muted-bg/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white text-xs font-bold">
              {connection.oauthUserName?.charAt(0) || connection.oauthEmail?.charAt(0) || "U"}
            </div>
            <div>
              <p className="text-xs font-semibold">{connection.oauthUserName || "User"}</p>
              {connection.oauthEmail && (
                <p className="text-[10px] text-muted">{connection.oauthEmail}</p>
              )}
            </div>
          </div>
          {connection.lastVerified && (
            <p className="text-[10px] text-muted mt-2">
              Connected {new Date(connection.lastVerified).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Error Message */}
      {isError && connection.error && (
        <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/30 px-4 py-3">
          <p className="text-xs text-red-600 dark:text-red-400">{connection.error}</p>
        </div>
      )}

      {/* API Key Input */}
      {showInput && activeTab === "api_key" && (
        <div className="mb-4 space-y-3">
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              placeholder={meta.keyPlaceholder}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-10 text-sm font-mono outline-none focus:border-accent transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer"
            >
              {showKey ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <a
              href={meta.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-accent hover:underline"
            >
              Get your API key &rarr;
            </a>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setShowInput(false); setKeyValue(""); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!keyValue.trim()}>
                Save Key
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* OAuth Connect Section (when not connected and OAuth tab is active) */}
      {!isConnected && activeTab === "oauth" && meta.oauthSupported && !showInput && (
        <div className="mb-4">
          <p className="text-xs text-muted leading-relaxed mb-3">
            {meta.oauthNote}
          </p>
          <div className="space-y-2 mb-3">
            {[
              "OAuth 2.0 보안 인증",
              "API Key 입력 불필요",
              "계정 연동으로 간편 연결",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-xs text-muted">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent flex-shrink-0" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {feature}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {isConnected ? (
          <>
            <Button variant="secondary" size="sm" onClick={() => onTest(provider)} className="flex-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Test
            </Button>
            {connection.authMethod !== "oauth" && (
              <Button variant="secondary" size="sm" onClick={() => setShowInput(true)} className="flex-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
                Update Key
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onDisconnect(provider)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </Button>
          </>
        ) : activeTab === "oauth" && meta.oauthSupported ? (
          <Button size="sm" onClick={handleOAuthClick} className="w-full">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            {provider === "openai" ? "Sign in with OpenAI" : "Sign in with Google"}
          </Button>
        ) : (
          <Button size="sm" onClick={() => setShowInput(true)} className="w-full">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Connect with API Key
          </Button>
        )}
      </div>
    </div>
  );
}
