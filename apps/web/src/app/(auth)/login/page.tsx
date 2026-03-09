"use client";

import { useTransition } from "react";
import { loginAction } from "@/lib/actions/auth-actions";
import { DEMO_USERS, type DemoUserId } from "@/lib/demo-users";


const demoAccounts: { id: DemoUserId; color: string; initial: string }[] = [
  { id: "demo_admin", color: "#3b5bdb", initial: "A" },
  { id: "demo_agent", color: "#0e7a5a", initial: "S" },
  { id: "demo_assistant", color: "#c05621", initial: "J" },
];

const roleBadge: Record<string, { label: string; bg: string; text: string }> = {
  ADMIN: { label: "Admin", bg: "#e0e9ff", text: "#1a2b6b" },
  AGENT: { label: "Agent", bg: "#d1fae5", text: "#065f46" },
  ASSISTANT: { label: "Assistant", bg: "#fef3c7", text: "#92400e" },
};

function DemoCard({ id, color, initial }: { id: DemoUserId; color: string; initial: string }) {
  const [isPending, startTransition] = useTransition();
  const user = DEMO_USERS[id];
  const badge = roleBadge[user.role];

  function handleLogin() {
    startTransition(async () => {
      await loginAction(id);
    });
  }

  return (
    <button
      id={`demo-login-${id}`}
      type="button"
      onClick={handleLogin}
      disabled={isPending}
      style={{ textAlign: "left", width: "100%", cursor: isPending ? "wait" : "pointer" }}
      className="demo-card"
    >
      <div className="demo-card-inner">
        <div
          className="demo-avatar"
          style={{ background: color }}
        >
          {initial}
        </div>
        <div className="demo-info">
          <span className="demo-name">{user.name}</span>
          <span className="demo-email">{user.email}</span>
        </div>
        <span
          className="demo-badge"
          style={{ background: badge.bg, color: badge.text }}
        >
          {badge.label}
        </span>
        {isPending && <span className="demo-spinner" />}
      </div>
    </button>
  );
}

