import type { MessageKey } from "../i18n/dictionaries";
export const stages: {
  key: MessageKey;
  native: string;
  path: string;
  description: [string, string];
  status: "source" | "mapped";
}[] = [
  {
    key: "importDesign",
    native: "prep → run_verilator → run_synthesis",
    path: "openlane/designs/gemm_ip/ip_full.tcl",
    description: [
      "RTL top GEMM_top, hardened GemmAxiShell, 32 PE rows and 80 OpenRAM macros. Synthesis artifacts are not included.",
      "RTL top GEMM_top, GemmAxiShell harden, 32 hàng PE và 80 macro OpenRAM. Workspace chưa có artifact synthesis.",
    ],
    status: "source",
  },
  {
    key: "floorplanStage",
    native: "run_floorplan · gen_core_files.py · gen_ip_files.py",
    path: "openlane/gen_ip_files.py",
    description: [
      "Macro positions are reconstructed from checked-in placement generators and summary extents. No stage DEF is available.",
      "Vị trí macro dựng lại từ bộ sinh placement và kích thước trong bảng tóm tắt. Chưa có DEF giai đoạn này.",
    ],
    status: "source",
  },
  {
    key: "powerplanStage",
    native: "PDN inside run_floorplan · FP_PDN_MACRO_HOOKS",
    path: "openlane/designs/gemm_ip/config.tcl",
    description: [
      "vccd1 / vssd1 macro hooks and phased met4/met5 straps. The displayed network is illustrative, not extracted PDN wiring.",
      "Kết nối macro vccd1 / vssd1 và stripe met4/met5 theo pha. Lưới hiển thị là minh họa, chưa trích dây PDN.",
    ],
    status: "mapped",
  },
  {
    key: "placeOpt",
    native: "run_placement · keep_rows_clear.tcl",
    path: "openlane/designs/gemm_core/keep_rows_clear.tcl",
    description: [
      "Placement hooks keep standard cells out of the PE-row channels. No per-cell placement snapshot is available.",
      "Hook placement đẩy standard cell khỏi khe hàng PE. Chưa có snapshot placement theo từng cell.",
    ],
    status: "source",
  },
  {
    key: "cts",
    native: "run_cts · clk_latency_seed.tcl",
    path: "openlane/designs/gemm_ip/ip_full.tcl",
    description: [
      "Hierarchical clock latency and SRAM clock targets. A physical clock-tree topology is not extracted.",
      "Latency clock phân cấp và mục tiêu clock SRAM. Chưa trích topology cây clock vật lý.",
    ],
    status: "source",
  },
  {
    key: "postCTS",
    native: "run_resizer_timing · ip_hold_fix.tcl",
    path: "openlane/designs/gemm_ip/ip_hold_fix.tcl",
    description: [
      "Mapped to post-CTS repair in the native script; not an independent run or DEF snapshot.",
      "Ánh xạ sửa timing sau CTS trong script gốc; không phải run hay snapshot DEF độc lập.",
    ],
    status: "mapped",
  },
  {
    key: "route",
    native: "global_routing → macro_cross → detailed_routing",
    path: "openlane/designs/gemm_ip/ip_route_signoff.tcl",
    description: [
      "Macro-crossing checks precede detailed routing. Repeated DRT seeds and antenna repair are source-controlled flow behavior.",
      "Kiểm tra net xuyên macro trước detailed routing. Flow có nhiều seed DRT và sửa antenna.",
    ],
    status: "source",
  },
  {
    key: "routeOpt",
    native: "incremental ECO · s4c_round.py · s7_apply.py",
    path: "tools/eco/README.md",
    description: [
      "Route optimization maps to the incremental ECO flow in OpenROAD dcf36133, followed by checks in OpenLane 1.0.2.",
      "Tối ưu route ánh xạ sang ECO tăng dần bằng OpenROAD dcf36133, sau đó kiểm lại trong OpenLane 1.0.2.",
    ],
    status: "mapped",
  },
  {
    key: "sta",
    native: "OpenRCX → OpenSTA · sta6b.tcl · timing_gate.py",
    path: "docs/TIEN_DO_SIGNOFF.md",
    description: [
      "Final TT internal setup +1.428 ns, hold +0.319 ns. SS macro setup −4.944 ns is a reporting exception.",
      "Setup nội bộ TT cuối +1,428 ns, hold +0,319 ns. Setup SS qua macro −4,944 ns là ngoại lệ báo kèm.",
    ],
    status: "source",
  },
  {
    key: "pv",
    native: "ARC · Magic · Netgen LVS · KLayout XOR · GLS",
    path: "docs/TIEN_DO_SIGNOFF.md",
    description: [
      "Documented final ECO: ARC 0, DRT 0, Magic 0, LVS match, XOR 0 and GLS passing three workloads under the stated signoff policy.",
      "ECO cuối theo tài liệu: ARC 0, DRT 0, Magic 0, LVS khớp, XOR 0 và GLS đạt ba workload trong chính sách signoff đã nêu.",
    ],
    status: "source",
  },
];
