import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  BYOK_CHANGED_EVENT,
  BYOK_PROVIDERS,
  BYOK_SPEND_CHANGED_EVENT,
  clearByokKey,
  clearByokSpendHistory,
  confirmByokSetup,
  confirmSavedByokKey,
  getByokModelsForCategory,
  hasConfirmedByokConfig,
  isByokLeaveGuarded,
  readByokConfig,
  readByokSpendHistory,
  readByokUsageUsd,
  updateByokConfig,
  type ByokErrorCode,
  type ByokProviderId,
  type ByokSpendRecord,
  type ByokStoredConfig,
} from "../lib/byok";
import { t, type MessageKey } from "../lib/i18n";
import { getByokPurposeLabel } from "../lib/i18n/labels";
import { ByokAllowanceMeter, ByokCostValue } from "./ByokCostValue";

// The connection surface is one sheet in two modes: "onboarding" (no key at
// all — the first-time-key-holder walkthrough) and "manage" (a saved key or an
// active session — model/budget/clear/rotate/history). The mode is derived
// from key state, not passed in, so callers just open the sheet. This realizes
// `03`'s "the wizard is the first-run instance of a persistent connection
// surface" — the same surface, leaner on first run, living afterwards.

const OPENROUTER_KEYS_URL = "https://openrouter.ai/keys";
const OPENROUTER_CREDITS_URL = "https://openrouter.ai/settings/credits";

interface ByokSetupDialogProps {
  open: boolean;
  locale: "nl" | "en";
  onClose: () => void;
  onConfirmed?: (config: ByokStoredConfig) => void;
  // Entry point, not key state: "onboarding" is the lean first-run popover
  // reached from the Ikigai gate (a bottom sheet); "settings" is the persistent
  // connection-management surface reached from the map chrome gear (a full-screen
  // in-app view). Presentation follows the entry point; the inner mode
  // (connect vs manage) still derives from key state. The full-screen view keeps
  // the session key alive — a route would drop the in-memory key (invariant 1).
  variant?: "onboarding" | "settings";
}

const ERROR_MESSAGE_KEYS: Record<ByokErrorCode, MessageKey> = {
  missing_config: "byok_error_missing_config",
  invalid_key: "byok_error_invalid_key",
  insufficient_credit: "byok_error_insufficient_credit",
  allowance_exceeded: "byok_error_allowance_exceeded",
  rate_limited: "byok_error_rate_limited",
  network_error: "byok_error_network_error",
  malformed_response: "byok_error_malformed_response",
};

