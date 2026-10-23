import { useState, useEffect, useMemo } from "react";
import {
  Play,
  Pause,
  Square,
  Search,
  ZoomIn,
  ZoomOut,
  SkipForward,
} from "lucide-react";
import type { Project, Waveform } from "../types/data";
import { useI18n } from "../i18n/I18n";
import { Card, Badge, Source, Note, Range } from "../components/UI";
import { PageHeading } from "../analytics/Analytics";
export function valueAt(events: [number, string][], time: number) {
  let lo = 0,
    hi = events.length - 1,
    index = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (events[mid][0] <= time) {
      index = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return index < 0 ? "x" : events[index][1];
}
export default function WaveformViewer({
  project: p,
  waveform,
  active,
}: {
  project: Project;
  waveform: Waveform | null;
  active: boolean;
}) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([
    "IBfv",
    "fv",
    "cin_v",
    "cin_l",
    "out_v",
    "out_l",
  ]);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(4);
  const [zoom, setZoom] = useState(1);
  const [format, setFormat] = useState("bin");
  const names = useMemo(
    () =>
      waveform
        ? waveform.signals.map((s) => s.name)
        : Object.keys(p.trace.rows[0] ?? {}).filter((k) => k !== "c"),
    [p, waveform],
  );
  const times = useMemo(
    () =>
      waveform
        ? [
            ...new Set(
              waveform.signals.flatMap((s) => s.events.map((e) => e[0])),
            ),
          ].sort((a, b) => a - b)
        : p.trace.rows.map((r) => r.c),
    [p, waveform],
  );
  const shown = selected.filter((n) => names.includes(n));
  const realSelected = shown;
  const index = Math.min(cursor, Math.max(0, times.length - 1));
  const time = times[index] ?? 0;
  useEffect(() => {
    if (!active || !playing || times.length === 0) return;
    const id = setInterval(
      () => setCursor((v) => Math.min(times.length - 1, v + 1)),
      1000 / speed,
    );
    return () => clearInterval(id);
  }, [active, playing, speed, times.length]);
  useEffect(() => {
    setCursor(0);
    setPlaying(false);
    setSelected(
      waveform
        ? waveform.signals.slice(0, 6).map((s) => s.name)
        : ["IBfv", "fv", "cin_v", "cin_l", "out_v", "out_l"],
    );
  }, [waveform]);
  useEffect(() => {
    if (cursor >= times.length - 1 && cursor > 0) setPlaying(false);
  }, [cursor, times.length]);
  const formatValue = (raw: string) =>
    /[xz]/i.test(raw)
      ? raw
      : format === "bin"
        ? raw
        : format === "hex"
          ? `0x${BigInt(`0b${raw || "0"}`).toString(16)}`
          : BigInt(`0b${raw || "0"}`).toString();
  return (
    <div className="page-content">
      <PageHeading
        title={t("waveTitle")}
        extra={
          <Badge>
            {t("replay")} · {t(waveform?.kind === "DEMO" ? "demo" : "real")}
          </Badge>
        }
      />
      <Note tone="amber">
        {waveform
          ? `${waveform.source} · ${waveform.timescale}${waveform.truncated ? " · TRUNCATED" : ""}`
          : t("sparseWarning")}
      </Note>
      <Card title={waveform?.source ?? t("sampledTrace")}>
        <div className="playback-controls">
          <button
            className="button accent small"
            onClick={() => {
              if (index >= times.length - 1) setCursor(0);
              setPlaying((v) => !v);
            }}
          >
            {playing ? <Pause size={15} /> : <Play size={15} />}
            {t(playing ? "pause" : "play")}
          </button>
          <button
            className="button subtle small"
            onClick={() => {
              setPlaying(false);
              setCursor((v) => Math.min(times.length - 1, v + 1));
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
              setCursor(0);
            }}
          >
            <Square size={15} />
          </button>
          <button
            className="icon-button"
            title={t("zoomIn")}
            onClick={() => setZoom((v) => Math.min(8, v * 2))}
          >
            <ZoomIn size={15} />
          </button>
          <button
            className="icon-button"
            title={t("zoomOut")}
            onClick={() => setZoom((v) => Math.max(1, v / 2))}
          >
            <ZoomOut size={15} />
          </button>
          <select
            aria-label={t("format")}
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            <option value="bin">{t("binary")}</option>
            <option value="hex">{t("hexadecimal")}</option>
            <option value="dec">{t("decimal")}</option>
          </select>
          <span className="mono">
            {t("cursor")}: {time} {waveform?.timescale ?? "cycles"}
          </span>
        </div>
        <div className="simulation-ranges">
          <Range
            label={t("sample")}
            value={index}
            min={0}
            max={Math.max(1, times.length - 1)}
            onChange={(v) => {
              setPlaying(false);
              setCursor(v);
            }}
          />
          <Range
            label={t("simulationSpeed")}
            value={speed}
            min={1}
            max={20}
            onChange={setSpeed}
          />
        </div>
        <div className="waveform-layout">
          <div className="signal-picker">
            <div className="search-field">
              <Search size={14} />
              <input
                placeholder={t("signalSearch")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {names
              .filter((n) => n.toLowerCase().includes(search.toLowerCase()))
              .slice(0, 150)
              .map((n) => (
                <label key={n}>
                  <input
                    type="checkbox"
                    checked={realSelected.includes(n)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...realSelected, n]
                          : realSelected.filter((s) => s !== n),
                      )
                    }
                  />
                  <span>{n}</span>
                </label>
              ))}
          </div>
          <div className="wave-scroll">
            <div style={{ minWidth: 650 * zoom }}>
              {realSelected.map((n, row) => {
                const signal = waveform?.signals.find((s) => s.name === n);
                const raw = signal
                  ? valueAt(signal.events, time)
                  : (p.trace.rows[index]?.[n] ?? 0).toString(2);
                const min = times[0] ?? 0,
                  max = times.at(-1) ?? 1;
                const x = (v: number) =>
                  120 + ((v - min) / Math.max(1, max - min)) * 620;
                return (
                  <div className="wave-row" key={n}>
                    <svg
                      viewBox="0 0 760 52"
                      className="wave-svg"
                      role="img"
                      aria-label={n}
                    >
                      <text x="4" y="19" className="chart-label">
                        {n.split(".").slice(-2).join(".")}
                      </text>
                      <text x="4" y="39" className="wave-value">
                        {formatValue(raw)}
                      </text>
                      <line
                        x1="120"
                        x2="745"
                        y1="39"
                        y2="39"
                        className="chart-grid"
                      />
                      {signal
                        ? signal.events.map(([at, v], i) => {
                            const end =
                              signal.events[i + 1]?.[0] ?? waveform!.end;
                            const y = v === "1" ? 12 : 38;
                            return (
                              <g key={i}>
                                <path
                                  d={`M${x(at)},38 V${y} H${x(end)}`}
                                  stroke={
                                    signal.width === 1 ? "#58c7b9" : "#d1ae70"
                                  }
                                  fill="none"
                                  strokeWidth="1.5"
                                />
                                {signal.width > 1 && (
                                  <text
                                    x={x(at) + 4}
                                    y="28"
                                    className="chart-label"
                                  >
                                    {formatValue(v)}
                                  </text>
                                )}
                              </g>
                            );
                          })
                        : p.trace.rows.map((r, i) => (
                            <g key={i}>
                              <circle
                                cx={x(r.c)}
                                cy={r[n] === 0 ? 38 : 12}
                                r={2.5}
                                fill="#58c7b9"
                              />
                              <title>
                                cycle {r.c}: {r[n]}
                              </title>
                            </g>
                          ))}
                      <line
                        x1={x(time)}
                        x2={x(time)}
                        y1="0"
                        y2="51"
                        stroke="#dfb16c"
                        strokeDasharray="3 3"
                      />
                      {row === 0 && (
                        <text x={x(time) + 5} y="10" className="chart-label">
                          {time}
                        </text>
                      )}
                    </svg>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {!waveform && <Source path={p.trace.source} />}
      </Card>
    </div>
  );
}
