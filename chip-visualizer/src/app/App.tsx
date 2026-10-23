import {
  useState,
  useEffect,
  useRef,
  useCallback,
  lazy,
  Suspense,
} from "react";
import type { CSSProperties } from "react";
import {
  Cpu,
  PanelLeftClose,
  PanelRightClose,
  Maximize,
  Minimize,
  Sun,
  Moon,
  Settings2,
  RotateCcw,
  Focus,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Square,
  SkipBack,
  Layers3,
  Box,
  Network,
  Calculator,
  Cable,
  Workflow,
  GitBranch,
  Activity,
  Timer,
  Zap,
  LayoutGrid,
  Waves,
  ShieldCheck,
  Columns2,
  Database,
  Scan,
  Camera,
  X,
  Upload,
  CircleHelp,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { I18nProvider, useI18n } from "../i18n/I18n";
import type { MessageKey } from "../i18n/dictionaries";
import type { Page, Project, Geometry, Waveform } from "../types/data";
import {
  loadProject,
  validateGeometry,
  validateWaveform,
} from "../data-adapters/project";
import { defaultSettings, advanceAnimation, explodeAt } from "./settings";
import type { ViewSettings } from "./settings";
import { usePageNavigation } from "./navigation";
import { Badge, Note, Range, Source } from "../components/UI";
import Controls from "../layout/Controls";
import type { CameraCommand } from "../viewers/ChipViewer";
import { architectureGeometry } from "../../demo-data/architecture";
import { stages } from "../physical-design/stages";
const ChipViewer = lazy(() => import("../viewers/ChipViewer"));
const Analytics = lazy(() => import("../analytics/Analytics"));
const GemmSimulator = lazy(() => import("../gemm/GemmSimulator"));
const AxiSimulator = lazy(() => import("../axi/AxiSimulator"));
const WaveformViewer = lazy(() => import("../waveforms/WaveformViewer"));
const Architecture = lazy(() => import("../architecture/Architecture"));
const navGroups: { title: MessageKey; items: [Page, LucideIcon][] }[] = [
  {
    title: "explore",
    items: [
      ["overview", LayoutGrid],
      ["explorer", Box],
      ["architecture", Network],
    ],
  },
  {
    title: "simulate",
    items: [
      ["gemm", Calculator],
      ["axi", Cable],
      ["flow", Workflow],
      ["eco", GitBranch],
      ["waveform", Activity],
    ],
  },
  {
    title: "analyze",
    items: [
      ["timing", Timer],
      ["power", Zap],
      ["area", Layers3],
      ["integrity", Waves],
      ["verification", ShieldCheck],
      ["comparison", Columns2],
    ],
  },
  { title: "resources", items: [["sources", Database]] },
];
const analyticPages: Page[] = [
  "overview",
  "eco",
  "timing",
  "power",
  "area",
  "integrity",
  "verification",
  "comparison",
  "sources",
];
export default function App() {
  return (
    <I18nProvider>
      <Application />
    </I18nProvider>
  );
}
function Application() {
  const { t, lang, setLang } = useI18n();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState("");
  const {
    page,
    analyticPage,
    visited,
    navigate: changePage,
  } = usePageNavigation();
  const [s, setS] = useState<ViewSettings>(defaultSettings);
  const [selected, setSelected] = useState<string | null>(null);
  const [left, setLeft] = useState(() => window.innerWidth > 760),
    [right, setRight] = useState(() => window.innerWidth > 1000),
    [bottom, setBottom] = useState(true),
    [focus, setFocus] = useState(false);
  const [leftWidth, setLeftWidth] = useState(224),
    [rightWidth, setRightWidth] = useState(296),
    [bottomHeight, setBottomHeight] = useState(170);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("gemm-theme") ?? "dark",
  );
  const [modal, setModal] = useState<"settings" | "help" | null>(null);
  const [notice, setNotice] = useState("");
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const [waveform, setWaveform] = useState<Waveform | null>(null);
  const [command, setCommand] = useState<CameraCommand>({
    view: "isometric",
    id: 0,
  });
  const [stage, setStage] = useState(9);
  const [flowPlay, setFlowPlay] = useState(false);
  const [stageSpeed, setStageSpeed] = useState(3);
  const [bottomTab, setBottomTab] = useState<"timeline" | "logs" | "metrics">(
    "timeline",
  );
  const captureRef = useRef<(() => void) | null>(null);
  const layoutInput = useRef<HTMLInputElement>(null),
    waveInput = useRef<HTMLInputElement>(null);
  const is3d = ["explorer", "architecture", "flow"].includes(page);
  const isAnalytics = analyticPages.includes(page);
  const load = useCallback(() => {
    setError("");
    loadProject()
      .then(setProject)
      .catch((e) => setError(String(e)));
  }, []);
  useEffect(load, [load]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("gemm-theme", theme);
  }, [theme]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  const patch = useCallback(
    (values: Partial<ViewSettings>) => setS((old) => ({ ...old, ...values })),
    [],
  );
  const camera = useCallback(
    (view: CameraCommand["view"]) =>
      setCommand((old) => ({ view, id: old.id + 1 })),
    [],
  );
  const navigate = (next: Page) => {
    changePage(next);
    if (next === "architecture") setSelected(null);
  };
  useEffect(() => {
    if (!s.playing || !is3d) return;
    let last = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      setS((v) => {
        const next = advanceAnimation(v.progress, dt, v.speed, v.loop);
        return {
          ...v,
          ...next,
          explode: v.autoExplode
            ? explodeAt(next.progress) * v.distance
            : v.explode,
        };
      });
    }, 33);
    return () => clearInterval(interval);
  }, [s.playing, is3d]);
  useEffect(() => {
    if (!flowPlay || page !== "flow") return;
    const interval = setInterval(
      () =>
        setStage((v) => {
          if (v === 9) {
            setFlowPlay(false);
            return v;
          }
          return v + 1;
        }),
      stageSpeed * 1000,
    );
    return () => clearInterval(interval);
  }, [flowPlay, page, stageSpeed]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).closest("input,select,textarea,button") ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      )
        return;
      if (e.code === "Space" && is3d) {
        e.preventDefault();
        patch({ playing: !s.playing });
      }
      if (e.key.toLowerCase() === "f") setFocus((v) => !v);
      if (e.key === "Escape") setFocus(false);
      if (e.key.toLowerCase() === "r") camera("isometric");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [camera, is3d, patch, s.playing]);
  const resetLayout = () => {
    setLeft(true);
    setRight(true);
    setBottom(true);
    setFocus(false);
    setLeftWidth(224);
    setRightWidth(296);
    setBottomHeight(170);
  };
  const fullscreen = () => {
    const action = document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen();
    action.catch(() => setNotice(t("fullscreen") + ": " + t("unavailable")));
  };
  const startResize = (
    e: React.PointerEvent,
    which: "left" | "right" | "bottom",
  ) => {
    e.preventDefault();
    const startX = e.clientX,
      startY = e.clientY;
    const original =
      which === "left"
        ? leftWidth
        : which === "right"
          ? rightWidth
          : bottomHeight;
    const move = (event: PointerEvent) => {
      if (which === "left")
        setLeftWidth(
          Math.min(320, Math.max(176, original + event.clientX - startX)),
        );
      if (which === "right")
        setRightWidth(
          Math.min(420, Math.max(250, original - event.clientX + startX)),
        );
      if (which === "bottom")
        setBottomHeight(
          Math.min(380, Math.max(100, original - event.clientY + startY)),
        );
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  async function importFile(file: File | undefined, kind: "layout" | "wave") {
    if (!file) return;
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error("Dataset >20 MiB");
      const data: unknown = JSON.parse(await file.text());
      if (kind === "layout") {
        setGeometry(validateGeometry(data));
        setSelected(null);
        camera("fit");
        navigate("explorer");
      } else {
        setWaveform(validateWaveform(data));
        navigate("waveform");
      }
      setNotice(t("loaded"));
      setModal(null);
    } catch {
      setNotice(t("importError"));
    }
  }
  const capture = () => {
    try {
      captureRef.current?.();
    } catch {
      setNotice(t("captureFailed"));
    }
  };
  if (!project)
    return (
      <div className="loading-screen">
        <Cpu size={48} />
        <h2>
          GEMM32 <span>Silicon Explorer</span>
        </h2>
        <p>{t(error ? "loadError" : "loading")}</p>
        {error && (
          <>
            <code>{error}</code>
            <button className="button accent" onClick={load}>
              {t("retry")}
            </button>
          </>
        )}
      </div>
    );
  const g =
    page === "architecture"
      ? architectureGeometry
      : (geometry ?? project.floorplan);
  const showLeft = left && !focus,
    showRight = right && !focus && is3d;
  const style = {
    "--left-width": showLeft ? `${leftWidth}px` : "0px",
    "--right-width": showRight ? `${rightWidth}px` : "0px",
    "--bottom-height": bottom && !focus ? `${bottomHeight}px` : "0px",
  } as CSSProperties;
  const viewSettings: ViewSettings =
    page === "flow"
      ? {
          ...s,
          power: stage >= 2 && stage < 6,
          clock: stage >= 4 && stage < 6,
          routes: stage >= 6,
          metal: s.metal,
        }
      : s;
  const stageInfo = stages[stage];
  return (
    <div className={`application ${focus ? "focus-layout" : ""}`} style={style}>
      <header className="topbar">
        <button className="brand" onClick={() => navigate("overview")}>
          <span className="brand-mark">
            <Cpu size={25} />
          </span>
          <span>
            GEMM32 <strong>ASIC SKY130</strong>
            <small>SILICON EXPLORER</small>
          </span>
        </button>
        <div className="header-divider" />
        <div className="project-switch">
          <span className="online-dot" />
          <span>
            gemm_ip <small> / final ECO</small>
          </span>
          <ChevronDown size={13} />
        </div>
        <Badge tone="green">{t("signoffTT")}</Badge>
        <div className="topbar-spacer" />
        <span className="data-mode">
          <span className="online-dot" />
          {t(
            page === "gemm" ||
              page === "axi" ||
              page === "architecture" ||
              (is3d && g.kind === "DEMO") ||
              (page === "waveform" && waveform?.kind === "DEMO")
              ? "demo"
              : page === "flow" || page === "eco" || page === "waveform"
                ? "replay"
                : "real",
          )}
        </span>
        <button
          className="language-switch"
          aria-label={t("language")}
          onClick={() => setLang(lang === "en" ? "vi" : "en")}
        >
          <span className={lang === "en" ? "active" : ""}>EN</span>
          <span className={lang === "vi" ? "active" : ""}>VI</span>
        </button>
        <button
          className="icon-button"
          title={t("theme")}
          onClick={() => setTheme((v) => (v === "dark" ? "light" : "dark"))}
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button
          className="icon-button"
          title={t("settings")}
          onClick={() => setModal("settings")}
        >
          <Settings2 size={17} />
        </button>
        <button
          className="icon-button"
          title={t("fullscreen")}
          onClick={fullscreen}
        >
          <Maximize size={17} />
        </button>
      </header>
      <div className="workbench">
        {showLeft && (
          <aside className="sidebar">
            <button
              className="icon-button mobile-nav-close"
              title={t("close")}
              onClick={() => setLeft(false)}
            >
              <X size={17} />
            </button>
            <div className="sidebar-project">
              <span className="eyebrow">{t("workspace")}</span>
              <strong>
                <Cpu size={16} />
                GEMM32 / INT8
              </strong>
              <span>SKY130A · 130 nm CMOS</span>
            </div>
            <nav>
              {navGroups.map((group) => (
                <div className="nav-group" key={group.title}>
                  <h4>{t(group.title)}</h4>
                  {group.items.map(([id, Icon]) => (
                    <button
                      data-testid={`nav-${id}`}
                      key={id}
                      className={page === id ? "active" : ""}
                      onClick={() => navigate(id)}
                    >
                      <Icon size={16} />
                      <span>{t(id)}</span>
                      {id === "explorer" && <small>3D</small>}
                      {page === id && <i />}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
            <div className="sidebar-footer">
              <span className="online-dot" />
              <div>
                {t("sourceBacked")}
                <small>OpenLane / OpenROAD</small>
              </div>
              <button
                className="icon-button"
                title={t("help")}
                onClick={() => setModal("help")}
              >
                <CircleHelp size={17} />
              </button>
            </div>
            <div
              className="panel-resizer left"
              role="separator"
              aria-label="Resize navigation"
              onPointerDown={(e) => startResize(e, "left")}
            />
          </aside>
        )}
        <main className="main-panel">
          <div className="workspace-toolbar">
            <div className="toolbar-left">
              <button
                className="icon-button"
                title={t("leftPanel")}
                onClick={() => setLeft((v) => !v)}
              >
                <PanelLeftClose size={17} />
              </button>
              <span className="breadcrumb">
                GEMM32 <ChevronRight size={12} />
                <strong>{t(page)}</strong>
              </span>
            </div>
            <div className="toolbar-actions">
              <button
                className={`icon-button ${focus ? "active" : ""}`}
                title={t(focus ? "exitFocus" : "focusMode")}
                onClick={() => setFocus((v) => !v)}
              >
                {focus ? <Minimize size={16} /> : <Focus size={16} />}
              </button>
              <button
                className="icon-button"
                title={t("resetLayout")}
                onClick={resetLayout}
              >
                <RotateCcw size={16} />
              </button>
              {is3d && (
                <button
                  className="icon-button"
                  title={t("rightPanel")}
                  onClick={() => setRight((v) => !v)}
                >
                  <PanelRightClose size={17} />
                </button>
              )}
            </div>
          </div>
          <div className="central-body">
            <div className={`explorer-page ${is3d ? "" : "hidden"}`}>
              <div className="explorer-heading">
                <div>
                  <span className="eyebrow">
                    {page === "flow"
                      ? "RTL → GDS"
                      : page === "architecture"
                        ? t("architectureHeading")
                        : t("physicalHierarchyHeading")}
                  </span>
                  <h1>
                    {t(
                      page === "flow"
                        ? "flowTitle"
                        : page === "architecture"
                          ? "architecture"
                          : "titleExplorer",
                    )}
                  </h1>
                  <p>
                    {t(
                      page === "flow"
                        ? "flowSubtitle"
                        : page === "architecture"
                          ? "archNote"
                          : "subtitleExplorer",
                    )}
                  </p>
                </div>
              </div>
              <div className="explorer-stats">
                <div>
                  <Cpu size={17} />
                  <strong>1,024</strong>
                  <span>PEs</span>
                </div>
                <div>
                  <Layers3 size={17} />
                  <strong>32</strong>
                  <span>{t("peRows")}</span>
                </div>
                <div>
                  <Database size={17} />
                  <strong>160</strong>
                  <span>KiB SRAM</span>
                </div>
                <div>
                  <Timer size={17} />
                  <strong>50</strong>
                  <span>MHz · TT</span>
                </div>
              </div>
              {page === "architecture" && (
                <Suspense fallback={null}>
                  <Architecture project={project} />
                </Suspense>
              )}
              <div className="viewport-shell">
                <div className="viewport-topline">
                  <div className="view-pills">
                    <button
                      className={page !== "architecture" ? "active" : ""}
                      onClick={() => navigate("explorer")}
                    >
                      <Layers3 size={13} />
                      {t("physical")}
                    </button>
                    <button
                      className={page === "architecture" ? "active" : ""}
                      onClick={() => navigate("architecture")}
                    >
                      <Network size={13} />
                      {t("array")}
                    </button>
                  </div>
                  <Badge tone={g.kind === "DEMO" ? "amber" : "cyan"}>
                    {t(
                      g.kind === "DEMO"
                        ? "conceptual"
                        : g.kind === "RECONSTRUCTED"
                          ? "reconstruction"
                          : "extracted",
                    )}
                  </Badge>
                </div>
                <Suspense
                  fallback={
                    <div className="loading-screen">{t("loading")}</div>
                  }
                >
                  <ChipViewer
                    geometry={g}
                    settings={viewSettings}
                    selected={selected}
                    onSelect={setSelected}
                    command={command}
                    active={is3d}
                    captureRef={captureRef}
                    stage={page === "flow" ? stage : 9}
                  />
                </Suspense>
                <div className="viewport-side-tools">
                  <button
                    className="icon-button"
                    title={t("fit")}
                    onClick={() => camera("fit")}
                  >
                    <Scan size={17} />
                  </button>
                  <button
                    className="icon-button"
                    title={t("top")}
                    onClick={() => camera("top")}
                  >
                    <Box size={17} />
                  </button>
                  <button
                    className="icon-button"
                    title={t("screenshot")}
                    onClick={capture}
                  >
                    <Camera size={17} />
                  </button>
                </div>
                {s.legend && (
                  <div className="viewport-legend">
                    <span>
                      <i style={{ background: "#3ec9b6" }} />
                      {page === "architecture" ? "PE" : t("peRows")}
                    </span>
                    <span>
                      <i style={{ background: "#5088bc" }} />
                      SRAM
                    </span>
                    <span>
                      <i style={{ background: "#c79456" }} />
                      AXI
                    </span>
                  </div>
                )}
                <div className="viewport-footer">
                  <span>{t("orbitHelp")}</span>
                  <span className="mono">
                    {g.kind === "DEMO"
                      ? "32 × 32 PE · DEMO"
                      : `${(g.die[0] / 1000).toFixed(3)} × ${(g.die[1] / 1000).toFixed(3)} mm`}
                  </span>
                </div>
                <div className="axis-gizmo">
                  <span>X</span>
                  <span>Y</span>
                  <span>Z</span>
                </div>
              </div>
              {!focus && (
                <div className="geometry-caption">
                  <span className="online-dot" />
                  {t(
                    g.kind === "RECONSTRUCTED"
                      ? "sourceGeometry"
                      : g.kind === "DEMO"
                        ? "archNote"
                        : "importedGeometryNote",
                  )}
                </div>
              )}
              <div
                className={`bottom-panel ${!bottom || focus ? "collapsed" : ""}`}
                style={{ height: bottom && !focus ? bottomHeight : 0 }}
              >
                {bottom && !focus && (
                  <>
                    <div
                      className="bottom-resizer"
                      role="separator"
                      aria-label="Resize timeline"
                      onPointerDown={(e) => startResize(e, "bottom")}
                    />
                    <div className="bottom-tabs">
                      {(["timeline", "logs", "metrics"] as const).map(
                        (v, i) => (
                          <button
                            key={v}
                            className={bottomTab === v ? "active" : ""}
                            onClick={() => setBottomTab(v)}
                          >
                            {[t("flow"), t("detailEvidenceLogs"), "PPA"][i]}
                          </button>
                        ),
                      )}
                      <span className="replay-label">
                        {t("replay")} <span className="online-dot" />
                      </span>
                      <button
                        className="icon-button"
                        title={t("bottomPanel")}
                        onClick={() => setBottom(false)}
                      >
                        <ChevronDown size={15} />
                      </button>
                    </div>
                    <div className="bottom-content">
                      {bottomTab === "timeline" ? (
                        <>
                          <div className="stage-rail">
                            {stages.map((item, i) => (
                              <button
                                key={item.key}
                                className={
                                  stage === i
                                    ? "active"
                                    : i < stage
                                      ? "past"
                                      : ""
                                }
                                onClick={() => {
                                  setStage(i);
                                  setFlowPlay(false);
                                  navigate("flow");
                                }}
                              >
                                <span>
                                  {i < stage ? (
                                    <Check size={10} />
                                  ) : (
                                    String(i + 1).padStart(2, "0")
                                  )}
                                </span>
                                <small>{t(item.key)}</small>
                              </button>
                            ))}
                          </div>
                          <div className="timeline-playback">
                            <div className="play-buttons">
                              <button
                                title={t("replayButton")}
                                onClick={() => {
                                  setStage(0);
                                  setFlowPlay(true);
                                  navigate("flow");
                                }}
                              >
                                <SkipBack size={14} />
                              </button>
                              <button
                                title={t(flowPlay ? "pause" : "play")}
                                onClick={() => {
                                  if (stage === 9) setStage(0);
                                  setFlowPlay((v) => !v);
                                  navigate("flow");
                                }}
                              >
                                {flowPlay ? (
                                  <Pause size={15} />
                                ) : (
                                  <Play size={15} />
                                )}
                              </button>
                              <button
                                title={t("stop")}
                                onClick={() => {
                                  setFlowPlay(false);
                                  setStage(0);
                                }}
                              >
                                <Square size={12} />
                              </button>
                            </div>
                            <span className="mono">
                              {String(stage + 1).padStart(2, "0")} / 10
                            </span>
                            <input
                              aria-label={t("stage")}
                              type="range"
                              min={0}
                              max={9}
                              value={stage}
                              onChange={(e) => {
                                setStage(Number(e.target.value));
                                setFlowPlay(false);
                                navigate("flow");
                              }}
                            />
                            <select
                              aria-label={t("stageSpeed")}
                              value={stageSpeed}
                              onChange={(e) =>
                                setStageSpeed(Number(e.target.value))
                              }
                            >
                              {[1, 2, 3, 5, 10].map((v) => (
                                <option key={v} value={v}>
                                  {v}s / {t("stage")}
                                </option>
                              ))}
                            </select>
                          </div>
                        </>
                      ) : bottomTab === "logs" ? (
                        <div className="source-console">
                          <span className="console-tag">
                            {t(stageInfo.key)}
                          </span>
                          <code>{stageInfo.native}</code>
                          <p>{stageInfo.description[lang === "en" ? 0 : 1]}</p>
                          <Source path={stageInfo.path} />
                        </div>
                      ) : (
                        <div className="inline-metrics">
                          <span>
                            TT setup <b>+1.428 ns</b>
                          </span>
                          <span>
                            FF hold <b>+0.126 ns</b>
                          </span>
                          <span>
                            DRT / ARC <b>0 / 0</b>
                          </span>
                          <Source path={project.signoff.source} />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              {!bottom && !focus && (
                <button
                  className="expand-bottom"
                  onClick={() => setBottom(true)}
                >
                  <ChevronUp size={13} />
                  {t("bottomPanel")}
                </button>
              )}
            </div>
            <Suspense
              fallback={<div className="loading-screen">{t("loading")}</div>}
            >
              {visited.has("gemm") && (
                <div
                  className={`content-route ${page === "gemm" ? "" : "hidden"}`}
                >
                  <GemmSimulator active={page === "gemm"} />
                </div>
              )}
              {visited.has("axi") && (
                <div
                  className={`content-route ${page === "axi" ? "" : "hidden"}`}
                >
                  <AxiSimulator active={page === "axi"} />
                </div>
              )}
              {visited.has("waveform") && (
                <div
                  className={`content-route ${page === "waveform" ? "" : "hidden"}`}
                >
                  <WaveformViewer
                    project={project}
                    waveform={waveform}
                    active={page === "waveform"}
                  />
                </div>
              )}
              {isAnalytics && (
                <div className="content-route">
                  <Analytics
                    project={project}
                    page={analyticPage}
                    onNavigate={navigate}
                    active={isAnalytics}
                  />
                </div>
              )}
            </Suspense>
            {page === "flow" && (
              <div className="flow-overlay">
                <h3>
                  {String(stage + 1).padStart(2, "0")} · {t(stageInfo.key)}
                </h3>
                <code>{stageInfo.native}</code>
                <p>{stageInfo.description[lang === "en" ? 0 : 1]}</p>
                <Source path={stageInfo.path} />
                <div className="button-pair">
                  <button
                    className="button subtle small"
                    disabled={stage === 0}
                    onClick={() => setStage((v) => Math.max(0, v - 1))}
                  >
                    {t("previous")}
                  </button>
                  <button
                    className="button subtle small"
                    disabled={stage === 9}
                    onClick={() => setStage((v) => Math.min(9, v + 1))}
                  >
                    {t("next")}
                  </button>
                </div>
                <details>
                  <summary>{t("artifacts")}</summary>
                  <p>{t("noSnapshots")}</p>
                  <p>{t("executeUnavailable")}</p>
                </details>
              </div>
            )}
          </div>
          {is3d && (
            <div className="animation-bar">
              <span className="bar-label">
                <Layers3 size={14} />
                {t("animation")}
              </span>
              <button
                className="icon-button"
                title={t(s.playing ? "pause" : "play")}
                onClick={() =>
                  patch({ playing: !s.playing, autoExplode: true })
                }
              >
                {s.playing ? <Pause size={15} /> : <Play size={15} />}
              </button>
              <button
                className="icon-button"
                title={t("stop")}
                onClick={() =>
                  patch({ playing: false, progress: 0, explode: 0 })
                }
              >
                <Square size={12} />
              </button>
              <button
                className="icon-button"
                title={t("replayButton")}
                onClick={() =>
                  patch({
                    playing: true,
                    progress: 0,
                    explode: 0,
                    autoExplode: true,
                  })
                }
              >
                <RotateCcw size={13} />
              </button>
              <input
                aria-label={t("progress")}
                data-testid="animation-progress"
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={s.progress}
                onChange={(e) => {
                  const progress = Number(e.target.value);
                  patch({
                    progress,
                    playing: false,
                    explode: explodeAt(progress) * s.distance,
                  });
                }}
              />
              <span className="mono animation-percent">
                {Math.round(s.progress * 100)}%
              </span>
              <button
                className={`button small ${s.explode > 0 ? "accent" : "subtle"}`}
                onClick={() =>
                  patch({
                    explode: s.explode > 0 ? 0 : s.distance,
                    autoExplode: false,
                    playing: false,
                  })
                }
              >
                {t(s.explode > 0 ? "collapse" : "explode")}
              </button>
              <button
                className="icon-button"
                title={t("resetCamera")}
                onClick={() => camera("isometric")}
              >
                <RotateCcw size={15} />
              </button>
            </div>
          )}
        </main>
        <div className={`right-panel-wrap ${showRight ? "" : "hidden"}`}>
          <div
            className="panel-resizer right"
            role="separator"
            aria-label="Resize controls"
            onPointerDown={(e) => startResize(e, "right")}
          />
          <Controls
            geometry={g}
            project={project}
            settings={s}
            setSettings={patch}
            selected={selected}
            onSelect={setSelected}
            camera={camera}
            capture={capture}
          />
        </div>
      </div>
      <footer className="app-status">
        <span>
          <span className="online-dot" />
          {t("sourceBacked")}
        </span>
        <span>{t("researchNote")}</span>
        <span>
          Sky130A <span className="status-separator">/</span> OpenLane 1.0.2{" "}
          <span className="status-separator">/</span> v1.0
        </span>
      </footer>
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button onClick={() => setNotice("")}>
            <X size={15} />
          </button>
        </div>
      )}
      <input
        className="hidden"
        type="file"
        accept=".json,application/json"
        ref={layoutInput}
        onChange={(e) => {
          void importFile(e.target.files?.[0], "layout");
          e.target.value = "";
        }}
      />
      <input
        className="hidden"
        type="file"
        accept=".json,application/json"
        ref={waveInput}
        onChange={(e) => {
          void importFile(e.target.files?.[0], "wave");
          e.target.value = "";
        }}
      />
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={t(modal)}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-heading">
              <h2>{t(modal)}</h2>
              <button
                className="icon-button"
                title={t("close")}
                onClick={() => setModal(null)}
              >
                <X size={19} />
              </button>
            </div>
            {modal === "settings" ? (
              <>
                <label className="field-label">
                  {t("language")}
                  <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value as "en" | "vi")}
                  >
                    <option value="en">English</option>
                    <option value="vi">Tiếng Việt</option>
                  </select>
                </label>
                <button
                  className="button subtle full"
                  onClick={() => layoutInput.current?.click()}
                >
                  <Upload size={16} />
                  {t("importLayout")}
                </button>
                <button
                  className="button subtle full"
                  onClick={() => waveInput.current?.click()}
                >
                  <Upload size={16} />
                  {t("importWave")}
                </button>
                <Range
                  label={t("quality")}
                  value={s.quality === "low" ? 0 : s.quality === "high" ? 2 : 1}
                  min={0}
                  max={2}
                  onChange={(v) =>
                    patch({
                      quality: (["low", "balanced", "high"] as const)[v],
                    })
                  }
                />
                <button className="button subtle full" onClick={resetLayout}>
                  {t("resetLayout")}
                </button>
                <button
                  className="button subtle full"
                  onClick={() => {
                    setS(defaultSettings);
                    resetLayout();
                    camera("isometric");
                    setGeometry(null);
                    setWaveform(null);
                    setSelected(null);
                  }}
                >
                  {t("resetAll")}
                </button>
                <Note>{t("integrationNote")}</Note>
              </>
            ) : (
              <>
                <Note>{t("shortcuts")}</Note>
                <p>{t("sourceGeometry")}</p>
                <p>{t("signoffLimits")}</p>
                <Source path="docs/paper/SUMMARY.md" />
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
