import {
  Search,
  Scan,
  Crosshair,
  RotateCcw,
  Layers,
  Eye,
  EyeOff,
  Camera,
} from "lucide-react";
import type { Geometry, Project } from "../types/data";
import type { ViewSettings } from "../app/settings";
import { Range, Toggle, Source } from "../components/UI";
import { useI18n } from "../i18n/I18n";
import type { MessageKey } from "../i18n/dictionaries";
import type { CameraCommand } from "../viewers/ChipViewer";
import { useState, useEffect } from "react";
type Props = {
  geometry: Geometry;
  project: Project;
  settings: ViewSettings;
  setSettings: (patch: Partial<ViewSettings>) => void;
  selected: string | null;
  onSelect: (id: string | null) => void;
  camera: (view: CameraCommand["view"]) => void;
  capture: () => void;
};
export default function Controls({
  geometry,
  project,
  settings: s,
  setSettings: set,
  selected,
  onSelect,
  camera,
  capture,
}: Props) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"controls" | "inspector">("controls");
  useEffect(() => {
    if (selected) setTab("inspector");
  }, [selected]);
  const m = geometry.macros.find((m) => m.id === selected);
  const layerKeys: [keyof ViewSettings, MessageKey, string][] = [
    ["substrate", "substrate", "#6c8296"],
    ["rows", "peRows", "#3ec9b6"],
    ["sram", "sram", "#5088bc"],
    ["axi", "axiShell", "#c79456"],
    ["power", "powerGrid", "#d7a35c"],
    ["clock", "clockTree", "#f4c565"],
    ["routes", "routes", "#699fd4"],
    ["pins", "pins", "#d4bb85"],
    ["metal", "metal", "#ad91c7"],
  ];
  return (
    <aside className="controls-panel">
      <div className="panel-tabs">
        <button
          className={tab === "controls" ? "active" : ""}
          onClick={() => setTab("controls")}
        >
          <Layers size={14} />
          {t("controls")}
        </button>
        <button
          className={tab === "inspector" ? "active" : ""}
          onClick={() => setTab("inspector")}
        >
          <Crosshair size={14} />
          {t("inspector")}
        </button>
      </div>
      <div className="controls-scroll">
        {tab === "controls" ? (
          <>
            <section className="control-section">
              <h4>{t("camera")}</h4>
              <div className="view-buttons">
                {(["top", "front", "side", "isometric"] as const).map(
                  (view) => (
                    <button key={view} onClick={() => camera(view)}>
                      {t(view)}
                    </button>
                  ),
                )}
              </div>
              <div className="segmented">
                <button
                  className={s.projection === "perspective" ? "active" : ""}
                  onClick={() => set({ projection: "perspective" })}
                >
                  {t("perspective")}
                </button>
                <button
                  className={s.projection === "orthographic" ? "active" : ""}
                  onClick={() => set({ projection: "orthographic" })}
                >
                  {t("orthographic")}
                </button>
              </div>
              <Toggle
                label={t("autoRotate")}
                checked={s.autoRotate}
                onChange={(v) => set({ autoRotate: v })}
              />
              <Range
                label={t("rotateSpeed")}
                value={s.rotateSpeed}
                min={0.1}
                max={3}
                step={0.1}
                onChange={(v) => set({ rotateSpeed: v })}
              />
              <div className="button-pair">
                <button
                  className="button subtle small"
                  onClick={() => camera("fit")}
                >
                  <Scan size={13} />
                  {t("fit")}
                </button>
                <button
                  className="icon-button"
                  title={t("resetCamera")}
                  onClick={() => camera("isometric")}
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </section>
            <section className="control-section">
              <h4>{t("animation")}</h4>
              <div className="button-pair">
                <button
                  className={`button small ${s.explode > 0 ? "accent" : ""}`}
                  onClick={() =>
                    set({
                      explode: s.distance,
                      autoExplode: false,
                      playing: false,
                    })
                  }
                >
                  {t("explode")}
                </button>
                <button
                  className="button subtle small"
                  onClick={() =>
                    set({
                      explode: 0,
                      autoExplode: false,
                      playing: false,
                      progress: 0,
                    })
                  }
                >
                  {t("collapse")}
                </button>
              </div>
              <Toggle
                label={t("autoExplode")}
                checked={s.autoExplode}
                onChange={(v) => set({ autoExplode: v })}
              />
              <Range
                label={t("explodeDistance")}
                value={s.distance}
                min={0.2}
                max={3}
                step={0.1}
                onChange={(v) =>
                  set({
                    distance: v,
                    ...(!s.autoExplode ? { explode: v } : {}),
                  })
                }
              />
              <Range
                label={t("speed")}
                value={s.speed}
                min={0.25}
                max={3}
                step={0.25}
                onChange={(v) => set({ speed: v })}
              />
              <Toggle
                label={t("loop")}
                checked={s.loop}
                onChange={(v) => set({ loop: v })}
              />
            </section>
            <section className="control-section">
              <h4>{t("layers")}</h4>
              {layerKeys.map(([key, label, color]) => (
                <Toggle
                  key={key}
                  label={
                    <>
                      <i className="layer-dot" style={{ background: color }} />
                      {t(label)}
                    </>
                  }
                  checked={Boolean(s[key])}
                  onChange={(v) => set({ [key]: v })}
                />
              ))}
              <Range
                label={t("opacity")}
                value={s.opacity}
                min={0.08}
                max={1}
                step={0.01}
                onChange={(v) => set({ opacity: v })}
              />
              <div className="chip-toggles">
                {(["xray", "wireframe", "section"] as const).map((k) => (
                  <button
                    key={k}
                    className={s[k] ? "active" : ""}
                    onClick={() => set({ [k]: !s[k] })}
                  >
                    {t(k)}
                  </button>
                ))}
              </div>
            </section>
            <section className="control-section">
              <h4>{t("names")}</h4>
              {(["labels", "peIDs", "sramIDs", "legend"] as const).map(
                (k, i) => (
                  <Toggle
                    key={k}
                    label={t(
                      (["names", "peIDs", "sramIDs", "legend"] as const)[i],
                    )}
                    checked={s[k]}
                    onChange={(v) => set({ [k]: v })}
                  />
                ),
              )}
              <label className="field-label">
                {t("quality")}
                <select
                  value={s.quality}
                  onChange={(e) =>
                    set({ quality: e.target.value as ViewSettings["quality"] })
                  }
                >
                  {(["low", "balanced", "high"] as const).map((k) => (
                    <option key={k} value={k}>
                      {t(k)}
                    </option>
                  ))}
                </select>
              </label>
              <button className="button subtle full" onClick={capture}>
                <Camera size={14} />
                {t("screenshot")}
              </button>
            </section>
          </>
        ) : (
          <>
            <section className="control-section">
              <div className="search-field">
                <Search size={14} />
                <input
                  value={query}
                  placeholder={t("search")}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="module-list">
                {geometry.macros
                  .filter((m) =>
                    `${m.id} ${m.name}`
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                  )
                  .slice(0, 80)
                  .map((m) => (
                    <button
                      key={m.id}
                      className={selected === m.id ? "selected" : ""}
                      onClick={() => onSelect(m.id)}
                    >
                      <i className={`module-square ${m.type}`} />
                      <span>
                        {m.name}
                        <small>{m.id.split(".").slice(-3).join(".")}</small>
                      </span>
                    </button>
                  ))}
                {!geometry.macros.some((m) =>
                  `${m.id} ${m.name}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                ) && <p>{t("noMatches")}</p>}
              </div>
            </section>
            <section className="control-section">
              {m ? (
                <>
                  <h4>{m.name}</h4>
                  <dl className="inspector-data">
                    <dt>{t("type")}</dt>
                    <dd>{m.master}</dd>
                    <dt>{t("hierarchy")}</dt>
                    <dd className="mono break">{m.id}</dd>
                    <dt>{t("dimensions")}</dt>
                    <dd>
                      {m.w.toFixed(2)} × {m.h.toFixed(2)} µm
                    </dd>
                    <dt>{t("position")}</dt>
                    <dd>
                      {m.x.toFixed(2)}, {m.y.toFixed(2)} µm
                    </dd>
                    <dt>{t("orientation")}</dt>
                    <dd>{m.orientation}</dd>
                    <dt>{t("areaUnit")}</dt>
                    <dd>{((m.w * m.h) / 1e6).toFixed(5)}</dd>
                    <dt>{t("cellCount")}</dt>
                    <dd>
                      {m.type === "row" && geometry.kind === "RECONSTRUCTED"
                        ? "76,554"
                        : t("unavailable")}
                    </dd>
                    <dt>{t("rtl")}</dt>
                    <dd>{m.rtl ?? t("unavailable")}</dd>
                    <dt>{t("provenance")}</dt>
                    <dd>{m.source}</dd>
                    <dt>
                      {t("power")} / {t("timing")}
                    </dt>
                    <dd>{t("notExtracted")}</dd>
                  </dl>
                  <button
                    className="button accent full"
                    onClick={() => camera("focus")}
                  >
                    <Crosshair size={14} />
                    {t("focusSelected")}
                  </button>
                  <Toggle
                    label={t("isolate")}
                    checked={s.isolate}
                    onChange={(v) => set({ isolate: v })}
                  />
                  <button
                    className="button subtle full"
                    onClick={() => {
                      onSelect(null);
                      set({ isolate: false });
                    }}
                  >
                    {t("clearSelection")}
                  </button>
                  <h4>{t("signals")}</h4>
                  <p className="signal-list">
                    {(
                      project.modules.find((mod) => mod.name === m.master)
                        ?.signals ?? []
                    )
                      .slice(0, 12)
                      .join(" · ") || t("unavailable")}
                  </p>
                  <Source path="docs/paper/data/row_summary.csv" />
                </>
              ) : (
                <p className="muted">
                  <Eye size={20} />
                  <br />
                  {t("selectionHint")}
                </p>
              )}
            </section>
          </>
        )}
        <div className="control-footnote">
          <EyeOff size={13} />
          {t(
            geometry.kind === "RECONSTRUCTED"
              ? "sourceGeometry"
              : geometry.kind === "DEMO"
                ? "archNote"
                : "importedGeometryNote",
          )}
        </div>
      </div>
    </aside>
  );
}
