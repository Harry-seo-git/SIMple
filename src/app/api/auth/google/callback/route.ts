import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/auth/google/callback
 * Handles the Google OAuth callback for Gemini API access.
 * Exchanges the authorization code for an access token.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(
      new URL("/settings?oauth=error&provider=gemini&message=no_code", request.url)
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    // Demo mode: redirect back with mock success
    return NextResponse.redirect(
      new URL("/settings?oauth=connected&provider=gemini&name=Demo+User&email=demo@google.com", request.url)
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${new URL(request.url).origin}/api/auth/google/callback`,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("[Google OAuth] Token exchange failed:", error);
      return NextResponse.redirect(
        new URL("/settings?oauth=error&provider=gemini&message=token_exchange_failed", request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info from Google
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let userName = "Google User";
    let userEmail = "";
    if (userResponse.ok) {
      const userData = await userResponse.json();
      userName = userData.name || userData.email || "Google User";
      userEmail = userData.email || "";
    }

    // Store the token server-side in production
    // For now: redirect back to settings with success
    const redirectUrl = new URL("/settings", request.url);
    redirectUrl.searchParams.set("oauth", "connected");
    redirectUrl.searchParams.set("provider", "gemini");
    redirectUrl.searchParams.set("name", userName);
    if (userEmail) redirectUrl.searchParams.set("email", userEmail);

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("[Google OAuth] Error:", err);
    return NextResponse.redirect(
      new URL("/settings?oauth=error&provider=gemini&message=unknown_error", request.url)
    );
  }
}
