import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Card, Note, Badge, Source } from "../components/UI";
import { useI18n } from "../i18n/I18n";
import type { MessageKey } from "../i18n/dictionaries";
import type { Project } from "../types/data";
const blocks = [
  { name: "GemmAxiShell", label: "archControl", path: "u_axi_shell" },
  {
    name: "InputBuffer",
    label: "archInput",
    path: "u_gemm_accelerator.u_input_buffer",
  },
  {
    name: "BufferFeeder",
    label: "archFeeder",
    path: "u_gemm_accelerator.u_buffer_feeder",
  },
  {
    name: "GemmComputeCore",
    label: "archCompute",
    path: "u_buffer_feeder.u_compute_core",
  },
  {
    name: "OutputBuffer",
    label: "archOutput",
    path: "u_gemm_accelerator.u_output_buffer",
  },
];
export default function Architecture({ project: p }: { project: Project }) {
  const { t } = useI18n();
  const [selected, setSelected] = useState("GemmAxiShell");
  const mod = p.modules.find((m) => m.name === selected);
  const block = blocks.find((b) => b.name === selected);
  return (
    <div className="architecture-strip">
      <div className="architecture-blocks">
        {blocks.map((b, i) => (
          <div key={b.name}>
            <button
              className={selected === b.name ? "active" : ""}
              onClick={() => setSelected(b.name)}
            >
              <strong>{b.name}</strong>
              <small>{t(b.label as MessageKey)}</small>
            </button>
            {i < blocks.length - 1 && <ArrowRight size={17} />}
          </div>
        ))}
      </div>
      <details className="arch-detail">
        <summary>
          {selected} · {t("rtl")} / {t("signals")}
        </summary>
        <Card>
          <Badge tone="amber">{t("conceptual")}</Badge>
          <p className="mono">{block?.path}</p>
          {mod ? (
            <>
              <Source path={mod.source} />
              <p className="signal-list">{mod.signals.join(" · ")}</p>
            </>
          ) : (
            <Note>{t("notExtracted")}</Note>
          )}
          <Note>{t("archNote")}</Note>
        </Card>
      </details>
    </div>
  );
}
