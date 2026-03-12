"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import ProviderCard from "@/components/settings/ProviderCard";
import FigmaCard from "@/components/settings/FigmaCard";
import Badge from "@/components/ui/Badge";
import {
  loadSettings,
  setProviderApiKey,
  setProviderOAuth,
  disconnectProvider,
  disconnectFigma,
  setFigmaConnection,
  getConnectedCount,
  AI_PROVIDER_META,
  buildOAuthRedirectUrl,
} from "@/lib/settings-store";
import { AIModel, AppSettings } from "@/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    setSettings(loadSettings());

    // Check for Figma OAuth callback params
    const params = new URLSearchParams(window.location.search);
    const figmaSuccess = params.get("figma");
    if (figmaSuccess === "connected") {
      const current = loadSettings();
      const updated = setFigmaConnection(current, {
        status: "connected",
        userName: params.get("name") || "Figma User",
        lastConnected: new Date().toISOString(),
      });
      setSettings(updated);
      // Clean URL
      window.history.replaceState({}, "", "/settings");
    }

    // Check for AI provider OAuth callback params
    const oauthStatus = params.get("oauth");
    const oauthProvider = params.get("provider") as AIModel | null;
    if (oauthStatus === "connected" && oauthProvider) {
      const current = loadSettings();
      const updated = setProviderOAuth(current, oauthProvider, {
        userName: params.get("name") || undefined,
        email: params.get("email") || undefined,
      });
      setSettings(updated);
      // Clean URL
      window.history.replaceState({}, "", "/settings");
    }

    if (oauthStatus === "error" && oauthProvider) {
      const message = params.get("message") || "unknown_error";
      console.error(`[OAuth] ${oauthProvider} connection failed:`, message);
      // Clean URL
      window.history.replaceState({}, "", "/settings");
    }
  }, []);

  const handleConnect = useCallback(
    (provider: AIModel, apiKey: string) => {
      if (!settings) return;
      setSettings(setProviderApiKey(settings, provider, apiKey));
    },
    [settings]
  );

  const handleDisconnect = useCallback(
    (provider: AIModel) => {
      if (!settings) return;
      setSettings(disconnectProvider(settings, provider));
    },
    [settings]
  );

  const handleTest = useCallback(
    async (provider: AIModel) => {
      // In production: call /api/settings/test with the provider
      // For now: just show a toast-style feedback
      alert(`${AI_PROVIDER_META[provider].name} connection test: OK (demo)`);
    },
    []
  );

  const handleOAuthConnect = useCallback(
    (provider: AIModel) => {
      const meta = AI_PROVIDER_META[provider];
      if (!meta.oauthSupported) return;

      // Try to build the real OAuth URL
      const oauthUrl = buildOAuthRedirectUrl(provider);

      if (!oauthUrl) {
        // Demo mode: simulate OAuth connection
        if (!settings) return;
        const updated = setProviderOAuth(settings, provider, {
          userName: "Demo User",
          email: `demo@${meta.oauthProvider}.com`,
        });
        setSettings(updated);
        return;
      }

      // Real OAuth redirect
      window.location.href = oauthUrl;
    },
    [settings]
  );

  const handleFigmaConnect = useCallback(() => {
    // Figma OAuth flow
    const clientId = process.env.NEXT_PUBLIC_FIGMA_CLIENT_ID;
    if (!clientId) {
      // Demo mode: simulate OAuth
      if (!settings) return;
      const updated = setFigmaConnection(settings, {
        status: "connected",
        userName: "Demo User",
        teamName: "USIMSA Design",
        lastConnected: new Date().toISOString(),
      });
      setSettings(updated);
      return;
    }

    // Real OAuth redirect
    const redirectUri = `${window.location.origin}/api/auth/figma/callback`;
    const scope = "files:read,file_variables:read,file_variables:write";
    const state = crypto.randomUUID();
    sessionStorage.setItem("figma-oauth-state", state);

    window.location.href =
      `https://www.figma.com/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&response_type=code`;
  }, [settings]);

  const handleFigmaDisconnect = useCallback(() => {
    if (!settings) return;
    setSettings(disconnectFigma(settings));
  }, [settings]);

  if (!settings) return null;

  const connectedCount = getConnectedCount(settings);
  const providers: AIModel[] = ["claude", "openai", "gemini"];

  return (
    <div className="flex h-screen flex-col">
      <Header
        title="Settings"
        description="Manage API connections and integrations"
        actions={
          <Badge variant={connectedCount > 0 ? "success" : "warning"}>
            {connectedCount}/3 AI models connected
          </Badge>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* AI Providers Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted">
                AI Providers
              </h3>
              <div className="h-px flex-1 bg-border" />
            </div>
            <p className="text-xs text-muted mb-5">
              Connect your AI models via API Key or OAuth to enable real graphic generation. Keys are stored locally in your browser.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {providers.map((p) => (
                <ProviderCard
                  key={p}
                  provider={p}
                  connection={settings.aiProviders[p]}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                  onTest={handleTest}
                  onOAuthConnect={handleOAuthConnect}
                />
              ))}
            </div>
          </section>

          {/* Figma Integration Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted">
                Design Tool Integration
              </h3>
              <div className="h-px flex-1 bg-border" />
            </div>
            <p className="text-xs text-muted mb-5">
              Connect Figma via OAuth to push generated assets directly into your design system.
            </p>
            <div className="max-w-sm">
              <FigmaCard
                connection={settings.figma}
                onConnect={handleFigmaConnect}
                onDisconnect={handleFigmaDisconnect}
              />
            </div>
          </section>

          {/* Environment Info */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted">
                Environment
              </h3>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="rounded-2xl border border-border bg-card-bg p-5">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-muted mb-1">Storage</p>
                  <p className="font-mono font-medium">localStorage (browser)</p>
                </div>
                <div>
                  <p className="text-muted mb-1">Security</p>
                  <p className="font-mono font-medium">Client-side only</p>
                </div>
                <div>
                  <p className="text-muted mb-1">Figma OAuth</p>
                  <p className="font-mono font-medium">
                    {process.env.NEXT_PUBLIC_FIGMA_CLIENT_ID ? "Configured" : "Demo mode"}
                  </p>
                </div>
                <div>
                  <p className="text-muted mb-1">OpenAI OAuth</p>
                  <p className="font-mono font-medium">
                    {process.env.NEXT_PUBLIC_OPENAI_CLIENT_ID ? "Configured" : "Demo mode"}
                  </p>
                </div>
                <div>
                  <p className="text-muted mb-1">Google OAuth</p>
                  <p className="font-mono font-medium">
                    {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? "Configured" : "Demo mode"}
                  </p>
                </div>
                <div>
                  <p className="text-muted mb-1">Version</p>
                  <p className="font-mono font-medium">SIMple v0.1.0</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-[10px] text-muted leading-relaxed">
                  In production, API keys and OAuth tokens should be stored server-side using environment variables.
                  Current setup stores keys in browser localStorage for development convenience.
                  OAuth flows use demo mode when CLIENT_ID/CLIENT_SECRET env vars are not set.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
