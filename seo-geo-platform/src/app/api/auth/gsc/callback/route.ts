import { NextRequest, NextResponse } from "next/server";
import { encryptToken } from "@/server/services/googleSearchConsole";

/**
 * GET /api/auth/gsc/callback
 * Handles Google OAuth callback - exchanges code for tokens and saves to project.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings?gsc_error=${error}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings?gsc_error=no_code`
    );
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/gsc/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const errData = await tokenRes.text();
    console.error("Token exchange failed:", errData);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings?gsc_error=token_exchange_failed`
    );
  }

  const tokens = await tokenRes.json();
  const accessToken = tokens.access_token;
  const refreshToken = tokens.refresh_token;

  // List available GSC properties
  const sitesRes = await fetch("https://searchconsole.googleapis.com/webmasters/v3/sites", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let sites: { siteUrl: string; permissionLevel: string }[] = [];
  if (sitesRes.ok) {
    const sitesData = await sitesRes.json();
    sites = sitesData.siteEntry || [];
  }

  // Store tokens temporarily in a cookie for the settings page to use
  const response = NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings?gsc_connected=true`
  );

  // Encrypt and store the tokens - they'll be saved to the project when user selects a property
  const encryptedAccess = encryptToken(accessToken);
  const encryptedRefresh = refreshToken ? encryptToken(refreshToken) : "";

  response.cookies.set("gsc_access_token", encryptedAccess, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 300, // 5 minutes to complete setup
    path: "/",
  });
  response.cookies.set("gsc_refresh_token", encryptedRefresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 300,
    path: "/",
  });
  response.cookies.set("gsc_sites", JSON.stringify(sites.map(s => s.siteUrl)), {
    httpOnly: false, // Client needs to read this
    secure: process.env.NODE_ENV === "production",
    maxAge: 300,
    path: "/",
  });

  return response;
}