export default function LoginPage() {
  return (
    <>
      <style>{`
        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: radial-gradient(circle at 10% 5%, #dde5ff 0%, #eef3ff 30%, #f8f9fb 70%);
        }
        .login-card {
          width: 100%;
          max-width: 440px;
          background: rgba(255,255,255,0.9);
          border: 1px solid var(--color-neutral-200);
          border-radius: var(--radius-xl);
          box-shadow: 0 20px 60px rgba(59,91,219,0.12), 0 4px 16px rgba(17,24,39,0.06);
          padding: 40px 36px 36px;
          backdrop-filter: blur(12px);
        }
        .login-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
        }
        .login-brand-dot {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #3b5bdb 0%, #4c6ef5 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: -0.5px;
          box-shadow: 0 4px 12px rgba(59,91,219,0.35);
        }
        .login-brand-text {
          font-size: 18px;
          font-weight: 700;
          color: var(--color-brand-900);
          letter-spacing: -0.3px;
        }
        .login-brand-sub {
          font-size: 11px;
          color: var(--color-neutral-500);
          font-weight: 500;
          letter-spacing: 0.2px;
        }
        .login-title {
          font-size: 22px;
          font-weight: 700;
          color: var(--color-neutral-900);
          margin: 0 0 4px;
          letter-spacing: -0.4px;
          line-height: 1.3;
        }
        .login-subtitle {
          font-size: 14px;
          color: var(--color-neutral-500);
          margin: 0 0 28px;
          line-height: 1.5;
        }
        .login-section-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--color-neutral-500);
          margin: 0 0 12px;
        }
        .demo-card {
          background: var(--surface-0);
          border: 1.5px solid var(--color-neutral-200);
          border-radius: var(--radius-md);
          padding: 0;
          transition: border-color 160ms ease, box-shadow 160ms ease, transform 120ms ease;
          margin-bottom: 8px;
          outline: none;
        }
        .demo-card:last-child { margin-bottom: 0; }
        .demo-card:hover:not(:disabled) {
          border-color: var(--color-brand-500);
          box-shadow: 0 0 0 3px rgba(59,91,219,0.08), var(--shadow-sm);
          transform: translateY(-1px);
        }
        .demo-card:active:not(:disabled) { transform: translateY(0); }
        .demo-card:disabled { opacity: 0.65; }
        .demo-card-inner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
        }
        .demo-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .demo-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .demo-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-neutral-900);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .demo-email {
          font-size: 12px;
          color: var(--color-neutral-500);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .demo-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 99px;
          flex-shrink: 0;
          letter-spacing: 0.2px;
        }
        .demo-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(59,91,219,0.2);
          border-top-color: var(--color-brand-500);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .login-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0;
        }
        .login-divider-line {
          flex: 1;
          height: 1px;
          background: var(--color-neutral-200);
        }
        .login-divider-text {
          font-size: 12px;
          color: var(--color-neutral-500);
          white-space: nowrap;
        }
        .login-prod-box {
          border: 1.5px dashed var(--color-neutral-200);
          border-radius: var(--radius-md);
          padding: 16px;
          position: relative;
          opacity: 0.6;
        }
        .login-prod-label {
          position: absolute;
          top: -10px;
          left: 12px;
          background: var(--surface-0);
          padding: 0 6px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: var(--color-neutral-500);
        }
        .login-prod-field {
          display: block;
          margin-bottom: 10px;
        }
        .login-prod-field:last-of-type { margin-bottom: 0; }
        .login-prod-input {
          width: 100%;
          border: 1px solid var(--color-neutral-200);
          border-radius: var(--radius-md);
          padding: 8px 12px;
          font-size: 13px;
          color: var(--color-neutral-500);
          background: var(--surface-1);
          box-sizing: border-box;
          cursor: not-allowed;
        }
        .login-prod-btn {
          width: 100%;
          margin-top: 12px;
          padding: 9px 0;
          border: 1px solid var(--color-neutral-200);
          border-radius: var(--radius-md);
          background: var(--surface-1);
          font-size: 13px;
          color: var(--color-neutral-500);
          cursor: not-allowed;
          font-weight: 500;
        }
        .login-footer {
          margin-top: 28px;
          text-align: center;
          font-size: 12px;
          color: var(--color-neutral-500);
        }
        .au-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--color-neutral-500);
          background: var(--color-neutral-50);
          border: 1px solid var(--color-neutral-200);
          border-radius: 99px;
          padding: 3px 10px;
          margin-bottom: 20px;
        }
      `}</style>
      <main className="login-root">
        <div className="login-card">
          <div className="login-brand">
            <div className="login-brand-dot">B</div>
            <div>
              <div className="login-brand-text">BuyerOS</div>
              <div className="login-brand-sub">Agent Operating System</div>
            </div>
          </div>

          <span className="au-badge">🇦🇺 AU First · Demo Environment</span>

          <h1 className="login-title">Sign in to your workspace</h1>
          <p className="login-subtitle">Select a demo account to explore the full platform.</p>

          <p className="login-section-label">Demo accounts</p>

          {demoAccounts.map((account) => (
            <DemoCard key={account.id} {...account} />
          ))}

          <div className="login-divider">
            <div className="login-divider-line" />
            <span className="login-divider-text">Production login (coming soon)</span>
            <div className="login-divider-line" />
          </div>

          <div className="login-prod-box">
            <span className="login-prod-label">Production only</span>
            <label className="login-prod-field">
              <input
                className="login-prod-input"
                type="email"
                placeholder="agent@youragency.com.au"
                disabled
                aria-label="Production email (disabled)"
              />
            </label>
            <label className="login-prod-field">
              <input
                className="login-prod-input"
                type="password"
                placeholder="Password"
                disabled
                aria-label="Production password (disabled)"
              />
            </label>
            <button type="button" className="login-prod-btn" disabled>
              Sign in with credentials
            </button>
          </div>

          <div className="login-footer">
            Secured · Australian real estate data · REIV &amp; REIWA compliant
          </div>
        </div>
      </main>
    </>
  );
}
