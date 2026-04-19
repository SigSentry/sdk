import { useState } from "react";
import { useSigSentry, useSigSentryContext } from "@sigsentry/react";
import type { AnalysisResult } from "@sigsentry/core";

/**
 * Custom analysis UI built with the useSigSentry hook.
 * Demonstrates full programmatic control over the analysis flow.
 */
export function CustomAnalysis({
  onResult,
}: {
  onResult: (result: AnalysisResult) => void;
}) {
  const { client } = useSigSentryContext();
  const { submitAnalysis, status, result, error, isLoading } = useSigSentry({
    client,
  });

  const [description, setDescription] = useState("");

  async function handleSubmit() {
    if (!description.trim()) return;

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    await submitAnalysis({
      description: description.trim(),
      timeStart: oneHourAgo,
      timeEnd: now,
    });
  }

  if (result) {
    onResult(result);
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the error you're investigating..."
          rows={3}
          style={{
            width: "100%",
            fontFamily: "var(--tb-font-family)",
            fontSize: "var(--tb-font-size-sm)",
            background: "var(--tb-color-bg-secondary)",
            border: "1px solid var(--tb-color-border)",
            borderRadius: "var(--tb-border-radius)",
            padding: 12,
            color: "var(--tb-color-text)",
            resize: "vertical",
            boxSizing: "border-box",
            outline: "none",
          }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading || !description.trim()}
        style={{
          fontFamily: "var(--tb-font-family)",
          fontSize: "var(--tb-font-size-sm)",
          fontWeight: 600,
          background: "var(--tb-color-primary)",
          color: "var(--tb-color-primary-text)",
          border: "none",
          borderRadius: "var(--tb-border-radius)",
          padding: "10px 20px",
          cursor: isLoading || !description.trim() ? "not-allowed" : "pointer",
          opacity: isLoading || !description.trim() ? 0.5 : 1,
        }}
      >
        {isLoading ? `Analyzing (${status})...` : "Run Analysis"}
      </button>

      {isLoading && (
        <p style={{ fontSize: "var(--tb-font-size-sm)", color: "var(--tb-color-medium)", marginTop: 12 }}>
          Stage: {status}
        </p>
      )}

      {error && (
        <p style={{ fontSize: "var(--tb-font-size-sm)", color: "var(--tb-color-critical)", marginTop: 12 }}>
          Error: {error.message}
        </p>
      )}

      {result && (
        <div
          style={{
            marginTop: 16,
            border: "1px solid var(--tb-color-border)",
            borderRadius: "var(--tb-border-radius)",
            padding: 16,
            background: "var(--tb-color-bg-secondary)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span
              style={{
                fontSize: "var(--tb-font-size-xs)",
                textTransform: "uppercase",
                letterSpacing: 1,
                background: result.severity === "critical" ? "rgba(220,38,38,0.1)" : "rgba(37,99,235,0.1)",
                color: result.severity === "critical" ? "var(--tb-color-critical)" : "var(--tb-color-low)",
                padding: "2px 8px",
                borderRadius: "var(--tb-border-radius)",
                fontWeight: 600,
              }}
            >
              {result.severity}
            </span>
            <span style={{ fontSize: "var(--tb-font-size-xs)", color: "var(--tb-color-text-muted)" }}>
              {result.confidence ? `${Math.round(result.confidence * 100)}% confidence` : ""}
            </span>
          </div>
          <p style={{ fontSize: "var(--tb-font-size-sm)", lineHeight: 1.6, color: "var(--tb-color-text)" }}>
            {result.summary}
          </p>
        </div>
      )}
    </div>
  );
}
