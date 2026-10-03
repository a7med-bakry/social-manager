"use client";

import { useState } from "react";

const initialAccounts = [
  { id: 1, platform: "Instagram", name: "No accounts connected", handle: "", status: "Not connected" },
  { id: 2, platform: "TikTok", name: "No accounts connected", handle: "", status: "Not connected" }
];

export default function Home() {
  const [accounts] = useState(initialAccounts);
  const [active, setActive] = useState("dashboard");

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
          <button className="primary" onClick={() => setActive("accounts")}>+ Add account</button>
        </header>

        <div className="stats">
          <div className="stat"><span>Connected accounts</span><strong>0</strong></div>
          <div className="stat"><span>Posts today</span><strong>0</strong></div>
          <div className="stat"><span>Actions today</span><strong>0</strong></div>
        </div>

        <section className="panel">
          <div className="panelHead">
            <div><h2>Accounts</h2><p className="muted">Connect accounts through their official authorization pages.</p></div>
          </div>
          <div className="accountGrid">
            {accounts.map(account => (
              <article className="account" key={account.id}>
                <div className={"icon " + account.platform.toLowerCase()}>{account.platform === "Instagram" ? "IG" : "TT"}</div>
                <div className="accountInfo">
                  <h3>{account.platform}</h3>
                  <p>{account.name}</p>
                  <small>{account.handle}</small>
                </div>
                <div className="accountBottom">
                  <span className="status">{account.status}</span>
                  {account.platform === "TikTok" ? (
                    <a className="connectButton" href="/auth/tiktok">Connect</a>
                  ) : (
                    <button disabled>Connect after Meta setup</button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panelHead"><div><h2>Quick actions</h2><p className="muted">Posting and comment controls will appear after OAuth accounts are connected.</p></div></div>
          <div className="actions">
            <button disabled>New post</button>
            <button disabled>Comment from account</button>
            <button disabled>Manage mentions</button>
          </div>
        </section>

        <div className="notice">
          <strong>Security first</strong>
          <span>Passwords are never collected. OAuth tokens and client secrets stay server-side.</span>
        </div>
      </section>
    </main>
  );
}
