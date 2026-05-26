import React, { useMemo, useState } from "react";

const fmt = new Intl.NumberFormat("cs-CZ", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const CARD_WIDTH = 351;

function formatNumber(value: number) {
  return fmt.format(value);
}

function formatKc(value: number) {
  return `${formatNumber(value)} Kč`;
}

function parseNumber(value: string) {
  const normalized = value.replace(/\s/g, "").replace(",", ".").replace(/[^0-9.]/g, "");
  return normalized ? Number(normalized) : 0;
}

function toDraft(value: number) {
  return formatNumber(Math.max(value, 0));
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

type LimitKey = "merchant" | "internet" | "atm";
type Screen = "overview" | "edit";
type ActiveInput = "available" | "total";
type InfoState = null | "internetRaisedMerchant" | "merchantLoweredInternet";

type LimitConfig = {
  title: string;
  overviewTitle: string;
  editTitle: string;
  icon: "bank" | "internet" | "atm";
  spent: number;
};

const CONFIG: Record<LimitKey, LimitConfig> = {
  merchant: {
    title: "Platby u obchodníků",
    overviewTitle: "u obchodníků",
    editTitle: "Denní limity pro platby u obchodníků",
    icon: "bank",
    spent: 0,
  },
  internet: {
    title: "Platby na internetu",
    overviewTitle: "na internetu",
    editTitle: "Denní limity pro platby na internetu",
    icon: "internet",
    spent: 8487.75,
  },
  atm: {
    title: "Výběry z bankomatu",
    overviewTitle: "z bankomatu",
    editTitle: "Denní limity pro výběry z bankomatu",
    icon: "atm",
    spent: 0,
  },
};

const initialTotals: Record<LimitKey, number> = {
  merchant: 50000,
  internet: 20000,
  atm: 43000,
};

function Icon({ type }: { type: LimitConfig["icon"] }) {
  if (type === "bank") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 10.5 12 5l9 5.5v1.5H3v-1.5Zm2 3h2v4H5v-4Zm4 0h2v4H9v-4Zm4 0h2v4h-2v-4Zm4 0h2v4h-2v-4ZM3 19h18v2H3v-2Z" />
      </svg>
    );
  }

  if (type === "internet") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.93 9h-3.05a15.6 15.6 0 0 0-1.17-5.02A8.03 8.03 0 0 1 18.93 11ZM12 4.04c.82 1 1.74 3.18 1.92 6.96h-3.84C10.26 7.22 11.18 5.05 12 4.04ZM9.29 5.98A15.6 15.6 0 0 0 8.12 11H5.07a8.03 8.03 0 0 1 4.22-5.02ZM5.07 13h3.05c.14 1.83.56 3.53 1.17 5.02A8.03 8.03 0 0 1 5.07 13Zm4.99 0h3.88c-.18 3.78-1.1 5.95-1.94 6.96-.84-1.01-1.76-3.18-1.94-6.96Zm4.65 5.02A15.58 15.58 0 0 0 15.88 13h3.05a8.03 8.03 0 0 1-4.22 5.02Z" />
      </svg>
    );
  }

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2v-6h2v-2h-2v-1c0-.55.45-1 1-1h1V8h-2a3 3 0 0 0-3 3v1H9v2h3v6H7a3 3 0 0 1-3-3V7Z" />
    </svg>
  );
}

