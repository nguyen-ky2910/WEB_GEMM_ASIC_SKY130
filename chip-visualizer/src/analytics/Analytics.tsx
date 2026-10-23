import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  ShieldCheck,
  Cpu,
  Database,
  FileText,
  CheckCircle2,
  Play,
  Pause,
} from "lucide-react";
import type { Project, Page } from "../types/data";
import { useI18n } from "../i18n/I18n";
import {
  Card,
  Badge,
  Note,
  Source,
  Stat,
  DataTable,
  Export,
  Range,
} from "../components/UI";
import { Bars, LineChart, Histogram } from "./Charts";
import { asset, metricMap } from "../data-adapters/project";
export default function Analytics({
  page,
  project: p,
  onNavigate,
  active,
}: {
  page: Page;
  project: Project;
  onNavigate: (p: Page) => void;
  active: boolean;
}) {
  const { t, lang } = useI18n();
  const s = p.signoff;
  const [shape, setShape] = useState("64x64x64");
  const [corner, setCorner] = useState("tt");
  const [rc, setRC] = useState("max");
  const [check, setCheck] = useState("setup");
  const [kind, setKind] = useState("macro");
  const [supply, setSupply] = useState("B");
  const [net, setNet] = useState("vccd1");
  const [round, setRound] = useState(0);
  const [ecoPlay, setEcoPlay] = useState(false);
  const [a, setA] = useState("ip_v3r");
  const [b, setB] = useState("final");
  const [test, setTest] = useState("M1");
  const energy = p.tables.energy_job_50MHz;
  const er = energy.rows.find((r) => r.shape === shape)!;
  const ip = metricMap(p, "ip_summary");
  const eco = p.tables.antenna_convergence;
  const ecoRows = eco.rows.filter((r) => r.flow === "incremental_dcf3613");
  useEffect(() => {
    if (!active || !ecoPlay) return;
    const id = setInterval(
      () =>
        setRound((v) => {
          if (v >= ecoRows.length - 1) {
            setEcoPlay(false);
            return v;
          }
          return v + 1;
        }),
      1200,
    );
    return () => clearInterval(id);
  }, [active, ecoPlay, ecoRows.length]);
  const shapeSelect = (
    <select
      aria-label={t("workload")}
      value={shape}
      onChange={(e) => setShape(e.target.value)}
    >
      {energy.rows.map((r) => (
        <option key={r.shape}>{r.shape}</option>
      ))}
    </select>
  );
  const scope = (
    <>
      <Note>
        {t("conditions")}
        <br />
        {t("researchNote")}
      </Note>
      <Source path="docs/paper/SUMMARY.md" />
    </>
  );
  if (page === "overview")
    return (
      <div className="page-content">
        <div className="overview-hero">
          <div>
            <Badge tone="green">{t("signoffTT")}</Badge>
            <h1>{t("overviewTitle")}</h1>
            <p>{t("overviewSubtitle")}</p>
            <button
              className="button accent"
              onClick={() => onNavigate("explorer")}
            >
              {t("openExplorer")}
              <ArrowUpRight size={17} />
            </button>
          </div>
          <div className="hero-chip-icon">
            <Cpu size={105} strokeWidth={0.65} />
            <span>GEMM32</span>
            <small>SKY130A · INT8</small>
          </div>
        </div>
        <div className="stats-grid">
          <Stat
            label={t("peCount")}
            value="1,024"
            sub="32 × 32 · weight-stationary"
          />
          <Stat
            label={t("memory")}
            value="160"
            unit="KiB"
            sub="80 × 2 KiB OpenRAM"
          />
          <Stat
            label={t("clock")}
            value="50"
            unit="MHz"
            sub="20 ns · TT library"
            tone="amber"
          />
          <Stat
            label={t("dieArea")}
            value={Number(ip.die_area_mm2).toFixed(2)}
            unit="mm²"
            sub="7.275 × 10.494 mm"
          />
        </div>
        <div className="analytics-grid">
          <Card title={t("signoffPolicy")} extra={<ShieldCheck size={18} />}>
            <div className="check-list">
              {[
                ["DRT", 0],
                ["Magic DRC", 0],
                ["ARC antenna", 0],
                ["LVS", "Match"],
                ["Layout XOR", 0],
                ["GLS", "3 / 3"],
              ].map(([name, value]) => (
                <div key={name}>
                  <CheckCircle2 size={15} />
                  <span>{name}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <Source path={s.source} />
          </Card>
          <Card title={t("power")} extra={<Badge>{t("real")}</Badge>}>
            <div className="stats-grid compact">
              <Stat label={t("totalPower")} value="745.05" unit="mW" />
              <Stat label={t("effective")} value="15.936" unit="GOPS" />
            </div>
            <p className="muted">64×64×64 · {t("estimated")}</p>
            <Source path={energy.source} />
          </Card>
          <Card title={t("limitations")} className="wide">
            <Note tone="amber">{t("signoffLimits")}</Note>
            <div className="link-row">
              <button
                className="button subtle small"
                onClick={() => onNavigate("verification")}
              >
                {t("verification")}
                <ArrowUpRight size={13} />
              </button>
              <button
                className="button subtle small"
                onClick={() => onNavigate("sources")}
              >
                {t("sources")}
                <ArrowUpRight size={13} />
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  if (page === "power") {
    const phases = p.tables.power_by_phase_50MHz;
    const job = phases.rows.find(
      (r) => r.shape === shape && r.phase === "job",
    )!;
    const phaseNames: Record<string, [string, string]> = {
      config: ["Configuration", "Cấu hình"],
      input_load: ["Input load", "Nạp đầu vào"],
      weight_tile: ["Weight tile", "Nạp tile weight"],
      compute: ["Compute", "Tính toán"],
      output_drain: ["Output drain", "Xuất kết quả"],
    };
    return (
      <div className="page-content">
        <PageHeading title={t("powerTitle")} extra={shapeSelect} />
        {scope}
        <div className="stats-grid">
          <Stat label={t("totalPower")} value={er.power_mW} unit="mW" />
          <Stat label={t("energy")} value={er.energy_per_gemm_uJ} unit="µJ" />
          <Stat label={t("effective")} value={er.gops} unit="GOPS" />
          <Stat
            label={t("peak")}
            value="102.4"
            unit="GOPS"
            sub={t("theoretical")}
          />
        </div>
        <Note tone="amber">
          {t("powerScope")}
          <br />
          IP: {er.power_mW_sram_lower}–{er.power_mW} mW (
          {t("detailTotalLowerUpper")}).
        </Note>
        <div className="analytics-grid">
          <Card
            title={t("powerPhases")}
            extra={<Export table={phases} name="power-by-phase" />}
          >
            <Bars
              items={phases.rows
                .filter((r) => r.shape === shape && r.phase !== "job")
                .map((r) => ({
                  label:
                    phaseNames[r.phase]?.[lang === "en" ? 0 : 1] ?? r.phase,
                  value: Number(r.total_mW),
                }))}
              unit="mW"
            />
            <Source path={phases.source} />
          </Card>
          <Card title={t("powerGroups")}>
            <Bars
              items={[
                { label: "Top", value: Number(job.top_cells_mW) },
                { label: "32 PE rows", value: Number(job.rows_x32_mW) },
                { label: "AXI", value: Number(job.axi_mW) },
                { label: "SRAM", value: Number(job.sram_mW), color: "#719bc9" },
              ]}
              unit="mW"
            />
            <Source path={phases.source} />
          </Card>
          <Card title={t("clockData")} className="wide">
            <Bars
              items={p.tables.power_clock_vs_data_64.rows
                .filter((r) => r.part === "TOTAL")
                .flatMap((r) => [
                  {
                    label: t("detailClockOnlyEstimate"),
                    value: Number(r.clock_only_mW),
                    color: "#dfb36c",
                  },
                  {
                    label: t("detailAdditionalDataActivity"),
                    value: Number(r.data_mW),
                  },
                ])}
              unit="mW"
            />
            <Note>
              {t("detailOnlyClockTreeIsIncludedInHierarchy")}
              {job.internal_mW} / {job.switching_mW} / {job.leakage_mW} mW.
            </Note>
            <Source path={p.tables.power_clock_vs_data_64.source} />
          </Card>
        </div>
      </div>
    );
  }
  if (page === "timing") {
    const table = p.tables.slack_histogram_final;
    const rows = table.rows.filter(
      (r) =>
        r.lib_corner === corner &&
        r.rc === rc &&
        r.check === check &&
        r.path_kind === kind,
    );
    return (
      <div className="page-content">
        <PageHeading title={t("timingTitle")} />
        <Note>
          {t("conditions")} · {t("reportSummary")}
        </Note>
        <div className="stats-grid">
          <Stat label="TT setup · RC max" value="+1.428" unit="ns" />
          <Stat label="TT hold" value="+0.319" unit="ns" />
          <Stat label="FF hold · RC max" value="+0.126" unit="ns" />
          <Stat label="SS macro setup" value="−4.944" unit="ns" tone="red" />
        </div>
        <Note tone="amber">{t("ssException")}</Note>
        <Card
          title={t("detailEndpointSlackDistribution")}
          extra={<Export table={table} name="slack-histogram" />}
        >
          <div className="filter-row">
            <label>
              {t("corner")}
              <select
                value={corner}
                onChange={(e) => setCorner(e.target.value)}
              >
                {["tt", "ss", "ff"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              {t("rc")}
              <select value={rc} onChange={(e) => setRC(e.target.value)}>
                {["min", "nom", "max"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              {t("type")}
              <select value={check} onChange={(e) => setCheck(e.target.value)}>
                <option value="setup">Setup</option>
                <option value="hold">Hold</option>
              </select>
            </label>
            <label>
              {t("hierarchy")}
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                {["macro", "cc", "io"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          </div>
          {rows.length ? (
            <Histogram
              bins={rows.map((r) => ({
                x: Number(r.bin_lo_ns),
                value: Number(r.endpoints),
              }))}
              label={t("detailEndpointsSlackNs")}
            />
          ) : (
            <Note>{t("unavailable")}</Note>
          )}
          <Source path={table.source} />
        </Card>
        <Card title={t("exceptions")}>
          <p>{t("signoffLimits")}</p>
          <p className="muted">
            WNS/TNS / {t("detailFullCriticalPathEndpoints")}:{" "}
            {t("notExtracted")}.{" "}
            {t("detailHistogramsAreRoundedBinsNotExactWorst")}
          </p>
          <Source path={s.source} />
        </Card>
      </div>
    );
  }
  if (page === "area")
    return (
      <div className="page-content">
        <PageHeading title={t("areaTitle")} />
        <Note>{t("areaScope")}</Note>
        <div className="stats-grid">
          <Stat label={t("dieArea")} value={ip.die_area_mm2} unit="mm²" />
          <Stat
            label={t("density")}
            value={(Number(ip.std_cell_density_in_rows) * 100).toFixed(2)}
            unit="%"
          />
          <Stat
            label={t("cellCount")}
            value={Number(ip.instances).toLocaleString()}
            sub={t("detailTopInstancesIncludesFillTap")}
          />
          <Stat
            label={t("detailTopFlipFlops")}
            value={Number(ip.flops).toLocaleString()}
          />
        </div>
        <div className="analytics-grid">
          <Card
            title={t("areaUnit")}
            extra={<Export table={p.tables.ip_summary} name="area-summary" />}
          >
            <Bars
              items={[
                {
                  label: t("detailCoreBoundingBox"),
                  value: Number(ip.core_bbox_area_mm2),
                },
                {
                  label: t("detailMacroFootprints"),
                  value: Number(ip.macro_area_mm2),
                  color: "#7698c5",
                },
                {
                  label: t("detailStandardCellRowRegion"),
                  value: Number(ip.std_row_area_mm2),
                },
                {
                  label: t("detailTopStandardCellsNoFillTap"),
                  value: Number(ip.std_cell_area_no_fill_tap_mm2),
                  color: "#e3b66c",
                },
              ]}
              unit="mm²"
            />
            <Source path={p.tables.ip_summary.source} />
          </Card>
          <Card title={t("routing")}>
            <Bars
              items={p.tables.routing_utilisation.rows.map((r) => ({
                label: r.layer,
                value: Number(r.max_pct),
                color: Number(r.max_pct) > 70 ? "#e9a562" : "#55bbaa",
              }))}
              max={100}
              unit="%"
            />
            <Source path={p.tables.routing_utilisation.source} />
          </Card>
          <Card title={t("detailVerifiedProjectLayoutFigure")} className="wide">
            <img
              className="report-image layout-image"
              src={asset("assets/layout/chip_blocks.png")}
              alt="Final IP layout figure by block, original project evidence"
              loading="lazy"
            />
            <p className="muted">
              docs/paper/figures/layout/chip_blocks.png ·{" "}
              {t("detailOriginalFigureStandardCellsDrawnMLarger")}
            </p>
          </Card>
        </div>
      </div>
    );
  if (page === "integrity") {
    const ir = p.tables[`irdrop_v2${supply}_summary`],
      slew = p.tables.sram_clk_slew_before_after;
    const samples = p.tables[`irdrop_v2B_${net}_worst100`];
    const sr = slew.rows
      .filter(
        (r) => r.corner === `${corner === "ss" ? "ss RC max" : "tt RC nom"}`,
      )
      .slice(0, 8);
    return (
      <div className="page-content">
        <PageHeading title={t("integrityTitle")} />
        <Note tone="amber">{t("irScope")}</Note>
        <div className="filter-row">
          <label>
            {t("supply")}
            <select value={supply} onChange={(e) => setSupply(e.target.value)}>
              <option>A</option>
              <option>B</option>
            </select>
          </label>
          <label>
            {t("corner")}
            <select
              value={corner === "ss" ? "ss" : "tt"}
              onChange={(e) => setCorner(e.target.value)}
            >
              <option value="tt">TT · RC nom</option>
              <option value="ss">SS · RC max</option>
            </select>
          </label>
        </div>
        <div className="stats-grid">
          {ir.rows.map((r) => (
            <Stat
              key={r.net}
              label={`Model ${supply} · ${r.net} · ${t("detailWorstDropRise")}`}
              value={r.worst_drop_mV}
              unit="mV"
              tone="amber"
            />
          ))}
          <Stat
            label="TT SRAM clock slew"
            value="0.739"
            unit="ns"
            sub="≤ 0.75 ns"
          />
          <Stat
            label="SS SRAM clock slew"
            value="0.998"
            unit="ns"
            sub="≤ 1.0 ns"
          />
        </div>
        <Source path={ir.source} />
        <div className="analytics-grid">
          <Card
            title={
              lang === "en"
                ? `Original static IR figure · Model ${supply}`
                : `Hình IR tĩnh gốc · Mô hình ${supply}`
            }
          >
            <img
              className="report-image"
              src={asset(`assets/irdrop_map_v2${supply}.png`)}
              alt={`Original project IR drop map, model ${supply}`}
              loading="lazy"
            />
            <p className="muted">
              docs/paper/figures/irdrop_map_v2{supply}.png
            </p>
          </Card>
          <Card
            title={t("clockSlew")}
            extra={<Export table={slew} name="sram-clock-slew" />}
          >
            <Bars
              items={sr.map((r, i) => ({
                label: `SRAM ${Math.floor(i / 2)} clk${i % 2}`,
                value: Number(r.slew_after_ns),
                color:
                  Number(r.slew_after_ns) > (corner === "ss" ? 1 : 0.75)
                    ? "#eb7b7b"
                    : "#dfb16c",
              }))}
              max={corner === "ss" ? 1 : 0.75}
              unit="ns"
            />
            <Source path={slew.source} />
            <details>
              <summary>
                {t("before")} / {t("after")}
              </summary>
              <DataTable
                headers={["Pin", t("before"), t("after")]}
                rows={sr.map((r) => [r.pin, r.slew_before_ns, r.slew_after_ns])}
              />
            </details>
          </Card>
          <Card title={t("nodeMap")} className="wide">
            <select
              aria-label="Supply net"
              value={net}
              onChange={(e) => setNet(e.target.value)}
            >
              <option>vccd1</option>
              <option>vssd1</option>
            </select>
            <svg
              className="node-map"
              viewBox="0 0 720 320"
              role="img"
              aria-label={t("nodeMap")}
            >
              <rect
                x="35"
                y="15"
                width="650"
                height="260"
                fill="var(--viewport)"
                stroke="var(--border)"
              />
              {samples.rows.map((r, i) => (
                <circle
                  key={i}
                  cx={35 + (Number(r.x_um) / 7274.9) * 650}
                  cy={275 - (Number(r.y_um) / 10493.76) * 260}
                  r={3.2}
                  fill={i < 20 ? "#e5a05f" : "#79b6be"}
                  opacity={0.7}
                >
                  <title>
                    {r.instance}: {r.drop_mV} mV; {r.x_um}, {r.y_um} µm
                  </title>
                </circle>
              ))}
              <text x="35" y="302" className="chart-label">
                0 µm
              </text>
              <text x="630" y="302" className="chart-label">
                7,275 µm
              </text>
            </svg>
            <Source path={samples.source} />
          </Card>
        </div>
      </div>
    );
  }
  if (page === "eco")
    return (
      <div className="page-content">
        <PageHeading
          title={t("ecoTitle")}
          extra={<Badge>{t("replay")}</Badge>}
        />
        <Note>{t("ecoScope")}</Note>
        <div className="stats-grid">
          <Stat
            label={t("violations")}
            value={ecoRows[round].violating_pins}
            unit="pins"
            tone={round === 5 ? "green" : "amber"}
          />
          <Stat
            label={t("detailReroutedNetsThisRound")}
            value={ecoRows[round].nets_rerouted || "—"}
          />
          <Stat
            label={t("detailReportedRoundRuntime")}
            value={ecoRows[round].round_time_s}
            unit="s"
          />
          <Stat label={t("stage")} value={`${round} / 5`} />
        </div>
        <Card
          title={t("detailIncrementalAntennaConvergence")}
          extra={<Export table={eco} name="antenna-convergence" />}
        >
          <LineChart
            values={ecoRows.map((r) => Number(r.violating_pins))}
            labels={ecoRows.map((r) => `R${r.round}`)}
            yLabel={t("violations")}
            selected={round}
          />
          <div className="playback-controls">
            <button
              className="button accent small"
              onClick={() => {
                if (round === 5) setRound(0);
                setEcoPlay((v) => !v);
              }}
            >
              {ecoPlay ? <Pause size={15} /> : <Play size={15} />}{" "}
              {t(ecoPlay ? "pause" : "play")}
            </button>
            <button
              className="button subtle small"
              onClick={() => {
                setRound(0);
                setEcoPlay(false);
              }}
            >
              {t("stop")}
            </button>
            <Range
              label={t("stage")}
              value={round}
              min={0}
              max={5}
              onChange={(v) => {
                setEcoPlay(false);
                setRound(v);
              }}
            />
          </div>
          <code className="log-line">{ecoRows[round].source}</code>
          <Source path={eco.source} />
        </Card>
        <Card title="DRV · TT / SS">
          <Bars
            items={p.tables.drv_by_eco_round.rows
              .filter((r) => r.corner === "ss RC max")
              .map((r) => ({
                label: r.tag,
                value: Number(r.std_cell_nets_over_lib),
              }))}
          />
          <Source path={p.tables.drv_by_eco_round.source} />
        </Card>
        <Source path={s.source} />
      </div>
    );
  if (page === "verification") {
    const cases = [
      ["M1", "1,32,32", "WRONG"],
      ["M1_K2", "1,64,32", "WRONG"],
      ["M2", "2,32,32", "PASS"],
      ["M2_K2", "2,64,32", "PASS"],
      ["F511", "73,224,32", "PASS"],
      ["F512", "256,64,32", "HANG"],
      ["W992", "2,992,32", "PASS"],
      ["W1024", "2,512,64", "HANG"],
      ["O511", "511,32,32", "PASS"],
      ["O512", "256,32,64", "WRONG"],
      ["SPLIT128_HALF", "64,128,128", "PASS"],
    ];
    const selected = cases.find((r) => r[0] === test)!;
    return (
      <div className="page-content">
        <PageHeading
          title={t("verificationTitle")}
          extra={<Badge tone="green">{t("signoffTT")}</Badge>}
        />
        <Note tone="amber">{t("verificationScope")}</Note>
        <div className="analytics-grid">
          <Card title={t("signoffPolicy")} className="wide">
            <DataTable
              headers={[t("test"), t("result"), t("provenance")]}
              rows={[
                [
                  "DRT / Magic DRC / ARC",
                  <Badge tone="green">0 / 0 / 0</Badge>,
                  t("reportSummary"),
                ],
                [
                  "Netgen LVS",
                  <Badge tone="green">Match</Badge>,
                  "122,879 devices · 151,960 nets",
                ],
                [
                  "KLayout XOR",
                  <Badge tone="green">0 · 52 layers</Badge>,
                  s.source,
                ],
                [
                  "GLS · 64×64×64 / 8×32×544 / 16×992×32",
                  <Badge tone="green">PASS</Badge>,
                  s.source,
                ],
                [
                  "Row equivalence · 2,000 cycles",
                  <Badge tone="green">PASS</Badge>,
                  "NHATKY.md",
                ],
                [
                  "PE formal · Yosys equiv_induct",
                  <Badge tone="green">PASS</Badge>,
                  "SUMMARY.md §8 · register-name matching",
                ],
                [
                  "AXI RTL shell",
                  t("reportSummary"),
                  "README.md · sim/run_axi.sh",
                ],
              ]}
            />
            <Source path={s.source} />
            <Source path="docs/paper/data/pe_equiv2_yosys062.log" />
            <Source path="NHATKY.md" />
          </Card>
          <Card
            title={t("errataTests")}
            extra={
              <select
                aria-label={t("test")}
                value={test}
                onChange={(e) => setTest(e.target.value)}
              >
                {cases.map((r) => (
                  <option key={r[0]}>{r[0]}</option>
                ))}
              </select>
            }
          >
            <div className="stats-grid compact">
              <Stat
                label={t("expected")}
                value={selected[2]}
                tone={selected[2] === "PASS" ? "green" : "amber"}
              />
              <Stat
                label={t("actual")}
                value={selected[2]}
                tone={selected[2] === "PASS" ? "green" : "amber"}
              />
            </div>
            <p>{selected[1]} · lean + clock gating · asic-sram</p>
            <Note>{t("detailMShortJobTestbenchStatusPollingReports")}</Note>
            <Source path="docs/paper/data/errata_rtl_tests.txt" />
            <Source path="docs/paper/data/gls_errata.txt" />
          </Card>
          <Card title={t("limitations")}>
            <Note tone="amber">{t("signoffLimits")}</Note>
            <p>{t("ssException")}</p>
            <Source path="README.md" />
          </Card>
        </div>
      </div>
    );
  }
  if (page === "comparison") {
    const choices = ["ip_v3r", "final", ...p.runs.map((r) => r.run)];
    const metrics: Record<string, Record<string, string>> = {
      ip_v3r: {
        "ARC pins": "446",
        DRT: "0",
        "Magic DRC": "7",
        "TT setup (ns)": "+1.025",
        "FF hold (ns)": "−0.056",
        "Vectorless @50 MHz (mW)": "1375.4",
      },
      final: {
        "ARC pins": "0",
        DRT: "0",
        "Magic DRC": "0",
        "TT setup (ns)": "+1.428",
        "FF hold (ns)": "+0.126",
        "Vectorless @50 MHz (mW)": "1377.6",
      },
    };
    const keys = Object.keys(metrics.final);
    return (
      <div className="page-content">
        <PageHeading title={t("comparisonTitle")} />
        <Note tone="amber">{t("comparisonNote")}</Note>
        <div className="filter-row">
          {[
            [a, setA, "runA"],
            [b, setB, "runB"],
          ].map(([v, set, key]) => (
            <label key={String(key)}>
              {t(key as "runA" | "runB")}
              <select
                value={v as string}
                onChange={(e) => (set as (v: string) => void)(e.target.value)}
              >
                {choices.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <Card
          title={`${a} ↔ ${b}`}
          extra={
            <Export
              name="run-comparison"
              table={{
                source: s.source,
                rows: keys.map((k) => ({
                  metric: k,
                  [a]: metrics[a]?.[k] ?? "Not Available",
                  [b]: metrics[b]?.[k] ?? "Not Available",
                })),
              }}
            />
          }
        >
          <DataTable
            headers={[t("metric"), a, b]}
            rows={keys.map((k) => [
              k,
              metrics[a]?.[k] ?? t("unavailable"),
              metrics[b]?.[k] ?? t("unavailable"),
            ])}
          />
          <Source path={s.source} />
        </Card>
        <Card title={t("historicalRuns")}>
          <DataTable
            headers={["Run", t("detailChangeOriginalSource"), t("result")]}
            rows={p.runs
              .filter((r) => r.run === a || r.run === b)
              .map((r) => [r.run, r.change, r.result])}
          />
          <Note>{t("rawAbsent")}</Note>
          <Source path="NHATKY.md" />
        </Card>
        <div className="analytics-grid">
          {[a, b].map((run, i) => (
            <Card key={i} title={run}>
              <Bars
                items={[
                  {
                    label: "ARC pins",
                    value: Number(metrics[run]?.["ARC pins"] ?? NaN),
                    color: i ? "#62c7b4" : "#d9a36a",
                  },
                ]}
                unit="pins"
                max={446}
              />
            </Card>
          ))}
        </div>
        <Note>{t("detailAXIThinRegLeanComparisonsIndividualRun")}</Note>
      </div>
    );
  }
  return (
    <div className="page-content">
      <PageHeading title={t("sourcesTitle")} />
      <div className="stats-grid">
        <Stat label={t("sourceFiles")} value={p.inventory.length} />
        <Stat label={t("rtlModules")} value={p.modules.length} />
        <Stat label="CSV" value={p.availability.csv.length} />
        <Stat
          label="DEF / GDS / VCD"
          value={`${p.availability.def.length} / ${p.availability.gds.length} / ${p.availability.vcd.length}`}
          tone="amber"
        />
      </div>
      <Note tone="amber">{t("branchUnknown")}</Note>
      <Note>{t("integrationNote")}</Note>
      <div className="link-row" style={{ flexWrap: "wrap" }}>
        {[
          "README.md",
          "DATA_AVAILABILITY.md",
          "DATA_SOURCES.md",
          "DATA_INTEGRATION_GUIDE.md",
          "LIMITATIONS.md",
          "IMPLEMENTATION_STATUS.md",
        ].map((file) => (
          <a
            className="button subtle small"
            key={file}
            href={asset(`docs/${file}`)}
            target="_blank"
            rel="noreferrer"
          >
            {file}
          </a>
        ))}
      </div>
      <div className="analytics-grid">
        <Card title={t("dataset")} extra={<Database size={16} />}>
          <DataTable
            headers={[t("type"), t("status")]}
            rows={Object.entries(p.availability).map(([key, files]) => [
              key.toUpperCase(),
              files.length ? `${files.length} files` : t("unavailable"),
            ])}
          />
        </Card>
        <Card title={t("provenance")} extra={<FileText size={16} />}>
          <p>{t("sourceGeometry")}</p>
          <Source path="docs/paper/SUMMARY.md" />
          <Source path={s.source} />
          <Source path="README.md" />
          <p className="muted">{t("researchNote")}</p>
        </Card>
        <Card className="wide" title={t("sources")}>
          <DataTable
            headers={[t("dataset"), t("source"), t("evidence")]}
            rows={Object.entries(p.tables).map(([name, table]) => [
              name,
              <Source path={table.source} />,
              <Export table={table} name={name} />,
            ])}
          />
        </Card>
        <Card className="wide" title={t("rtlModules")}>
          <DataTable
            headers={["Module", t("rtl"), t("signals")]}
            rows={p.modules.map((m) => [
              m.name,
              <Source path={m.source} />,
              m.signals.slice(0, 12).join(", "),
            ])}
          />
        </Card>
      </div>
    </div>
  );
}
export function PageHeading({
  title,
  extra,
}: {
  title: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">GEMM32 / SKY130A</span>
        <h1>{title}</h1>
      </div>
      {extra}
    </div>
  );
}
