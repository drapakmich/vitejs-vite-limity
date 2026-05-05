import React, { useMemo, useState } from "react";

const fmt = new Intl.NumberFormat("cs-CZ");
const CARD_WIDTH = 351;

function formatKc(value: number) {
  return `${fmt.format(value)} Kč`;
}

function parseNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

type LimitKey = "merchant" | "internet" | "atm";
type Screen = "overview" | "edit";

type LimitConfig = {
  title: string;
  totalLimit: number;
  spent: number;
};

const CONFIG: Record<LimitKey, LimitConfig> = {
  merchant: {
    title: "Platby u obchodníků",
    totalLimit: 50000,
    spent: 25000,
  },
  internet: {
    title: "Platby na internetu",
    totalLimit: 20000,
    spent: 3000,
  },
  atm: {
    title: "Výběry z bankomatu",
    totalLimit: 50000,
    spent: 0,
  },
};

function OverviewCard({
  icon,
  value,
  title,
  totalLimit,
  onClick,
}: {
  icon: React.ReactNode;
  value: number;
  title: string;
  totalLimit: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-[110px] rounded-[12px] bg-white px-2 py-3 text-center shadow-sm border border-neutral-200 active:border-[#1463FF]"
    >
      <div className="mb-2 flex justify-center text-[#1463FF]">{icon}</div>
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

function LimitInputRow({
  title,
  value,
  totalLimit,
  active,
  onActivate,
}: {
  title: string;
  value: string;
  totalLimit: number;
  active: boolean;
  onActivate: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onActivate();
      }}
      className={`w-full rounded-[12px] bg-white px-4 py-3 border text-left cursor-pointer ${
        active ? "border-[#1463FF]" : "border-neutral-200"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 pr-2 text-[16px] leading-[1.2] font-medium tracking-[-0.02em] text-neutral-900">
          {title}
        </div>

        <div className="min-w-[190px] text-right">
          <div className="flex items-end justify-end gap-1 whitespace-nowrap">
            <span className="text-[20px] leading-none font-semibold tracking-[-0.03em] text-neutral-950">
              zbývá
            </span>
            <span className="inline-flex w-[88px] justify-end text-right text-[20px] leading-none font-semibold tracking-[-0.03em] text-neutral-950">
              {value}
              {active && (
                <span className="ml-[1px] inline-block h-[20px] w-[1.5px] translate-y-[2px] animate-pulse bg-neutral-950" />
              )}
            </span>
            <span className="text-[20px] leading-none font-semibold tracking-[-0.03em] text-neutral-950 whitespace-nowrap">
              Kč
            </span>
          </div>
          <div className="mt-2 text-[14px] leading-none text-neutral-500 whitespace-nowrap">
            z celkového limitu {formatKc(totalLimit)}
          </div>
        </div>
      </div>
    </div>
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

export default function LimitsTextInputPrototype() {
  const initialValues = useMemo(
    () => ({
      merchant: 40000,
      internet: 15000,
      atm: 20000,
    }),
    []
  );

  const [screen, setScreen] = useState<Screen>("overview");
  const [activeField, setActiveField] = useState<LimitKey>("merchant");
  const [values, setValues] = useState(initialValues);
  const [remainingDrafts, setRemainingDrafts] = useState<Record<LimitKey, string>>({
    merchant: String(initialValues.merchant - CONFIG.merchant.spent),
    internet: String(initialValues.internet - CONFIG.internet.spent),
    atm: String(initialValues.atm - CONFIG.atm.spent),
  });
  const [internetInfo, setInternetInfo] = useState<null | "up" | "down">(null);
  const [replaceOnNextDigit, setReplaceOnNextDigit] = useState(false);

  const remaining = {
    merchant: Math.max(values.merchant - CONFIG.merchant.spent, 0),
    internet: Math.max(values.internet - CONFIG.internet.spent, 0),
    atm: Math.max(values.atm - CONFIG.atm.spent, 0),
  };

  const applyMerchantRemaining = (nextRemaining: number) => {
    const safeRemaining = Math.max(nextRemaining, 0);
    const nextMerchantTotal = safeRemaining + CONFIG.merchant.spent;

    let nextInternetTotal = values.internet;
    let info: null | "up" | "down" = null;

    if (nextInternetTotal > nextMerchantTotal) {
      info = "down";
      nextInternetTotal = nextMerchantTotal;
    }

    setValues((prev) => ({ ...prev, merchant: nextMerchantTotal, internet: nextInternetTotal }));
    setRemainingDrafts((prev) => ({
      ...prev,
      merchant: String(nextMerchantTotal - CONFIG.merchant.spent),
      internet: String(nextInternetTotal - CONFIG.internet.spent),
    }));
    setInternetInfo(info);
  };

  const applyInternetRemaining = (nextRemaining: number) => {
    const safeRemaining = Math.max(nextRemaining, 0);
    const nextInternetTotal = safeRemaining + CONFIG.internet.spent;

    let nextMerchantTotal = values.merchant;
    let info: null | "up" | "down" = null;

    if (nextInternetTotal > nextMerchantTotal) {
      info = "up";
      nextMerchantTotal = nextInternetTotal;
    }

    setValues((prev) => ({ ...prev, internet: nextInternetTotal, merchant: nextMerchantTotal }));
    setRemainingDrafts((prev) => ({
      ...prev,
      internet: String(nextInternetTotal - CONFIG.internet.spent),
      merchant: String(nextMerchantTotal - CONFIG.merchant.spent),
    }));
    setInternetInfo(info);
  };

  const applyAtmRemaining = (nextRemaining: number) => {
    const safeRemaining = Math.max(nextRemaining, 0);
    const nextAtmTotal = safeRemaining + CONFIG.atm.spent;

    setValues((prev) => ({ ...prev, atm: nextAtmTotal }));
    setRemainingDrafts((prev) => ({
      ...prev,
      atm: String(nextAtmTotal - CONFIG.atm.spent),
    }));
  };

  const commitField = (key: LimitKey, raw: string) => {
    const parsed = parseNumber(raw);

    if (key === "merchant") applyMerchantRemaining(parsed);
    if (key === "internet") applyInternetRemaining(parsed);
    if (key === "atm") applyAtmRemaining(parsed);
  };

  const setValueForField = (key: LimitKey, next: string) => {
    setRemainingDrafts((prev) => ({ ...prev, [key]: next }));
    commitField(key, next);
  };

  const handleDigit = (digit: string) => {
    const current = remainingDrafts[activeField];
    const next = replaceOnNextDigit || current === "0" ? digit : `${current}${digit}`;

    setReplaceOnNextDigit(false);
    setValueForField(activeField, next);
  };

  const handleBackspace = () => {
    const current = remainingDrafts[activeField];
    const next = replaceOnNextDigit || current.length <= 1 ? "0" : current.slice(0, -1);

    setReplaceOnNextDigit(false);
    setValueForField(activeField, next);
  };

  const openEdit = (key: LimitKey) => {
    setActiveField(key);
    setReplaceOnNextDigit(true);
    setInternetInfo(null);
    setScreen("edit");
  };

  const activateEditField = (key: LimitKey) => {
    setActiveField(key);
  };

  const handleSave = () => {
    setReplaceOnNextDigit(false);
    setInternetInfo(null);
    setScreen("overview");
  };

  return (
    <div className="min-h-screen bg-[#D9D9D9] py-8">
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
              <div className="text-[16px] leading-none font-semibold">Zbývající denní limity</div>
              <div className="mt-3 flex gap-[10px]">
                <OverviewCard
                  icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 10.5 12 5l9 5.5v1.5H3v-1.5Zm2 3h2v4H5v-4Zm4 0h2v4H9v-4Zm4 0h2v4h-2v-4Zm4 0h2v4h-2v-4ZM3 19h18v2H3v-2Z"/></svg>}
                  value={remaining.merchant}
                  title="u obchodníků"
                  totalLimit={values.merchant}
                  onClick={() => openEdit("merchant")}
                />
                <OverviewCard
                  icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.93 9h-3.05a15.6 15.6 0 0 0-1.17-5.02A8.03 8.03 0 0 1 18.93 11ZM12 4.04c.82 1 1.74 3.18 1.92 6.96h-3.84C10.26 7.22 11.18 5.05 12 4.04ZM9.29 5.98A15.6 15.6 0 0 0 8.12 11H5.07a8.03 8.03 0 0 1 4.22-5.02ZM5.07 13h3.05c.14 1.83.56 3.53 1.17 5.02A8.03 8.03 0 0 1 5.07 13Zm4.99 0h3.88c-.18 3.78-1.1 5.95-1.94 6.96-.84-1.01-1.76-3.18-1.94-6.96Zm4.65 5.02A15.58 15.58 0 0 0 15.88 13h3.05a8.03 8.03 0 0 1-4.22 5.02Z"/></svg>}
                  value={remaining.internet}
                  title="na internetu"
                  totalLimit={values.internet}
                  onClick={() => openEdit("internet")}
                />
                <OverviewCard
                  icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2v-6h2v-2h-2v-1c0-.55.45-1 1-1h1V8h-2a3 3 0 0 0-3 3v1H9v2h3v6H7a3 3 0 0 1-3-3V7Z"/></svg>}
                  value={remaining.atm}
                  title="z bankomatu"
                  totalLimit={values.atm}
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
              Denní limity pro kartu Standard
            </div>

            <div className="mt-4 space-y-4">
              <LimitInputRow
                title={CONFIG.merchant.title}
                value={remainingDrafts.merchant}
                totalLimit={values.merchant}
                active={activeField === "merchant"}
                onActivate={() => activateEditField("merchant")}
              />

              {internetInfo === "down" && (
                <InfoBox>
                  Platby u obchodníků zahrnují také platby na internetu. Proto jsme snížili i jejich limit.
                </InfoBox>
              )}

              <LimitInputRow
                title={CONFIG.internet.title}
                value={remainingDrafts.internet}
                totalLimit={values.internet}
                active={activeField === "internet"}
                onActivate={() => activateEditField("internet")}
              />

              {internetInfo === "up" && (
                <InfoBox>
                  Protože se platby na internetu započítávají do plateb u obchodníků, navýšili jsme i jejich limit.
                </InfoBox>
              )}

              <LimitInputRow
                title={CONFIG.atm.title}
                value={remainingDrafts.atm}
                totalLimit={values.atm}
                active={activeField === "atm"}
                onActivate={() => activateEditField("atm")}
              />
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