function OverviewCard({
  value,
  title,
  totalLimit,
  icon,
  onClick,
}: {
  value: number;
  title: string;
  totalLimit: number;
  icon: LimitConfig["icon"];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-[110px] rounded-[12px] bg-white px-2 py-3 text-center shadow-sm border border-neutral-200 active:border-[#1463FF]"
    >
      <div className="mb-2 flex justify-center text-[#1463FF]">
        <Icon type={icon} />
      </div>
      <div className="text-[16px] leading-none font-semibold tracking-[-0.03em] text-neutral-950">
        {formatKc(value)}
      </div>
      <div className="mt-1 text-[13px] leading-[1.15] font-medium text-neutral-900">
        {title}
      </div>
      <div className="mt-1 text-[12px] leading-none text-neutral-500">
        z {formatKc(totalLimit)}
      </div>
    </button>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] bg-[#EAF1FF] px-4 py-3 text-[#1463FF]">
      <div className="flex items-start gap-3">
        <div className="mt-[2px] shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 10v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="7" r="1.2" fill="currentColor" />
          </svg>
        </div>
        <div className="text-[12px] leading-[1.3]">{children}</div>
      </div>
    </div>
  );
}

function KeypadButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-[46px] rounded-[6px] bg-white border border-neutral-300 text-[18px] font-medium text-neutral-950"
    >
      {children}
    </button>
  );
}

