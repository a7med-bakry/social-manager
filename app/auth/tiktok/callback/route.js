import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const cookieState = request.cookies.get("tiktok_oauth_state")?.value;

  if (error) {
    return NextResponse.redirect(new URL("/?error=tiktok_denied", request.url));
  }

  if (!code || !returnedState || !cookieState || returnedState !== cookieState) {
    return NextResponse.json({ error: "Invalid TikTok OAuth state." }, { status: 400 });
  }

  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY || "",
      client_secret: process.env.TIKTOK_CLIENT_SECRET || "",
      code,
      grant_type: "authorization_code",
      redirect_uri: process.env.TIKTOK_REDIRECT_URI || ""
    })
  });

  const token = await response.json();

  if (!response.ok || !token.access_token) {
    return NextResponse.json({ error: "TikTok token exchange failed.", details: token }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=login_required", request.url));
  }

  const profileResponse = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name", {
    headers: { Authorization: "Bearer " + token.access_token }
  });
  const profile = await profileResponse.json();
  const account = profile.data?.user;

  if (!account?.open_id) {
    return NextResponse.json({ error: "Could not read TikTok account profile.", details: profile }, { status: 400 });
  }

  const { error: dbError } = await supabase.from("social_accounts").upsert({
    user_id: user.id,
    platform: "tiktok",
    platform_account_id: account.open_id,
    username: account.display_name || null,
    display_name: account.display_name || null,
    avatar_url: account.avatar_url || null,
    status: "connected"
  }, { onConflict: "user_id,platform,platform_account_id" });

  if (dbError) {
    return NextResponse.json({ error: "Account database save failed.", details: dbError.message }, { status: 500 });
  }

  const redirect = NextResponse.redirect(new URL("/?connected=tiktok", request.url));
  redirect.cookies.delete("tiktok_oauth_state");
  return redirect;
}
