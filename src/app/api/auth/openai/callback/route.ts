import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/auth/openai/callback
 * Handles the OpenAI OAuth callback.
 * Exchanges the authorization code for an access token.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(
      new URL("/settings?oauth=error&provider=openai&message=no_code", request.url)
    );
  }

  const clientId = process.env.OPENAI_CLIENT_ID || process.env.NEXT_PUBLIC_OPENAI_CLIENT_ID;
  const clientSecret = process.env.OPENAI_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    // Demo mode: redirect back with mock success
    return NextResponse.redirect(
      new URL("/settings?oauth=connected&provider=openai&name=Demo+User&email=demo@openai.com", request.url)
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://auth.openai.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${new URL(request.url).origin}/api/auth/openai/callback`,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("[OpenAI OAuth] Token exchange failed:", error);
      return NextResponse.redirect(
        new URL("/settings?oauth=error&provider=openai&message=token_exchange_failed", request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info
    const userResponse = await fetch("https://api.openai.com/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let userName = "OpenAI User";
    let userEmail = "";
    if (userResponse.ok) {
      const userData = await userResponse.json();
      userName = userData.name || userData.email || "OpenAI User";
      userEmail = userData.email || "";
    }

    // Store the token server-side in production
    // For now: redirect back to settings with success
    const redirectUrl = new URL("/settings", request.url);
    redirectUrl.searchParams.set("oauth", "connected");
    redirectUrl.searchParams.set("provider", "openai");
    redirectUrl.searchParams.set("name", userName);
    if (userEmail) redirectUrl.searchParams.set("email", userEmail);

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("[OpenAI OAuth] Error:", err);
    return NextResponse.redirect(
      new URL("/settings?oauth=error&provider=openai&message=unknown_error", request.url)
    );
  }
}
