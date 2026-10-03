import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=login_required", request.url));
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

  if (!response.ok || !token.access_token || !token.refresh_token) {
    return NextResponse.json({ error: "TikTok token exchange failed.", details: token }, { status: 400 });
  }

  const profileResponse = await fetch(
    "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name",
    { headers: { Authorization: "Bearer " + token.access_token } }
  );
  const profile = await profileResponse.json();
  const account = profile.data?.user;

  if (!profileResponse.ok || !account?.open_id) {
    return NextResponse.json(
      { error: "Could not read TikTok account profile.", details: profile },
      { status: 400 }
    );
  }

  const { data: savedAccount, error: dbError } = await supabase
    .from("social_accounts")
    .upsert(
      {
        user_id: user.id,
        platform: "tiktok",
        platform_user_id: account.open_id,
        username: account.display_name || null,
        display_name: account.display_name || null,
        avatar_url: account.avatar_url || null,
        profile_url: account.display_name
          ? "https://www.tiktok.com/@" + encodeURIComponent(account.display_name)
          : null,
        status: "connected",
        access_token: null,
        token_expires_at: token.expires_in
          ? new Date(Date.now() + Number(token.expires_in) * 1000).toISOString()
          : null
      },
      { onConflict: "platform,platform_user_id" }
    )
    .select("id")
    .single();

  if (dbError || !savedAccount) {
    return NextResponse.json(
      { error: "Account database save failed.", details: dbError?.message },
      { status: 500 }
    );
  }

  const admin = createAdminClient();
  const { error: tokenError } = await admin
    .from("tiktok_connections")
    .upsert(
      {
        user_id: user.id,
        social_account_id: savedAccount.id,
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        token_expires_at: token.expires_in
          ? new Date(Date.now() + Number(token.expires_in) * 1000).toISOString()
          : null,
        refresh_token_expires_at: token.refresh_expires_in
          ? new Date(Date.now() + Number(token.refresh_expires_in) * 1000).toISOString()
          : null,
        scopes: token.scope || null,
        updated_at: new Date().toISOString()
      },
      { onConflict: "social_account_id" }
    );

  if (tokenError) {
    return NextResponse.json(
      { error: "TikTok token storage failed.", details: tokenError.message },
      { status: 500 }
    );
  }

  const redirect = NextResponse.redirect(new URL("/?connected=tiktok", request.url));
  redirect.cookies.delete("tiktok_oauth_state");
  return redirect;
}
