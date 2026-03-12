import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/library
 * Returns the user's saved assets from localStorage.
 *
 * Note: In production, this would read from a database.
 * Currently, the library is client-side only (localStorage).
 * This endpoint provides a bridge for the Figma plugin to access assets
 * by having the browser relay the data through a cookie/session.
 *
 * For the Figma plugin demo, we return a message indicating
 * the client should fetch from localStorage directly via the web app.
 */
export async function GET(request: NextRequest) {
  // Enable CORS for Figma plugin requests
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // In demo mode, return a helpful message
  // The Figma plugin can also connect via the web app's postMessage API
  return NextResponse.json(
    {
      assets: [],
      message: "Assets are stored in browser localStorage. Use the SIMple web app to manage your library, or configure a database for server-side storage.",
      hint: "Open your SIMple web app and use 'Export to Figma' to push assets.",
    },
    { headers }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