function EditInputRow({
  label,
  value,
  active,
  selected,
  helper,
  onClick,
}: {
  label: string;
  value: string;
  active: boolean;
  selected: boolean;
  helper?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[8px] bg-white px-3 py-3 border text-left ${
        active ? "border-[#1463FF]" : "border-neutral-200"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-[16px] leading-none font-medium text-neutral-900">{label}</div>
        <div className="min-w-[150px] text-right">
          <div className="flex items-end justify-end gap-1 whitespace-nowrap">
            <span
              className={`text-[20px] leading-none font-semibold tracking-[-0.03em] ${
                selected ? "rounded-[3px] bg-[#1463FF] px-[2px] text-white" : "text-neutral-950"
              }`}
            >
              {value || "0"}
            </span>
            <span className="text-[20px] leading-none font-semibold text-[#1463FF]">Kč</span>
          </div>
          {helper && (
            <div className="mt-2 text-[12px] leading-none text-neutral-500 whitespace-nowrap">
              {helper}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function LimitProgress({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(percent, 100));
  const circumference = 2 * Math.PI * 82;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="relative mx-auto mt-3 mb-4 h-[190px] w-[190px]">
      <svg className="absolute inset-0 rotate-[-90deg]" width="190" height="190" viewBox="0 0 190 190">
        <circle
          cx="95"
          cy="95"
          r="82"
          stroke="#EEF1F5"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
        />
        <circle
          cx="95"
          cy="95"
          r="82"
          stroke="#178A16"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-[92px] w-[110px]">
          <div className="absolute left-[8px] top-[8px] h-[52px] w-[70px] rounded-[5px] border-[4px] border-[#B9B9FF] bg-[#ECEEFF] shadow-sm">
            <div className="mx-auto mt-[14px] flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#87C9E7] text-white">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="m7 12 3 3 7-7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="absolute bottom-[8px] left-[30px] h-[4px] w-[48px] rounded-full bg-[#B9B9FF]" />
          <div className="absolute right-[4px] top-[38px] h-[64px] w-[45px] rounded-[8px] border-[4px] border-[#B9B9FF] bg-[#E9F7FF] shadow-sm">
            <div className="mx-auto mt-[18px] flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#87C9E7] text-white">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M8 12a4 4 0 0 1 8 0M6 12a6 6 0 0 1 12 0M10 12a2 2 0 0 1 4 0M12 14v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div className="absolute bottom-[5px] left-1/2 h-[2px] w-[3px] -translate-x-1/2 rounded-full bg-[#7777C9]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LimitsSingleEditPrototype() {
  const [screen, setScreen] = useState<Screen>("overview");
  const [selectedLimit, setSelectedLimit] = useState<LimitKey>("internet");
  const [activeInput, setActiveInput] = useState<ActiveInput>("available");
  const [values, setValues] = useState<Record<LimitKey, number>>(initialTotals);
  const [drafts, setDrafts] = useState({ available: "0", total: "0" });
  const [replaceOnNextDigit, setReplaceOnNextDigit] = useState(false);
  const [info, setInfo] = useState<InfoState>(null);

  const remaining = useMemo(
    () => ({
      merchant: Math.max(values.merchant - CONFIG.merchant.spent, 0),
      internet: Math.max(values.internet - CONFIG.internet.spent, 0),
      atm: Math.max(values.atm - CONFIG.atm.spent, 0),
    }),
    [values]
  );

  const openEdit = (key: LimitKey) => {
    const total = values[key];
    const available = Math.max(total - CONFIG[key].spent, 0);

    setSelectedLimit(key);
    setActiveInput("available");
    setDrafts({ available: toDraft(available), total: toDraft(total) });
    setReplaceOnNextDigit(true);
    setInfo(null);
    setScreen("edit");
  };

  const applyTotal = (key: LimitKey, nextTotalRaw: number, sourceInput: ActiveInput) => {
    const minTotal = CONFIG[key].spent;
    let nextTotal = Math.max(nextTotalRaw, minTotal);
    let nextValues = { ...values, [key]: nextTotal };
    let nextInfo: InfoState = null;

    if (key === "internet" && nextTotal > nextValues.merchant) {
      nextValues.merchant = nextTotal;
      nextInfo = "internetRaisedMerchant";
    }

    if (key === "merchant" && nextValues.internet > nextTotal) {
      nextValues.internet = nextTotal;
      nextInfo = "merchantLoweredInternet";
    }

    setValues(nextValues);
    setInfo(nextInfo);

    const visibleTotal = nextValues[key];
    const visibleAvailable = Math.max(visibleTotal - CONFIG[key].spent, 0);

    setDrafts((prev) => ({
      available: sourceInput === "available" ? toDraft(visibleAvailable) : toDraft(visibleAvailable),
      total: sourceInput === "total" ? toDraft(visibleTotal) : toDraft(visibleTotal),
    }));
  };

  const updateActiveInput = (nextDraft: string) => {
    const parsed = parseNumber(nextDraft);
    const spent = CONFIG[selectedLimit].spent;

    if (activeInput === "available") {
      const nextTotal = parsed + spent;
      applyTotal(selectedLimit, nextTotal, "available");
      setDrafts((prev) => ({ ...prev, available: nextDraft }));
      return;
    }

    applyTotal(selectedLimit, parsed, "total");
    setDrafts((prev) => ({ ...prev, total: nextDraft }));
  };

  const handleDigit = (digit: string) => {
    const current = onlyDigits(drafts[activeInput]);
    const nextRaw = replaceOnNextDigit || current === "0" ? digit : `${current}${digit}`;
    const next = formatNumber(Number(nextRaw));

    setReplaceOnNextDigit(false);
    updateActiveInput(next);
  };

  const handleBackspace = () => {
    const current = onlyDigits(drafts[activeInput]);
    const nextRaw = replaceOnNextDigit || current.length <= 1 ? "0" : current.slice(0, -1);
    const next = formatNumber(Number(nextRaw));

    setReplaceOnNextDigit(false);
    updateActiveInput(next);
  };

  const activateInput = (input: ActiveInput) => {
    setActiveInput(input);
    setReplaceOnNextDigit(true);
  };

  const handleSave = () => {
    setReplaceOnNextDigit(false);
    setInfo(null);
    setScreen("overview");
  };

  const selectedConfig = CONFIG[selectedLimit];
  const selectedTotal = values[selectedLimit];
  const selectedAvailable = Math.max(selectedTotal - selectedConfig.spent, 0);
  const availablePercent = selectedTotal > 0 ? (selectedAvailable / selectedTotal) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#D9D9D9] py-4">
      <div className="mx-auto w-full max-w-[375px] rounded-t-[28px] bg-[#F3F4F6] min-h-screen px-3 pt-5 pb-6 text-neutral-950">
        {screen === "overview" ? (
          <div>
            <div className="flex items-center justify-between px-1 text-[17px] font-semibold">
              <span>Karta Standard</span>
              <button className="text-[16px] font-medium text-[#1463FF]">Nová karta</button>
            </div>

            <div className="mt-5 rounded-[20px] bg-gradient-to-br from-[#311E72] via-[#611A7A] to-[#A41C73] px-5 py-4 text-white shadow-sm">
              <div className="flex items-start justify-between">
                <div className="text-[16px] font-semibold tracking-wide">MONETA</div>
                <div className="rounded bg-white px-2 py-1 text-[11px] text-neutral-700">Aktivní</div>
              </div>
              <div className="mt-8 text-[12px] opacity-90">4351 22** **** 9010</div>
              <div className="mt-1 flex items-center justify-between text-[11px] opacity-90">
                <span>RENÉ DOLEJŠÍ</span>
                <span>VISA</span>
              </div>
            </div>

            <div className="mt-8 px-1">
              <div className="text-[16px] leading-none font-semibold">Denní limity</div>
              <div className="mt-3 flex gap-[10px]">
                <OverviewCard
                  value={remaining.merchant}
                  title={CONFIG.merchant.overviewTitle}
                  totalLimit={values.merchant}
                  icon={CONFIG.merchant.icon}
                  onClick={() => openEdit("merchant")}
                />
                <OverviewCard
                  value={remaining.internet}
                  title={CONFIG.internet.overviewTitle}
                  totalLimit={values.internet}
                  icon={CONFIG.internet.icon}
                  onClick={() => openEdit("internet")}
                />
                <OverviewCard
                  value={remaining.atm}
                  title={CONFIG.atm.overviewTitle}
                  totalLimit={values.atm}
                  icon={CONFIG.atm.icon}
                  onClick={() => openEdit("atm")}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full" style={{ width: CARD_WIDTH }}>
            <div className="relative pt-1">
              <div className="mx-auto h-[4px] w-[36px] rounded-full bg-neutral-400" />
              <button
                type="button"
                onClick={() => setScreen("overview")}
                className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 text-[18px] text-neutral-500"
              >
                ×
              </button>
            </div>

            <div className="mt-10 text-[16px] leading-[1.2] font-semibold tracking-[-0.02em] text-neutral-900">
              {selectedConfig.editTitle}
            </div>

            <LimitProgress percent={availablePercent} />

            <div className="space-y-3">
              <EditInputRow
                label="K dispozici"
                value={drafts.available}
                active={activeInput === "available"}
                selected={activeInput === "available" && replaceOnNextDigit}
                onClick={() => activateInput("available")}
              />

              <EditInputRow
                label="Celkový limit"
                value={drafts.total}
                helper={`Vyčerpáno ${formatKc(selectedConfig.spent)}`}
                active={activeInput === "total"}
                selected={activeInput === "total" && replaceOnNextDigit}
                onClick={() => activateInput("total")}
              />

              {info === "internetRaisedMerchant" && (
                <InfoBox>
                  Protože se platby na internetu započítávají do plateb u obchodníků, navýšili jsme i jejich limit.
                </InfoBox>
              )}

              {info === "merchantLoweredInternet" && (
                <InfoBox>
                  Platby u obchodníků zahrnují také platby na internetu. Proto jsme snížili i jejich limit.
                </InfoBox>
              )}
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="mt-7 h-[48px] w-full rounded-full bg-[#2F66F3] text-[16px] font-medium text-white shadow-sm"
            >
              Uložit změny
            </button>

            <div className="mt-8 grid grid-cols-3 gap-[8px]">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((item) => (
                <KeypadButton key={item} onClick={() => handleDigit(item)}>
                  {item}
                </KeypadButton>
              ))}
              <div />
              <KeypadButton onClick={() => handleDigit("0")}>0</KeypadButton>
              <KeypadButton onClick={handleBackspace}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mx-auto">
                  <path d="M10 8 6 12l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20 7H11l-5 5 5 5h9a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </KeypadButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
