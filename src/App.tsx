import React, { useEffect, useMemo, useState } from "react";

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
  const normalized = value
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^0-9.]/g, "");
  return normalized ? Number(normalized) : 0;
}

function toDraft(value: number) {
  return formatNumber(Math.max(value, 0));
}

function integerDigits(value: string) {
  return value.split(",")[0].replace(/\D/g, "");
}

function formatIntegerDraft(value: string) {
  const digits = integerDigits(value);
  return digits ? formatNumber(Number(digits)) : "0";
}

type LimitKey = "merchant" | "internet" | "atm";
type Sheet = "none" | "menu" | "edit";
type ActiveInput = "available" | "total";
type InfoState = null | "internetRaisedMerchant" | "merchantLoweredInternet";
type BaseIcon = "bank" | "internet" | "atm";
type UiIcon = BaseIcon | "pin" | "history" | "lock" | "more" | "settings" | "mobile" | "bell" | "branch";

type LimitConfig = {
  title: string;
  overviewTitle: string;
  editTitle: string;
  menuTitle: string;
  icon: BaseIcon;
  spent: number;
};

const CONFIG: Record<LimitKey, LimitConfig> = {
  merchant: {
    title: "Platby u obchodníků",
    overviewTitle: "u obchodníků",
    editTitle: "Denní limity pro platby u obchodníků",
    menuTitle: "Limit u obchodníků",
    icon: "bank",
    spent: 10162.69,
  },
  internet: {
    title: "Platby na internetu",
    overviewTitle: "na internetu",
    editTitle: "Denní limity pro platby na internetu",
    menuTitle: "Limit na internetu",
    icon: "internet",
    spent: 8487.75,
  },
  atm: {
    title: "Výběry z bankomatu",
    overviewTitle: "z bankomatu",
    editTitle: "Denní limity pro výběry z bankomatu",
    menuTitle: "Limit výběru z bankomatu",
    icon: "atm",
    spent: 0,
  },
};

const initialTotals: Record<LimitKey, number> = {
  merchant: 50000,
  internet: 20000,
  atm: 43000,
};

function Icon({ type, size = 24 }: { type: UiIcon; size?: number }) {
  if (type === "bank") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 10.5 12 5l9 5.5v1.5H3v-1.5Zm2 3h2v4H5v-4Zm4 0h2v4H9v-4Zm4 0h2v4h-2v-4Zm4 0h2v4h-2v-4ZM3 19h18v2H3v-2Z" />
      </svg>
    );
  }

  if (type === "internet") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.93 9h-3.05a15.6 15.6 0 0 0-1.17-5.02A8.03 8.03 0 0 1 18.93 11ZM12 4.04c.82 1 1.74 3.18 1.92 6.96h-3.84C10.26 7.22 11.18 5.05 12 4.04ZM9.29 5.98A15.6 15.6 0 0 0 8.12 11H5.07a8.03 8.03 0 0 1 4.22-5.02ZM5.07 13h3.05c.14 1.83.56 3.53 1.17 5.02A8.03 8.03 0 0 1 5.07 13Zm4.99 0h3.88c-.18 3.78-1.1 5.95-1.94 6.96-.84-1.01-1.76-3.18-1.94-6.96Zm4.65 5.02A15.58 15.58 0 0 0 15.88 13h3.05a8.03 8.03 0 0 1-4.22 5.02Z" />
      </svg>
    );
  }

  if (type === "atm") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2v-6h2v-2h-2v-1c0-.55.45-1 1-1h1V8h-2a3 3 0 0 0-3 3v1H9v2h3v6H7a3 3 0 0 1-3-3V7Z" />
      </svg>
    );
  }

  if (type === "pin") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 11a5 5 0 0 1 10 0v1h1a2 2 0 0 1 2 2v5H4v-5a2 2 0 0 1 2-2h1v-1Zm2 0v1h6v-1a3 3 0 1 0-6 0ZM8 15h2v2H8v-2Zm3 0h2v2h-2v-2Zm3 0h2v2h-2v-2Z" />
      </svg>
    );
  }

  if (type === "history") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 5a7 7 0 1 1-6.32 4H3V7h2v2.1A9 9 0 1 0 12 3v2Zm1 3v4.59l2.7 2.7-1.4 1.41L11 13.41V8h2Z" />
      </svg>
    );
  }

  if (type === "lock") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 10V8a5 5 0 1 1 10 0v2h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h1Zm2 0h6V8a3 3 0 1 0-6 0v2Z" />
      </svg>
    );
  }

  if (type === "more") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="6" cy="12" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="18" cy="12" r="2" />
      </svg>
    );
  }

  if (type === "settings") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="m19.14 12.94.04-.94-.04-.94 2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.24 7.24 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.58.23-1.12.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.7 8.48a.5.5 0 0 0 .12.64l2.03 1.58-.04.94.04.94-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.4 1.05.71 1.63.94l.36 2.54a.5.5 0 0 0 .49.42h3.8a.5.5 0 0 0 .49-.42l.36-2.54c.58-.23 1.13-.54 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z" />
      </svg>
    );
  }

  if (type === "mobile") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm4 17.5a1 1 0 1 0 0 .01V19.5Z" />
      </svg>
    );
  }

  if (type === "bell") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2Z" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 19h18v2H3v-2Zm2-2V7h14v10H5Zm2-8v6h10V9H7Zm11.7-5.7 1.4 1.4-2.4 2.4-1.4-1.4 2.4-2.4ZM5.3 3.3l2.4 2.4-1.4 1.4-2.4-2.4 1.4-1.4Z" />
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
  icon: BaseIcon;
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

