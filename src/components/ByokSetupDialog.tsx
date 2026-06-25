import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  BYOK_CHANGED_EVENT,
  BYOK_PROVIDERS,
  confirmByokSetup,
  confirmSavedByokKey,
  getByokModelsForCategory,
  readByokConfig,
  type ByokErrorCode,
  type ByokProviderId,
  type ByokStoredConfig,
} from "../lib/byok";
import { t, type MessageKey } from "../lib/i18n";

interface ByokSetupDialogProps {
  open: boolean;
  locale: "nl" | "en";
  onClose: () => void;
  onConfirmed?: (config: ByokStoredConfig) => void;
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
}: ByokSetupDialogProps) {
  const [config, setConfig] = useState<ByokStoredConfig>(() => readByokConfig());
  const [providerId, setProviderId] = useState<ByokProviderId>("openrouter");
  const [apiKey, setApiKey] = useState("");
  const [saveKey, setSaveKey] = useState(false);
  const [useNewKey, setUseNewKey] = useState(false);
  const [allowanceInput, setAllowanceInput] = useState("");
  const [workerModelId, setWorkerModelId] = useState("");
  const [message, setMessage] = useState<MessageKey | null>(null);
  const [error, setError] = useState<MessageKey | null>(null);

  useEffect(() => {
    if (!open) return;
    const next = readByokConfig();
    setConfig(next);
    setProviderId(next.providerId);
    setSaveKey(next.saveKey);
    setUseNewKey(!next.hasSavedKey);
    setAllowanceInput(next.allowanceUsd === null ? "" : String(next.allowanceUsd));
    setApiKey("");
    setMessage(null);
    setError(null);
  }, [open]);

  // A stale key cleared mid-session (e.g. a 401 during an Ikigai run) emits the
  // changed event; re-read so the saved-key reuse button disappears live.
  useEffect(() => {
    if (!open) return;
    const onChange = () => {
      const next = readByokConfig();
      setConfig(next);
      setUseNewKey(!next.hasSavedKey);
    };
    window.addEventListener(BYOK_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(BYOK_CHANGED_EVENT, onChange);
  }, [open]);

  const provider = BYOK_PROVIDERS[providerId];
  const workerModels = useMemo(() => getByokModelsForCategory(providerId, "worker"), [providerId]);
  const selectedWorkerModelId = workerModelId || workerModels[0]?.id || "";
  const canUseSavedKey = config.hasSavedKey && !useNewKey;
  const allowanceReached =
    config.allowanceUsd !== null && config.usageUsd >= config.allowanceUsd;

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
    setApiKey("");
    setMessage("byok_ready");
    setError(null);
    onConfirmed?.(next);
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="filter-backdrop fixed inset-0 z-[80] flex items-end"
      onClick={onClose}
      data-byok-backdrop
    >
      <section
        id="byok-setup"
        role="dialog"
        aria-modal="true"
        aria-label={t("byok_title", locale)}
        className="byok-sheet ontwerp-sheet max-h-[82vh] w-full overflow-y-auto px-4 pb-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 -mx-4 border-b border-border-quiet bg-[var(--filter-surface)] px-4 pt-3 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-mono text-[11px] text-ink">{t("byok_title", locale)}</h2>
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
          <div className="byok-field">
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

          {config.hasSavedKey && !useNewKey ? (
            <div className="byok-saved-key mt-4">
              <span className="ontwerp-badge">{t("byok_saved_key", locale)}</span>
              <button
                id="byok-saved-key-confirm"
                type="button"
                className="ontwerp-button is-accent"
                onClick={confirmWithSavedKey}
              >
                {t("byok_use_saved_key", locale)}
              </button>
              <button
                type="button"
                className="ontwerp-button"
                onClick={() => setUseNewKey(true)}
              >
                {t("byok_use_new_key", locale)}
              </button>
            </div>
          ) : (
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

          <p id="byok-cost-placeholder" className="byok-cost-note mt-4">
            {t("byok_cost_placeholder", locale)}
          </p>

          {(error || message) && (
            <p
              id={error ? "byok-error" : "byok-ready"}
              className={`byok-status mt-4${error ? " is-error" : ""}`}
            >
              {t(error ?? message!, locale)}
            </p>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="ontwerp-button" onClick={onClose}>
              {t("close_label", locale)}
            </button>
            {!canUseSavedKey && (
              <button
                id="byok-confirm"
                type="button"
                className="ontwerp-button is-accent"
                onClick={confirmWithInputKey}
              >
                {t("byok_confirm", locale)}
              </button>
            )}
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
