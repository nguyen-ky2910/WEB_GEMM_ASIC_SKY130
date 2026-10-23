import { useState, useEffect } from "react";
import {
  Play,
  Pause,
  SkipForward,
  Square,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useI18n } from "../i18n/I18n";
import {
  Card,
  Note,
  Source,
  Badge,
  Range,
  Stat,
  Toggle,
  DataTable,
} from "../components/UI";
import { PageHeading } from "../analytics/Analytics";
import { initialAxi, tickAxi } from "./engine";
import type { Channel, AxiConfig } from "./engine";
import { registerMap, readRegister } from "./registers";
export default function AxiSimulator({ active }: { active: boolean }) {
  const { t, lang } = useI18n();
  const [state, setState] = useState(initialAxi);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(4);
  const [cursor, setCursor] = useState<number | null>(null);
  const [zoom, setZoom] = useState(24);
  const [config, setConfig] = useState<AxiConfig>({
    stall: "periodic",
    manualReady: true,
    seed: 2412,
    clockGate: true,
    responseReady: true,
    awDelay: 0,
    wDelay: 2,
  });
  const [channel, setChannel] = useState<Channel>("feature");
  const [address, setAddress] = useState(0);
  const [writeData, setWriteData] = useState("00000002");
  const [strobe, setStrobe] = useState(15);
  const [format, setFormat] = useState("hex");
  const step = () => {
    setCursor(null);
    setState((v) => tickAxi(v, config));
  };
  useEffect(() => {
    if (!active || !playing) return;
    const id = setInterval(() => {
      setCursor(null);
      setState((v) => tickAxi(v, config));
    }, 1000 / speed);
    return () => clearInterval(id);
  }, [active, playing, speed, config]);
  const sample =
    cursor !== null
      ? state.history.find((s) => s.cycle === cursor)
      : state.history.at(-1);
  const beat = sample?.[channel];
  const visible = state.history.slice(-zoom);
  const stalled = state.history.filter(
    (s) => s[channel].valid && !s[channel].ready,
  ).length;
  const reg = registerMap.find((r) => r.address === address)!;
  function queue(kind: "write" | "read") {
    setPlaying(false);
    setState((v) => ({
      ...v,
      lite: {
        kind,
        address,
        data: parseInt(writeData, 16) >>> 0,
        strobe,
        phase: 0,
      },
    }));
  }
  const display = (v: number) =>
    format === "hex"
      ? `0x${v.toString(16).padStart(8, "0")}`
      : format === "bin"
        ? v.toString(2).padStart(32, "0")
        : String(v);
  return (
    <div className="page-content">
      <PageHeading
        title={t("axiTitle")}
        extra={<Badge tone="amber">{t("demo")}</Badge>}
      />
      <Note tone="amber">{t("axiDisclaimer")}</Note>
      <div className="axi-diagram">
        <div className="diagram-block">
          Host / Master<small>AXI4-Lite · 32-bit</small>
        </div>
        <div className="diagram-arrows">
          <span>
            AW · W · AR <ArrowRight size={16} />
          </span>
          <span>
            <ArrowLeft size={16} /> B · R · IRQ
          </span>
        </div>
        <div className="diagram-block accent-block">
          GemmAxiShell<small>lean + clock gating</small>
        </div>
        <div className="diagram-arrows">
          <span>
            feature · weight <ArrowRight size={16} />
          </span>
          <span>
            <ArrowLeft size={16} /> result · 256-bit
          </span>
        </div>
        <div className="diagram-block">
          GemmAccelerator<small>InputBuffer → PE → OutputBuffer</small>
        </div>
      </div>
      <Card>
        <div className="playback-controls">
          <button
            className="button accent"
            onClick={() => setPlaying((v) => !v)}
          >
            {playing ? <Pause size={15} /> : <Play size={15} />}
            {t(playing ? "pause" : "play")}
          </button>
          <button
            className="button subtle"
            onClick={() => {
              setPlaying(false);
              step();
            }}
          >
            <SkipForward size={15} />
            {t("step")}
          </button>
          <button
            className="icon-button"
            title={t("stop")}
            onClick={() => {
              setPlaying(false);
              setState(initialAxi());
              setCursor(null);
            }}
          >
            <Square size={15} />
          </button>
          <button
            className="icon-button"
            title={t("replayButton")}
            onClick={() => {
              setState(initialAxi());
              setCursor(null);
              setPlaying(true);
            }}
          >
            <RotateCcw size={15} />
          </button>
          <button
            className="icon-button"
            title={t("previous")}
            onClick={() => {
              setPlaying(false);
              setCursor(
                Math.max(
                  state.history[0]?.cycle ?? 1,
                  (cursor ?? state.cycle) - 1,
                ),
              );
            }}
          >
            <ChevronLeft size={15} />
          </button>
          <button
            className="icon-button"
            title={t("next")}
            onClick={() => {
              setPlaying(false);
              if (cursor !== null && cursor < state.cycle)
                setCursor(cursor + 1);
              else step();
            }}
          >
            <ChevronRight size={15} />
          </button>
          <span className="mono">
            {t("clock")} #{sample?.cycle ?? 0}
          </span>
        </div>
        <div className="simulation-ranges">
          <Range
            label={t("simulationSpeed")}
            value={speed}
            min={1}
            max={20}
            onChange={setSpeed}
          />
          <Range
            label={t("cursor")}
            value={cursor ?? state.cycle}
            min={state.history[0]?.cycle ?? 0}
            max={Math.max(1, state.cycle)}
            onChange={(v) => {
              setPlaying(false);
              setCursor(v);
            }}
          />
          <Range
            label={t("zoomIn")}
            value={zoom}
            min={8}
            max={64}
            step={8}
            onChange={setZoom}
          />
        </div>
      </Card>
      <div className="analytics-grid">
        <Card title={t("stream")}>
          <div className="filter-row">
            <select
              aria-label={t("stream")}
              value={channel}
              onChange={(e) => setChannel(e.target.value as Channel)}
            >
              {(["feature", "weight", "result"] as const).map((k) => (
                <option value={k} key={k}>
                  {t(k)}
                </option>
              ))}
            </select>
            <select
              aria-label={t("backpressure")}
              value={config.stall}
              onChange={(e) =>
                setConfig((v) => ({
                  ...v,
                  stall: e.target.value as AxiConfig["stall"],
                }))
              }
            >
              {(["always", "periodic", "random", "manual"] as const).map(
                (v, i) => (
                  <option value={v} key={v}>
                    {t(
                      (
                        [
                          "alwaysReady",
                          "periodic",
                          "randomStall",
                          "manual",
                        ] as const
                      )[i],
                    )}
                  </option>
                ),
              )}
            </select>
          </div>
          {config.stall === "manual" && (
            <Toggle
              label={t("ready")}
              checked={config.manualReady}
              onChange={(v) => setConfig((c) => ({ ...c, manualReady: v }))}
            />
          )}
          <div className="signal-pills">
            {["TVALID", "TREADY", "TLAST"].map((key) => (
              <span
                key={key}
                className={
                  beat?.[
                    key === "TVALID"
                      ? "valid"
                      : key === "TREADY"
                        ? "ready"
                        : "last"
                  ]
                    ? "on"
                    : ""
                }
              >
                {key}{" "}
                {Number(
                  beat?.[
                    key === "TVALID"
                      ? "valid"
                      : key === "TREADY"
                        ? "ready"
                        : "last"
                  ] ?? false,
                )}
              </span>
            ))}
          </div>
          <div className="payload mono">
            <small>TDATA [255:0]</small>
            {beat?.valid ? `0x${beat.data}` : "—"}
          </div>
          <p className="mono">TSTRB = 0x{beat?.strb ?? "ffffffff"}</p>
          <Badge
            tone={beat?.accepted ? "green" : beat?.valid ? "amber" : "cyan"}
          >
            {beat?.accepted
              ? t("transferred")
              : beat?.valid
                ? t("holding")
                : t("finished")}
          </Badge>
          <div className="stats-grid compact">
            <Stat label={t("accepted")} value={state.indices[channel]} />
            <Stat label={t("stall")} value={stalled} />
          </div>
          <Toggle
            label={t("clockGating")}
            checked={config.clockGate}
            onChange={(v) => setConfig((c) => ({ ...c, clockGate: v }))}
          />
          <Note>{t("gateNote")}</Note>
        </Card>
        <Card title={t("waveform")}>
          <div className="wave-scroll">
            <svg
              className="wave-svg"
              viewBox="0 0 660 254"
              role="img"
              aria-label="AXI VALID READY timing"
            >
              {(["valid", "ready", "accepted", "last", "gated"] as const).map(
                (key, row) => (
                  <g key={key}>
                    <text x="4" y={row * 43 + 28} className="chart-label">
                      {
                        ["TVALID", "TREADY", "ACCEPT", "TLAST", "GCLK load"][
                          row
                        ]
                      }
                    </text>
                    <line
                      x1="88"
                      x2="655"
                      y1={row * 43 + 35}
                      y2={row * 43 + 35}
                      className="chart-grid"
                    />
                    {visible.map((s, i) => {
                      const x = 90 + (i * 560) / Math.max(1, visible.length),
                        w = 560 / Math.max(1, visible.length);
                      const on = s[channel][key];
                      return (
                        <g key={s.cycle}>
                          <path
                            d={`M${x},${row * 43 + 35} V${row * 43 + (on ? 10 : 35)} H${x + w}`}
                            fill="none"
                            stroke={key === "gated" ? "#dfb16c" : "#58c7b9"}
                            strokeWidth="1.5"
                          />
                          <title>
                            Cycle {s.cycle}: {Number(on)}
                          </title>
                          {row === 4 && i % 4 === 0 && (
                            <text x={x} y="244" className="chart-label">
                              {s.cycle}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                ),
              )}
            </svg>
          </div>
          <p className="muted">{t("protocolDemo")}</p>
          <Source path="rtl_asic/axi/GemmAxiShell.v" />
        </Card>
        <Card
          className="wide"
          title={t("registers")}
          extra={
            <select
              aria-label={t("format")}
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="hex">Hex</option>
              <option value="bin">Bin</option>
              <option value="dec">Dec</option>
            </select>
          }
        >
          <div className="register-layout">
            <div>
              <DataTable
                headers={[
                  t("address"),
                  t("registers"),
                  t("access"),
                  t("value"),
                ]}
                rows={registerMap.map((r) => [
                  <button
                    className={`register-address ${address === r.address ? "active" : ""}`}
                    onClick={() => setAddress(r.address)}
                  >
                    0x{r.address.toString(16).padStart(2, "0")}
                  </button>,
                  r.name,
                  r.access,
                  <code>
                    {display(readRegister(state.registers, r.address))}
                  </code>,
                ])}
              />
            </div>
            <div className="register-editor">
              <h3>{reg.name}</h3>
              <p>{reg.description[lang === "en" ? 0 : 1]}</p>
              <label className="field-label">
                WDATA · hex
                <input
                  aria-label="Register WDATA hex"
                  maxLength={8}
                  value={writeData}
                  onChange={(e) =>
                    setWriteData(e.target.value.replace(/[^a-fA-F0-9]/g, ""))
                  }
                />
              </label>
              <Range
                label={t("bytes")}
                min={0}
                max={15}
                value={strobe}
                onChange={setStrobe}
              />
              <div className="button-pair">
                <button
                  className="button accent small"
                  disabled={!!state.lite || !writeData}
                  onClick={() => queue("write")}
                >
                  {t("write")}
                </button>
                <button
                  className="button subtle small"
                  disabled={!!state.lite}
                  onClick={() => queue("read")}
                >
                  {t("read")}
                </button>
              </div>
              {reg.access === "RO" && <p className="muted">{t("readOnly")}</p>}
              <Range
                label={t("awDelay")}
                value={config.awDelay}
                min={0}
                max={6}
                onChange={(v) => setConfig((c) => ({ ...c, awDelay: v }))}
              />
              <Range
                label={t("wDelay")}
                value={config.wDelay}
                min={0}
                max={6}
                onChange={(v) => setConfig((c) => ({ ...c, wDelay: v }))}
              />
              <Toggle
                label="BREADY / RREADY"
                checked={config.responseReady}
                onChange={(v) => setConfig((c) => ({ ...c, responseReady: v }))}
              />
              <div className="signal-pills">
                {[
                  "AWVALID",
                  "AWREADY",
                  "WVALID",
                  "WREADY",
                  "BVALID",
                  "BREADY",
                  "ARVALID",
                  "ARREADY",
                  "RVALID",
                  "RREADY",
                ].map((k) => (
                  <span
                    className={sample?.[k as keyof typeof sample] ? "on" : ""}
                    key={k}
                  >
                    {k} {Number(sample?.[k as keyof typeof sample] ?? 0)}
                  </span>
                ))}
              </div>
              <p className="muted">{t("transaction")}</p>
              <code className="break">{state.lastTransaction}</code>
              {state.lite && (
                <Badge>
                  AXI {state.lite.kind} · phase {state.lite.phase}
                </Badge>
              )}
            </div>
          </div>
          <Source path="rtl_asic/axi/AxiLiteControlRegs.v" />
        </Card>
        <Card className="wide" title="IRQ / ERROR">
          <div className="button-pair">
            <button
              className="button subtle small"
              onClick={() =>
                setState((v) => tickAxi(v, config, { done: true }))
              }
            >
              {t("injectDone")}
            </button>
            <button
              className="button subtle small"
              onClick={() =>
                setState((v) => tickAxi(v, config, { partial: 1 }))
              }
            >
              {t("injectError")}
            </button>
            <Badge tone={state.registers.irq ? "amber" : "cyan"}>
              IRQ {Number(state.registers.irq)}
            </Badge>
            <Badge>
              BUSY {Number(state.registers.busy)} · DONE{" "}
              {Number(state.registers.done)}
            </Badge>
          </div>
          <Note>
            {t("eventNote")}
            <br />
            {t("clearDone")}
          </Note>
        </Card>
      </div>
    </div>
  );
}
