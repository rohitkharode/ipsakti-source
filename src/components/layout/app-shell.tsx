import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  BriefcaseBusiness,
  CheckSquare,
  CircleHelp,
  Database,
  FileSearch,
  Globe2,
  LayoutDashboard,
  Menu,
  Plus,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { LANGUAGES, translateKey, type TranslationKey } from "@/lib/i18n";
import type { LanguageCode } from "@/types/domain";

interface LanguageValue {
  language: LanguageCode;
  setLanguage: (value: LanguageCode) => void;
  t: (key: TranslationKey) => string;
}
const LanguageContext = createContext<LanguageValue>({
  language: "en",
  setLanguage: () => {},
  t: (key) => translateKey("en", key),
});
export const useLanguage = () => useContext(LanguageContext);

const nav = [
  { to: "/", key: "nav.overview" as TranslationKey, icon: LayoutDashboard },
  { to: "/analysis/new", key: "nav.new" as TranslationKey, icon: Plus },
  { to: "/cases", key: "nav.cases" as TranslationKey, icon: BriefcaseBusiness },
  { to: "/evidence", key: "nav.evidence" as TranslationKey, icon: FileSearch },
  { to: "/sources", key: "nav.sources" as TranslationKey, icon: Database },
];

function Sidebar({ close }: { close?: () => void }) {
  const { t } = useLanguage();
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-20 items-center justify-between border-b border-border px-6">
        <Link to="/" className="flex items-center gap-3" onClick={close}>
          <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-white ring-1 ring-border">
            <img
              src="/IP%20Shakti%20logo.png"
              alt="IP Shakti logo"
              className="size-full object-contain"
            />
          </span>
          <span>
            <strong className="block text-base text-foreground">
              IP-SAKTI
            </strong>
            <span className="text-xs text-muted-foreground">
              {t("brand.tagline")}
            </span>
          </span>
        </Link>
        {close && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("shell.closeNav")}
            title={t("shell.closeNav")}
            onClick={close}
          >
            <X />
          </Button>
        )}
      </div>
      <nav aria-label="Primary navigation" className="flex-1 space-y-1 p-3">
        {nav.map(({ icon: Icon, key, ...item }) => (
          <Link
            key={key}
            {...item}
            onClick={close}
            activeOptions={{ exact: item.to === "/" }}
            activeProps={{ className: "bg-accent text-primary font-semibold" }}
            className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Icon className="size-4" />
            {t(key)}
          </Link>
        ))}
      </nav>
      <div className="space-y-1 border-t border-border p-3">
        <Link
          to="/settings"
          onClick={close}
          className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Settings className="size-4" />
          {t("nav.settings")}
        </Link>
        <Link
          to="/help"
          onClick={close}
          className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <CircleHelp className="size-4" />
          {t("nav.help")}
        </Link>
        <div className="mt-3 flex items-center gap-3 rounded-lg bg-success-soft px-3 py-3 text-sm text-success">
          <span className="size-2 rounded-full bg-success" />
          <span>
            <strong className="block">{t("shell.status")}</strong>
            <span className="text-xs text-muted-foreground">
              {t("shell.statusDetail")}
            </span>
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3 px-2 py-2">
          <span className="grid size-9 place-items-center rounded-full bg-secondary text-xs font-bold">
            RK
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-sm">Rohit Kharode</strong>
            <span className="block text-xs text-muted-foreground">
              {t("shell.profileRole")}
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>("en");
  const t = useMemo(
    () => (key: TranslationKey) => translateKey(language, key),
    [language],
  );
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const title = useMemo(() => {
    const segment = pathname.slice(1).split("/")[0] ?? "Overview";
    return pathname === "/"
      ? t("title.overview")
      : pathname.includes("checklist")
        ? t("title.checklist")
        : pathname.startsWith("/analysis/new")
          ? t("title.new")
          : pathname.startsWith("/analysis/")
            ? t("title.result")
            : pathname.startsWith("/evidence/")
              ? t("title.evidenceDetail")
              : segment.replace(/^./, (c) => c.toUpperCase());
  }, [pathname, t]);
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div className="min-h-screen bg-background text-foreground">
        <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
          <Sidebar />
        </div>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              aria-label="Close navigation overlay"
              className="absolute inset-0 bg-foreground/30"
              onClick={() => setOpen(false)}
            />
            <div className="relative h-full w-64">
              <Sidebar close={() => setOpen(false)} />
            </div>
          </div>
        )}
        <div className="lg:pl-64">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label={t("shell.openNav")}
                title={t("shell.openNav")}
                onClick={() => setOpen(true)}
              >
                <Menu />
              </Button>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("shell.workspace")} / {title}
                </p>
                <p className="font-semibold">{title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="language">
                {t("shell.language")}
              </label>
              <div className="relative">
                <Globe2 className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                  className="h-11 rounded-lg border border-input bg-card pl-9 pr-3 text-sm"
                >
                  {LANGUAGES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                variant="ghost"
                size="icon"
                asChild
                aria-label={t("nav.help")}
                title={t("nav.help")}
              >
                <Link to="/help">
                  <CircleHelp />
                </Link>
              </Button>
            </div>
          </header>
          <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </LanguageContext.Provider>
  );
}
