import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/auth/figma/callback
 * Handles the Figma OAuth callback.
 * Exchanges the authorization code for an access token.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(
      new URL("/settings?figma=error&message=no_code", request.url)
    );
  }

  const clientId = process.env.FIGMA_CLIENT_ID || process.env.NEXT_PUBLIC_FIGMA_CLIENT_ID;
  const clientSecret = process.env.FIGMA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    // Demo mode: redirect back with mock success
    return NextResponse.redirect(
      new URL("/settings?figma=connected&name=Demo+User", request.url)
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://www.figma.com/api/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${new URL(request.url).origin}/api/auth/figma/callback`,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("[Figma OAuth] Token exchange failed:", error);
      return NextResponse.redirect(
        new URL("/settings?figma=error&message=token_exchange_failed", request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info
    const userResponse = await fetch("https://api.figma.com/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let userName = "Figma User";
    if (userResponse.ok) {
      const userData = await userResponse.json();
      userName = userData.handle || userData.email || "Figma User";
    }

    // Redirect back to settings with success
    // In production: store token in a secure session/cookie
    const redirectUrl = new URL("/settings", request.url);
    redirectUrl.searchParams.set("figma", "connected");
    redirectUrl.searchParams.set("name", userName);

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("[Figma OAuth] Error:", err);
    return NextResponse.redirect(
      new URL("/settings?figma=error&message=unknown_error", request.url)
    );
  }
}