function QuickAction({
  label,
  icon,
  color = "blue",
  onClick,
}: {
  label: string;
  icon: "pin" | "history" | "lock" | "more";
  color?: "blue" | "red" | "light";
  onClick?: () => void;
}) {
  const circleBg =
    color === "red" ? "bg-[#FCE8E8]" : color === "light" ? "bg-[#EEF3FF]" : "bg-[#2F66F3]";
  const circleText = color === "red" ? "text-[#E0483A]" : color === "light" ? "text-[#2F66F3]" : "text-white";
  const labelColor = color === "red" ? "text-[#E0483A]" : "text-[#2F66F3]";

  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-2">
      <div className={`flex h-[44px] w-[44px] items-center justify-center rounded-full ${circleBg} ${circleText}`}>
        <Icon type={icon} size={20} />
      </div>
      <div className={`text-[14px] leading-none font-medium ${labelColor}`}>{label}</div>
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

function MenuRow({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
    >
      <div className="flex items-center gap-3">
        <div className="text-[#2F66F3]">{icon}</div>
        <div className="text-[16px] leading-none text-neutral-900">{label}</div>
      </div>
      <div className="text-[#2F66F3]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </button>
  );
}

export default function LimitsSingleEditPrototype() {
  const [sheet, setSheet] = useState<Sheet>("none");
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

  const closeSheet = () => {
    setSheet("none");
    setInfo(null);
    setReplaceOnNextDigit(false);
  };

  const openMenu = () => {
    setSheet("menu");
    setInfo(null);
    setReplaceOnNextDigit(false);
  };

  const openEdit = (key: LimitKey) => {
    const total = values[key];
    const available = Math.max(total - CONFIG[key].spent, 0);

    setSelectedLimit(key);
    setActiveInput("available");
    setDrafts({ available: toDraft(available), total: toDraft(total) });
    setReplaceOnNextDigit(true);
    setInfo(null);
    setSheet("edit");
  };

  const applyTotal = (key: LimitKey, nextTotalRaw: number) => {
    const minTotal = CONFIG[key].spent;
    const nextTotal = Math.max(nextTotalRaw, minTotal);
    const nextValues = { ...values, [key]: nextTotal };

    setValues(nextValues);
    setInfo(null);

    return nextValues;
  };

  const updateActiveInput = (nextDraft: string) => {
    const formattedDraft = formatIntegerDraft(nextDraft);
    const parsed = parseNumber(formattedDraft);
    const spent = CONFIG[selectedLimit].spent;

    if (activeInput === "available") {
      const nextValues = applyTotal(selectedLimit, parsed + spent);
      const visibleTotal = nextValues[selectedLimit];

      setDrafts({
        available: formattedDraft,
        total: toDraft(visibleTotal),
      });
      return;
    }

    const nextValues = applyTotal(selectedLimit, parsed);
    const visibleTotal = nextValues[selectedLimit];
    const visibleAvailable = Math.max(visibleTotal - spent, 0);

    setDrafts({
      available: toDraft(visibleAvailable),
      total: formattedDraft,
    });
  };

  const handleDigit = (digit: string) => {
    const current = integerDigits(drafts[activeInput]);
    const nextRaw = replaceOnNextDigit || current === "0" ? digit : `${current}${digit}`;
    const next = formatNumber(Number(nextRaw));

    setReplaceOnNextDigit(false);
    updateActiveInput(next);
  };

  const handleBackspace = () => {
    const current = integerDigits(drafts[activeInput]);
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
    closeSheet();
  };

  useEffect(() => {
    if (sheet !== "edit") return;

    const timer = window.setTimeout(() => {
      if (selectedLimit === "merchant" && values.internet > values.merchant) {
        setValues((prev) => ({ ...prev, internet: prev.merchant }));
        setInfo("merchantLoweredInternet");
      }

      if (selectedLimit === "internet" && values.internet > values.merchant) {
        setValues((prev) => ({ ...prev, merchant: prev.internet }));
        setInfo("internetRaisedMerchant");
      }
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [sheet, selectedLimit, values.merchant, values.internet]);

  const selectedConfig = CONFIG[selectedLimit];
  const selectedTotal = values[selectedLimit];
  const selectedAvailable = Math.max(selectedTotal - selectedConfig.spent, 0);
  const availablePercent = selectedTotal > 0 ? (selectedAvailable / selectedTotal) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#D9D9D9] py-4">
      <div className="relative mx-auto min-h-screen w-full max-w-[375px] overflow-hidden bg-[#F3F4F6] px-3 pt-5 pb-8 text-neutral-950">
        <div>
          <div className="flex items-center justify-between px-1 text-[17px] font-semibold">
            <div>
              Karta <span className="text-[#2F66F3]">Standard</span>
            </div>
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

          <div className="mt-7 flex items-start justify-around">
            <QuickAction label="Ukázat PIN" icon="pin" color="blue" />
            <QuickAction label="Historie" icon="history" color="light" />
            <QuickAction label="Zablokovat" icon="lock" color="red" />
            <QuickAction label="Další" icon="more" color="light" onClick={openMenu} />
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

        {sheet === "menu" && (
          <div className="absolute inset-0 z-20 bg-black/15">
            <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-[#F3F4F6] px-3 pt-4 pb-6 shadow-2xl">
              <div className="relative">
                <div className="mx-auto h-[4px] w-[36px] rounded-full bg-neutral-400" />
                <button
                  type="button"
                  onClick={closeSheet}
                  className="absolute right-0 top-[-2px] flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 text-[18px] text-neutral-500"
                >
                  ×
                </button>
              </div>

              <div className="mt-7 rounded-[12px] bg-[#2F66F3] px-4 py-3 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[16px] font-semibold">Standard</div>
                    <div className="mt-1 text-[14px] opacity-95">5312 22** **** 9010</div>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-[14px] bg-white">
                <MenuRow icon={<Icon type="bank" size={20} />} label={CONFIG.merchant.menuTitle} onClick={() => openEdit("merchant")} />
                <MenuRow icon={<Icon type="internet" size={20} />} label={CONFIG.internet.menuTitle} onClick={() => openEdit("internet")} />
                <MenuRow icon={<Icon type="atm" size={20} />} label={CONFIG.atm.menuTitle} onClick={() => openEdit("atm")} />
                <MenuRow icon={<Icon type="settings" size={20} />} label="Nastavení karty" />
              </div>

              <div className="mt-4 overflow-hidden rounded-[14px] bg-white">
                <MenuRow icon={<Icon type="mobile" size={20} />} label="Platební karty v mobilu" />
              </div>

              <div className="mt-4 overflow-hidden rounded-[14px] bg-white">
                <MenuRow icon={<Icon type="bell" size={20} />} label="Oznámení o platbách" />
              </div>

              <div className="mt-4 overflow-hidden rounded-[14px] bg-white">
                <MenuRow icon={<Icon type="branch" size={20} />} label="Pobočky a bankomaty" />
              </div>
            </div>
          </div>
        )}

        {sheet === "edit" && (
          <div className="absolute inset-0 z-30 bg-black/15">
            <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-[#F3F4F6] px-3 pt-4 pb-6 shadow-2xl">
              <div className="mx-auto w-full" style={{ width: CARD_WIDTH }}>
                <div className="relative">
                  <div className="mx-auto h-[4px] w-[36px] rounded-full bg-neutral-400" />
                  <button
                    type="button"
                    onClick={closeSheet}
                    className="absolute right-0 top-[-2px] flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 text-[18px] text-neutral-500"
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
