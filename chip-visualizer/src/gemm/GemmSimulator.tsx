import { useState, useEffect } from "react";
import {
  Play,
  Pause,
  SkipForward,
  Square,
  RotateCcw,
  Shuffle,
  CheckCircle2,
} from "lucide-react";
import { useI18n } from "../i18n/I18n";
import { Card, Note, Source, Badge, Range, Stat } from "../components/UI";
import { PageHeading } from "../analytics/Analytics";
import {
  int8,
  multiply,
  partialProduct,
  quantize,
  validateJob,
} from "../simulation/gemm";
import type { Matrix } from "../simulation/gemm";
import { exampleA, exampleB } from "../../demo-data/gemm";
export default function GemmSimulator({ active }: { active: boolean }) {
  const { t } = useI18n();
  const [a, setA] = useState<Matrix>(exampleA.map((r) => [...r]));
  const [b, setB] = useState<Matrix>(exampleB.map((r) => [...r]));
  const [steps, setSteps] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(6);
  const [shift, setShift] = useState(0);
  const [shape, setShape] = useState([4, 4, 4]);
  const total = a.length * b.length * b[0].length;
  const output = partialProduct(a, b, steps),
    reference = multiply(a, b);
  const done = steps === total;
  const current = Math.max(0, Math.min(steps, total - 1));
  const row = Math.floor(current / (b[0].length * b.length)),
    col = Math.floor(current / b.length) % b[0].length,
    k = current % b.length;
  const validation = validateJob(...(shape as [number, number, number]));
  useEffect(() => {
    if (!active || !playing || done) return;
    const id = setInterval(
      () => setSteps((v) => Math.min(total, v + 1)),
      1000 / speed,
    );
    return () => clearInterval(id);
  }, [active, playing, speed, total, done]);
  const reset = () => {
    setPlaying(false);
    setSteps(0);
  };
  function edit(which: "a" | "b", i: number, j: number, value: number) {
    const matrix = (which === "a" ? a : b).map((r) => [...r]);
    matrix[i][j] = int8(Number.isFinite(value) ? value : 0);
    (which === "a" ? setA : setB)(matrix);
    reset();
  }
  const randomize = () => {
    const random = () =>
      Array.from({ length: 4 }, () =>
        Array.from({ length: 4 }, () => Math.floor(Math.random() * 17) - 8),
      );
    setA(random());
    setB(random());
    reset();
  };
  return (
    <div className="page-content">
      <PageHeading
        title={t("gemmTitle")}
        extra={
          <Badge tone="amber">
            {t("demo")} · {t("idealMath")}
          </Badge>
        }
      />
      <Note tone="amber">{t("mathDisclaimer")}</Note>
      <Card>
        <div className="playback-controls">
          <button
            className="button accent"
            onClick={() => {
              if (done) {
                setSteps(0);
                setPlaying(true);
              } else setPlaying((v) => !v);
            }}
          >
            {playing && !done ? <Pause size={16} /> : <Play size={16} />}{" "}
            {t(playing && !done ? "pause" : "play")}
          </button>
          <button
            className="button subtle"
            onClick={() => {
              setPlaying(false);
              setSteps((v) => Math.min(total, v + 1));
            }}
          >
            <SkipForward size={16} />
            {t("step")}
          </button>
          <button className="icon-button" title={t("stop")} onClick={reset}>
            <Square size={16} />
          </button>
          <button className="icon-button" title={t("reset")} onClick={reset}>
            <RotateCcw size={16} />
          </button>
          <div className="control-spacer" />
          <button className="button subtle small" onClick={randomize}>
            <Shuffle size={14} />
            {t("random")}
          </button>
          <button
            className="button subtle small"
            onClick={() => {
              setA(exampleA.map((r) => [...r]));
              setB(exampleB.map((r) => [...r]));
              reset();
            }}
          >
            {t("example")}
          </button>
        </div>
        <div className="simulation-ranges">
          <Range
            label={t("progress")}
            value={steps}
            min={0}
            max={total}
            onChange={(v) => {
              setPlaying(false);
              setSteps(v);
            }}
            unit={` / ${total}`}
          />
          <Range
            label={t("simulationSpeed")}
            value={speed}
            min={1}
            max={30}
            onChange={setSpeed}
          />
          <Range
            label={t("shift")}
            value={shift}
            min={0}
            max={40}
            onChange={setShift}
          />
        </div>
      </Card>
      <div className="matrix-equation">
        <MatrixView
          label={t("matrixA")}
          matrix={a}
          activeCell={[row, k]}
          edit={(i, j, v) => edit("a", i, j, v)}
        />
        <span className="math-symbol">×</span>
        <MatrixView
          label={t("matrixB")}
          matrix={b}
          activeCell={[k, col]}
          edit={(i, j, v) => edit("b", i, j, v)}
        />
        <span className="math-symbol">=</span>
        <MatrixView
          label={t("matrixC")}
          matrix={output}
          activeCell={done ? undefined : [row, col]}
        />
      </div>
      <div className="analytics-grid">
        <Card title={t("currentMAC")}>
          <div className="mac-formula mono">
            C[{row},{col}] <span>+=</span> {a[row][k]} <span>×</span>{" "}
            {b[k][col]}
          </div>
          <div className="stats-grid compact">
            <Stat label={t("stepCount")} value={`${steps} / ${total}`} />
            <Stat
              label={t("status")}
              value={done ? <CheckCircle2 size={25} /> : t("computing")}
            />
          </div>
          <Badge tone={done ? "green" : "cyan"}>
            {done && JSON.stringify(output) === JSON.stringify(reference)
              ? t("referencePass")
              : t("computing")}
          </Badge>
          <Source path="rtl_asic/Right_shifter.v" />
        </Card>
        <Card title={t("quantized")}>
          <MatrixView
            label="INT8 = saturate(round_half_up(INT32 / 2^shift))"
            matrix={output.map((r) => r.map((v) => quantize(v, shift)))}
          />
        </Card>
        <Card title={t("workload")} className="wide">
          <div className="filter-row">
            {["M", "K", "N"].map((label, i) => (
              <label key={label}>
                {label}
                <input
                  aria-label={`Job ${label}`}
                  type="number"
                  min={1}
                  max={100000}
                  value={shape[i]}
                  onChange={(e) =>
                    setShape((v) =>
                      v.map((n, j) => (i === j ? Number(e.target.value) : n)),
                    )
                  }
                />
              </label>
            ))}
            <span className="mono">
              Kb={validation.kb} · Nb={validation.nb}
              <br />
              F/W/O={validation.feature}/{validation.weight}/{validation.output}
            </span>
          </div>
          <Note tone={validation.errors.length ? "amber" : "green"}>
            {validation.errors.length ? t("invalidJob") : t("validJob")}
            {validation.errors.map((error) => (
              <div key={error}>• {t(error)}</div>
            ))}
          </Note>
          <Source path="README.md" />
          <p className="muted">
            {t("idealMath")} · {t("mathDisclaimer")}
          </p>
        </Card>
      </div>
    </div>
  );
}
function MatrixView({
  label,
  matrix,
  activeCell,
  edit,
}: {
  label: string;
  matrix: Matrix;
  activeCell?: [number, number];
  edit?: (i: number, j: number, v: number) => void;
}) {
  return (
    <div className="matrix-view">
      <span className="matrix-title">{label}</span>
      <div
        className="matrix-grid"
        style={{
          gridTemplateColumns: `repeat(${matrix[0].length},minmax(34px,1fr))`,
        }}
      >
        {matrix.flatMap((row, i) =>
          row.map((v, j) =>
            edit ? (
              <input
                aria-label={`${label} ${i},${j}`}
                key={`${i}-${j}`}
                type="number"
                min={-128}
                max={127}
                className={
                  activeCell?.[0] === i && activeCell[1] === j ? "active" : ""
                }
                value={v}
                onChange={(e) => edit(i, j, Number(e.target.value))}
              />
            ) : (
              <span
                className={
                  activeCell?.[0] === i && activeCell[1] === j ? "active" : ""
                }
                key={`${i}-${j}`}
              >
                {v}
              </span>
            ),
          ),
        )}
      </div>
    </div>
  );
}
