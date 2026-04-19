import { useState } from "react";
import "./sigsentry.css";
import {
  SigSentryProvider,
  AnalysisWidget,
  AnalysisResultDisplay,
  SigSentryTrigger,
} from "@sigsentry/react";
import type { AnalysisResult } from "@sigsentry/core";
import { CustomAnalysis } from "./CustomAnalysis";

const API_KEY = "tb_live_238863c514b07fbdd2776de5f3a080623765dbb2bf37009e195a3af00cd6fd38";
const API_URL = "http://localhost:3001";

type Tab = "widget" | "trigger" | "custom";

export default function App() {
  const [tab, setTab] = useState<Tab>("widget");
  const [lastResult, setLastResult] = useState<AnalysisResult | null>(null);

  const tabs: { id: Tab; label: string }[] = [
    { id: "widget", label: "Widget" },
    { id: "trigger", label: "Trigger" },
    { id: "custom", label: "Custom Hook" },
  ];

  return (
    <SigSentryProvider apiKey={API_KEY} baseUrl={API_URL} theme="light">
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px" }}>
        <header style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
            SigSentry React Demo
          </h1>
          <p style={{ fontSize: 14, color: "var(--tb-color-text-secondary)", marginTop: 6 }}>
            Three ways to add AI log analysis to your app.
          </p>
        </header>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "1px solid var(--tb-color-border)" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                fontSize: 13,
                padding: "8px 16px",
                background: tab === t.id ? "var(--tb-color-bg-secondary)" : "transparent",
                color: tab === t.id ? "var(--tb-color-primary)" : "var(--tb-color-text-secondary)",
                border: "none",
                borderBottom: tab === t.id ? "2px solid var(--tb-color-primary)" : "2px solid transparent",
                cursor: "pointer",
                fontFamily: "var(--tb-font-family)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "widget" && (
          <div>
            <p style={{ fontSize: 13, color: "var(--tb-color-text-secondary)", marginBottom: 16 }}>
              Drop-in component — form, screenshot upload, time range, and result display included.
            </p>
            <AnalysisWidget
              defaultTimeRange="1h"
              showFollowUp={true}
              onAnalysisComplete={(result) => setLastResult(result)}
            />
          </div>
        )}

        {tab === "trigger" && (
          <div>
            <p style={{ fontSize: 13, color: "var(--tb-color-text-secondary)", marginBottom: 16 }}>
              Button that opens the widget in a modal or slideout panel.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <SigSentryTrigger
                mode="modal"
                label="Open Modal"
                defaultTimeRange="1h"
                onAnalysisComplete={(result) => setLastResult(result)}
              />
              <SigSentryTrigger
                mode="slideout"
                label="Open Slideout"
                defaultTimeRange="1h"
                onAnalysisComplete={(result) => setLastResult(result)}
              />
            </div>
          </div>
        )}

        {tab === "custom" && (
          <div>
            <p style={{ fontSize: 13, color: "var(--tb-color-text-secondary)", marginBottom: 16 }}>
              Build your own UI using the <code>useSigSentry</code> hook for full control.
            </p>
            <CustomAnalysis onResult={setLastResult} />
          </div>
        )}

        {/* Last Result */}
        {lastResult && (
          <div style={{ marginTop: 32 }}>
            <p style={{ fontSize: 12, color: "var(--tb-color-text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
              Last Result
            </p>
            <AnalysisResultDisplay result={lastResult} />
          </div>
        )}
      </div>
    </SigSentryProvider>
  );
}
