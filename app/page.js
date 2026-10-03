"use client";

import { useEffect, useState } from "react";

const platformDefaults = [
  { id: "instagram-placeholder", platform: "Instagram", name: "No account connected", handle: "", status: "Not connected" },
  { id: "tiktok-placeholder", platform: "TikTok", name: "No account connected", handle: "", status: "Not connected" }
];

export default function Home() {
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [active, setActive] = useState("dashboard");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("TikTok");

  const loadAccounts = async () => {
    try {
      const response = await fetch("/api/accounts", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load accounts");
      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch {
      setAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    loadAccounts();
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "tiktok") {
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const startConnect = () => {
    if (selectedPlatform === "TikTok") window.location.href = "/auth/tiktok";
  };

  const visibleAccounts = loadingAccounts
    ? []
    : accounts.length
      ? accounts
      : platformDefaults;

  const connectedCount = accounts.length;

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">Social<span>Manager</span></div>
        <nav>
          <button className={active === "dashboard" ? "nav active" : "nav"} onClick={() => setActive("dashboard")}>Dashboard</button>
          <button className={active === "accounts" ? "nav active" : "nav"} onClick={() => setActive("accounts")}>Accounts</button>
          <button className={active === "posts" ? "nav active" : "nav"} onClick={() => setActive("posts")}>Posts & Comments</button>
          <button className={active === "logs" ? "nav active" : "nav"} onClick={() => setActive("logs")}>Activity Logs</button>
          <button className={active === "settings" ? "nav active" : "nav"} onClick={() => setActive("settings")}>Settings</button>
        </nav>
      </aside>

      <section className="content">
        <header>
          <div>
            <p className="eyebrow">SOCIAL CONTROL CENTER</p>
            <h1>{active === "dashboard" ? "Dashboard" : active}</h1>
            <p className="muted">Manage your connected social accounts from one place.</p>
          </div>
          <button className="primary" onClick={() => setShowAdd(true)}>+ Add account</button>
        </header>

        <div className="stats">
          <div className="stat"><span>Connected accounts</span><strong>{connectedCount}</strong></div>
          <div className="stat"><span>Posts today</span><strong>0</strong></div>
          <div className="stat"><span>Actions today</span><strong>0</strong></div>
        </div>

        <section className="panel">
          <div className="panelHead">
            <div><h2>Accounts</h2><p className="muted">Connected accounts are saved to your dashboard after TikTok authorization.</p></div>
            <button className="smallPrimary" onClick={() => setShowAdd(true)}>Add account</button>
          </div>

          <div className="accountGrid">
            {visibleAccounts.map(account => {
              const isPlaceholder = String(account.id).includes("placeholder");
              const platform = account.platform || "";
              const label = isPlaceholder ? account.name : (account.display_name || account.username || "TikTok account");
              const handle = isPlaceholder ? account.handle : (account.username ? "@" + account.username.replace(/^@/, "") : "");
              const status = isPlaceholder ? account.status : (account.status || "Connected");

              return (
                <article className="account" key={account.id}>
                  <div className={"icon " + platform.toLowerCase()}>{platform === "Instagram" ? "IG" : "TT"}</div>
                  <div className="accountInfo">
                    <h3>{platform}</h3>
                    <p>{label}</p>
                    <small>{handle}</small>
                  </div>
                  <div className="accountBottom">
                    <span className="status">{status}</span>
                    <button onClick={() => { setSelectedPlatform(platform); setShowAdd(true); }}>
                      {isPlaceholder ? "Connect" : "Manage"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="panel">
          <div className="panelHead">
            <div><h2>Quick actions</h2><p className="muted">Posting and comment controls will appear after the required TikTok permissions are approved.</p></div>
          </div>
          <div className="actions">
            <button disabled>New post</button>
            <button disabled>Comment from account</button>
            <button disabled>Manage mentions</button>
          </div>
        </section>

        <div className="notice">
          <strong>Security first</strong>
          <span>Your TikTok password is never sent to this site. Login and consent happen on TikTok, while OAuth tokens are kept server-side.</span>
        </div>
      </section>

      {showAdd && (
        <div className="modalBackdrop" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <div>
                <p className="eyebrow">ADD ACCOUNT</p>
                <h2>Connect a social account</h2>
              </div>
              <button className="closeButton" onClick={() => setShowAdd(false)}>×</button>
            </div>

            <div className="platformChoices">
              <button className={selectedPlatform === "Instagram" ? "platformChoice selected" : "platformChoice"} onClick={() => setSelectedPlatform("Instagram")}>
                <span className="choiceIcon instagram">IG</span>
                <span><strong>Instagram</strong><small>Sign in with Instagram</small></span>
              </button>
              <button className={selectedPlatform === "TikTok" ? "platformChoice selected" : "platformChoice"} onClick={() => setSelectedPlatform("TikTok")}>
                <span className="choiceIcon tiktok">TT</span>
                <span><strong>TikTok</strong><small>Sign in with TikTok</small></span>
              </button>
            </div>

            <div className="modalInfo">
              <strong>What happens next?</strong>
              <p>You will be sent to TikTok's official authorization page. After you approve access, the account will be saved and shown in this dashboard.</p>
            </div>

            {selectedPlatform === "Instagram" ? (
              <button className="modalConnect disabledConnect" disabled>Instagram setup required</button>
            ) : (
              <button className="modalConnect" onClick={startConnect}>Continue with TikTok</button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