function parseAllowance(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export default function ByokSetupDialog({
  open,
  locale,
  onClose,
  onConfirmed,
  variant = "onboarding",
}: ByokSetupDialogProps) {
  const [config, setConfig] = useState<ByokStoredConfig>(() => readByokConfig());
  const [providerId, setProviderId] = useState<ByokProviderId>("openrouter");
  const [apiKey, setApiKey] = useState("");
  const [saveKey, setSaveKey] = useState(false);
  const [useNewKey, setUseNewKey] = useState(false);
  const [allowanceInput, setAllowanceInput] = useState("");
  const [workerModelId, setWorkerModelId] = useState("");
  const [usageUsd, setUsageUsd] = useState(() => readByokUsageUsd());
  const [history, setHistory] = useState<ByokSpendRecord[]>(() => readByokSpendHistory());
  const [message, setMessage] = useState<MessageKey | null>(null);
  const [error, setError] = useState<MessageKey | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sessionActive, setSessionActive] = useState(() => hasConfirmedByokConfig());

  const refreshSpend = () => {
    setUsageUsd(readByokUsageUsd());
    setHistory(readByokSpendHistory());
  };

  const clearSpend = () => {
    clearByokSpendHistory();
    refreshSpend();
  };

  useEffect(() => {
    if (!open) return;
    const next = readByokConfig();
    const active = hasConfirmedByokConfig();
    setConfig(next);
    setProviderId(next.providerId);
    setSaveKey(next.saveKey);
    setUseNewKey(false);
    setAllowanceInput(next.allowanceUsd === null ? "" : String(next.allowanceUsd));
    setApiKey("");
    setMessage(null);
    setError(null);
    setSessionActive(active);
    setShowOnboarding(false);
    refreshSpend();
  }, [open]);

  // A stale key cleared mid-session (e.g. a 401 during an Ikigai run) emits the
  // changed event; re-read so the saved-key reuse button disappears live and the
  // mode flips back to onboarding when no key remains.
  useEffect(() => {
    if (!open) return;
    const onChange = () => {
      const next = readByokConfig();
      const active = hasConfirmedByokConfig();
      setConfig(next);
      setSessionActive(active);
      if (!next.hasSavedKey && !active) setUseNewKey(false);
    };
    window.addEventListener(BYOK_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(BYOK_CHANGED_EVENT, onChange);
  }, [open]);

  // Spend history updates live as requests land (during this session or an
  // in-flight Ikigai run) — re-read so the total and recent list stay current.
  useEffect(() => {
    if (!open) return;
    window.addEventListener(BYOK_SPEND_CHANGED_EVENT, refreshSpend);
    return () => window.removeEventListener(BYOK_SPEND_CHANGED_EVENT, refreshSpend);
  }, [open]);

  const provider = BYOK_PROVIDERS[providerId];
  const workerModels = useMemo(() => getByokModelsForCategory(providerId, "worker"), [providerId]);
  const selectedWorkerModelId = workerModelId || workerModels[0]?.id || "";
  const mode: "onboarding" | "manage" = config.hasSavedKey || sessionActive ? "manage" : "onboarding";
  const canUseSavedKey = config.hasSavedKey && !useNewKey && !sessionActive;
  const rotating = mode === "manage" && useNewKey;
  const leaveGuarded = isByokLeaveGuarded();
  const allowanceReached = config.allowanceUsd !== null && usageUsd >= config.allowanceUsd;

  const confirmWithSavedKey = () => {
    const next = confirmSavedByokKey({
      allowanceUsd: parseAllowance(allowanceInput),
      modelByCategory: { worker: selectedWorkerModelId },
    });
    if (!next) {
      setError("byok_missing_key");
      return;
    }
    setConfig(next);
    setSessionActive(true);
    setMessage("byok_ready");
    setError(null);
    onConfirmed?.(next);
  };

  const confirmWithInputKey = () => {
    if (!apiKey.trim()) {
      setError("byok_missing_key");
      return;
    }

    const next = confirmByokSetup({
      providerId,
      modelByCategory: { worker: selectedWorkerModelId },
      apiKey,
      saveKey,
      allowanceUsd: parseAllowance(allowanceInput),
    });

    setConfig(next);
    setSessionActive(true);
    setApiKey("");
    setUseNewKey(false);
    setMessage("byok_ready");
    setError(null);
    onConfirmed?.(next);
  };

  const handleClearKey = () => {
    if (leaveGuarded) return;
    clearByokKey();
    setSessionActive(false);
    setUseNewKey(false);
  };

  const applyChanges = () => {
    const next = updateByokConfig({
      modelByCategory: { worker: selectedWorkerModelId },
      allowanceUsd: parseAllowance(allowanceInput),
    });
    setConfig(next);
    setMessage("byok_ready");
    setError(null);
  };

  if (!open || typeof document === "undefined") return null;

  const title = mode === "manage" ? t("byok_settings_title", locale) : t("byok_title", locale);
  const showKeyInput = mode === "onboarding" || rotating;

  // Primary action depends on state: confirm a pasted key (onboarding or
  // rotate), reuse a saved key, or apply model/budget changes (manage).
  let primaryAction: { id: string; label: MessageKey; onClick: () => void } | null = null;
  if (showKeyInput && !canUseSavedKey) {
    primaryAction = { id: "byok-confirm", label: "byok_confirm", onClick: confirmWithInputKey };
  } else if (canUseSavedKey) {
    primaryAction = { id: "byok-saved-key-confirm", label: "byok_use_saved_key", onClick: confirmWithSavedKey };
  } else if (mode === "manage" && sessionActive && !useNewKey) {
    primaryAction = { id: "byok-apply", label: "byok_apply", onClick: applyChanges };
  }

  // Settings is a full-screen in-app surface (gear / cost-overlay manage);
  // onboarding is the bottom-sheet popover (Ikigai gate). Same body, two frames.
  const isSettings = variant === "settings";

  return createPortal(
    <div
      className={
        isSettings
          ? "byok-settings-fullscreen fixed inset-0 z-[80] flex flex-col"
          : "filter-backdrop fixed inset-0 z-[80] flex items-end"
      }
      onClick={isSettings ? undefined : onClose}
      data-byok-backdrop={isSettings ? undefined : true}
    >
      <section
        id="byok-setup"
        data-byok-mode={mode}
        data-byok-variant={variant}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={
          isSettings
            ? "byok-settings-view w-full flex-1 min-h-0 overflow-y-auto px-4 pb-6"
            : "byok-sheet ontwerp-sheet max-h-[82vh] w-full overflow-y-auto px-4 pb-6"
        }
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 -mx-4 border-b border-border-quiet bg-[var(--filter-surface)] px-4 pt-3 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-mono text-[11px] text-ink">{title}</h2>
              <p className="mt-1 text-[12px] text-ink-quiet">openrouter</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("close_label", locale)}
              className="ontwerp-icon-button is-compact"
            >
              x
            </button>
          </div>
        </div>

        <div className="pt-4">
          {/* Onboarding walkthrough — first-time key holders only (no key at
              all). Progressive disclosure: open by default, dismissible. */}
          {mode === "onboarding" && (
            <div className="byok-onboarding" id="byok-onboarding">
              <button
                type="button"
                className="byok-onboarding-toggle"
                aria-expanded={showOnboarding}
                onClick={() => setShowOnboarding((value) => !value)}
              >
                <span>{t("byok_first_time", locale)}</span>
                <svg
                  width="9"
                  height="13"
                  viewBox="0 0 10 14"
                  fill="none"
                  aria-hidden="true"
                  className="byok-onboarding-chevron"
                  style={{ transform: showOnboarding ? "rotate(90deg)" : "none" }}
                >
                  <path d="M2 2 L 7 7 L 2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className={`byok-onboarding-panel${showOnboarding ? " is-open" : ""}`}>
                <div className="byok-onboarding-panel-inner">
                  <div className="byok-onboarding-body">
                    <p className="byok-onboarding-lead">{t("byok_onboarding_lead", locale)}</p>
                    <ol className="byok-onboarding-steps">
                      <li>
                        <span className="byok-onboarding-step-label">{t("byok_step_pay", locale)}</span>
                        <p>{t("byok_onboarding_intro", locale)}</p>
                      </li>
                      <li>
                        <span className="byok-onboarding-step-label">{t("byok_step_key", locale)}</span>
                        <p>
                          <a id="byok-get-key-link" href={OPENROUTER_KEYS_URL} target="_blank" rel="noopener">
                            {t("byok_get_key", locale)}
                          </a>
                          {t("byok_step_key_tail", locale)}
                        </p>
                      </li>
                      <li>
                        <span className="byok-onboarding-step-label">{t("byok_step_limit", locale)}</span>
                        <p>
                          <a id="byok-spend-limit-link" href={OPENROUTER_CREDITS_URL} target="_blank" rel="noopener">
                            {t("byok_spend_limit_link", locale)}
                          </a>{" "}
                          {t("byok_spend_limit", locale)}
                        </p>
                      </li>
                    </ol>
                    <p className="byok-threat-model" id="byok-threat-model">
                      {t("byok_threat_model", locale)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Key state — manage mode only. Saved-key reuse (not yet
              session-confirmed), or an active session with clear/rotate. */}
          {mode === "manage" && !rotating && (
            <div className="byok-key-state mt-4">
              {canUseSavedKey ? (
                <>
                  <span className="byok-key-status">
                    <span className="byok-key-dot" aria-hidden="true" />
                    {t("byok_saved_key", locale)}
                  </span>
                  <div className="byok-key-actions">
                    <button
                      type="button"
                      className="ontwerp-button"
                      onClick={() => setUseNewKey(true)}
                    >
                      {t("byok_use_new_key", locale)}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="byok-key-status">
                    <span className="byok-key-dot is-live" aria-hidden="true" />
                    {t("byok_key_active", locale)}
                  </span>
                  <div className="byok-key-actions">
                    <button
                      id="byok-rotate-key"
                      type="button"
                      className="ontwerp-button"
                      disabled={leaveGuarded}
                      onClick={() => setUseNewKey(true)}
                    >
                      {t("byok_rotate_key", locale)}
                    </button>
                    <button
                      id="byok-clear-key"
                      type="button"
                      className="ontwerp-button"
                      disabled={leaveGuarded}
                      onClick={handleClearKey}
                    >
                      {t("byok_clear_key", locale)}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {showKeyInput && (
            <>
              <div className="byok-field mt-3">
                <label htmlFor="byok-api-key-input">{t("byok_api_key", locale)}</label>
                <input
                  id="byok-api-key-input"
                  type="password"
                  autoComplete="off"
                  placeholder={t("byok_api_key_placeholder", locale)}
                  value={apiKey}
                  onChange={(event) => setApiKey(event.currentTarget.value)}
                />
              </div>

              <label className="byok-checkbox mt-3">
                <input
                  id="byok-save-key"
                  type="checkbox"
                  checked={saveKey}
                  onChange={(event) => setSaveKey(event.currentTarget.checked)}
                />
                <span>{t("byok_save_key", locale)}</span>
              </label>
            </>
          )}

          <div className="byok-field mt-3">
            <label htmlFor="byok-provider">{t("byok_provider", locale)}</label>
            <div className="byok-select">
              <select
                id="byok-provider"
                value={providerId}
                onChange={(event) => setProviderId(event.currentTarget.value as ByokProviderId)}
              >
                <option value={provider.id}>{provider.label}</option>
              </select>
            </div>
          </div>

          <div className="byok-field mt-3">
            <label htmlFor="byok-model">{t("byok_model", locale)}</label>
            <div className="byok-select">
              <select
                id="byok-model"
                value={selectedWorkerModelId}
                onChange={(event) => setWorkerModelId(event.currentTarget.value)}
              >
                {workerModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={`byok-field mt-3${allowanceReached ? " is-reached" : ""}`}>
            <label htmlFor="byok-allowance-input">{t("byok_allowance", locale)}</label>
            <input
              id="byok-allowance-input"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder={t("byok_allowance_hint", locale)}
              value={allowanceInput}
              onChange={(event) => setAllowanceInput(event.currentTarget.value)}
              aria-describedby={allowanceReached ? "byok-allowance-reached" : undefined}
            />
          </div>

          {allowanceReached && (
            <p id="byok-allowance-reached" className="byok-allowance-note mt-2" role="status">
              {t("byok_allowance_reached", locale)}
            </p>
          )}

          {/* Spend + history live in the management surface, not the first-run
              walkthrough. Same browser-local posture as the key (inv 1 / 06). */}
          {mode === "manage" && (
            <div id="byok-spend" className="byok-cost-note mt-4">
              <div className="byok-spend-head">
                {config.allowanceUsd !== null && (
                  <ByokAllowanceMeter
                    usageUsd={usageUsd}
                    allowanceUsd={config.allowanceUsd}
                    label={`${usageUsd.toFixed(4)} / ${config.allowanceUsd.toFixed(4)} usd`}
                  />
                )}
                <div className="byok-spend-figures">
                  <span className="byok-spend-label">{t("byok_spent", locale)}</span>
                  <span className="byok-spend-total font-mono tabular-nums" data-byok-spend-total>
                    {usageUsd.toFixed(4)}
                    <span className="byok-cost-unit">usd</span>
                  </span>
                  {config.allowanceUsd !== null && (
                    <span className="byok-spend-allowance font-mono tabular-nums">
                      {t("byok_allowance", locale)} {config.allowanceUsd.toFixed(4)} usd
                    </span>
                  )}
                </div>
              </div>

              <div className="byok-spend-recent">
                <div className="byok-spend-recent-head">
                  <span className="byok-spend-recent-label">{t("byok_spend_recent", locale)}</span>
                  {history.length > 0 && (
                    <button type="button" className="byok-spend-clear" onClick={clearSpend}>
                      {t("byok_spend_clear", locale)}
                    </button>
                  )}
                </div>
                {history.length === 0 ? (
                  <div className="byok-spend-empty">
                    <span className="byok-fallow" aria-hidden="true" />
                    <span>{t("byok_spend_empty", locale)}</span>
                  </div>
                ) : (
                  <ul id="byok-spend-history" className="byok-spend-list">
                    {history.slice(0, 6).map((record) => (
                      <li key={record.id} className="byok-spend-row">
                        <span className="byok-spend-purpose">{getByokPurposeLabel(record.purpose, locale)}</span>
                        <ByokCostValue landed costUsd={record.costUsd} locale={locale} className="byok-spend-amount" />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Threat model stays re-readable in manage mode (not just first run). */}
          {mode === "manage" && (
            <p className="byok-threat-model byok-cost-note mt-3">{t("byok_threat_model", locale)}</p>
          )}

          {(error || message) && (
            <p
              id={error ? "byok-error" : "byok-ready"}
              className={`byok-status mt-4${error ? " is-error" : ""}`}
            >
              {t(error ?? message!, locale)}
            </p>
          )}

          {/* Action row: the BYOM link sits on the left, the close/confirm
              buttons on the right. The bare mark is inlined (not <img>) so it
              inherits the host ink via currentColor; the mono wordmark is
              uppercase per the app's utility-mark convention. This is the
              lightweight affordance, not the canonical badge. */}
          <div className="mt-5 flex items-center justify-between gap-2">
            <a
              href="https://byom.flkp.nl/"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 text-[11px] text-ink-quiet no-underline transition-colors hover:text-ink"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
                className="shrink-0"
              >
                <rect x="2" y="8" width="12" height="12" fill="currentColor" opacity="0.5" />
                <rect x="10" y="4" width="12" height="12" fill="currentColor" />
              </svg>
              <span className="font-mono uppercase tracking-[0.14em]">byom</span>
            </a>
            <div className="flex gap-2">
              <button type="button" className="ontwerp-button" onClick={onClose}>
                {t("close_label", locale)}
              </button>
              {primaryAction && (
                <button
                  id={primaryAction.id}
                  type="button"
                  className="ontwerp-button is-accent"
                  onClick={primaryAction.onClick}
                >
                  {t(primaryAction.label, locale)}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>,
    document.body
  );
}

export function getByokErrorMessageKey(error: ByokErrorCode): MessageKey {
  return ERROR_MESSAGE_KEYS[error];
}
