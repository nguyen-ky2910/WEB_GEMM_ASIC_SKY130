"""Read-only source audit + lightweight evidence export. Writes only under chip-visualizer.
Never executes research generators or ASIC tools. Reconstructs floorplan by calling the
pure layout function of gen_core_files with bytecode writes disabled (not its main).
"""
import argparse
import csv
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import sys
from types import SimpleNamespace

sys.dont_write_bytecode = True
WEB = Path(__file__).resolve().parents[2]
ROOT = WEB.parent


def read_csv(path):
    with path.open(encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))


def parse_lef(text):
    """Macro extents; missing sizes are intentionally not inferred."""
    result = {}
    for m in re.finditer(r'\bMACRO\s+(\S+)(.*?)\bEND\s+\1\b', text, re.S):
        size = re.search(r'\bSIZE\s+([\d.]+)\s+BY\s+([\d.]+)', m[2])
        if size:
            result[m[1]] = [float(size[1]), float(size[2])]
    return result


def parse_def(text, sizes):
    units = re.search(r'UNITS\s+DISTANCE\s+MICRONS\s+(\d+)', text)
    if not units:
        raise ValueError('DEF is missing database units')
    u = float(units[1])
    die = re.search(r'DIEAREA\s*\(\s*(-?\d+)\s+(-?\d+)\s*\)\s*\(\s*(-?\d+)\s+(-?\d+)\s*\)', text)
    if not die:
        raise ValueError('Only rectangular DEF DIEAREA is supported')
    bbox = [int(die[i]) / u for i in range(1, 5)]
    body = re.search(r'\bCOMPONENTS\s+\d+\s*;(.*?)END COMPONENTS', text, re.S)
    macros, unresolved = [], []
    for m in re.finditer(r'-\s+(\S+)\s+(\S+)(.*?);', body[1] if body else '', re.S):
        pos = re.search(r'\+\s+(?:PLACED|FIXED|COVER)\s*\(\s*(-?\d+)\s+(-?\d+)\s*\)\s+(\w+)', m[3])
        if m[2] not in sizes:
            unresolved.append(m[2])
            continue
        if not pos:
            continue
        w, h = sizes[m[2]]
        if pos[3] in ('E', 'W', 'FE', 'FW'):
            w, h = h, w
        kind = 'row' if 'row' in m[2].lower() else 'sram' if 'sram' in m[2].lower() else 'macro'
        macros.append(dict(id=m[1], name=m[1].split('.')[-1], type=kind, master=m[2], x=int(pos[1])/u, y=int(pos[2])/u, w=w, h=h, orientation=pos[3], source='Imported DEF + LEF', rtl=None))
    return dict(die=[bbox[2]-bbox[0], bbox[3]-bbox[1]], origin=bbox[:2], macros=macros, unresolvedMasters=sorted(set(unresolved)), kind='REAL DATA', source='Imported DEF + LEF; known macro extents only')


def parse_vcd(text, max_events=12000):
    scopes, signals, aliases = [], [], {}
    timescale = re.search(r'\$timescale\s+(.*?)\s+\$end', text, re.S)
    header, sep, body = text.partition('$enddefinitions')
    if not sep:
        raise ValueError('Missing VCD enddefinitions')
    for line in header.splitlines():
        parts = line.strip().split()
        if parts[:1] == ['$scope']:
            scopes.append(parts[2])
        elif parts[:1] == ['$upscope']:
            if scopes:
                scopes.pop()
        elif parts[:1] == ['$var'] and len(parts) >= 6 and parts[1] != 'real':
            signal = dict(name='.'.join(scopes + [parts[4]]), width=int(parts[2]), events=[])
            aliases.setdefault(parts[3], []).append(signal)
            signals.append(signal)
    time, count = 0, 0
    for line in body.splitlines():
        line = line.strip()
        if line.startswith('#'):
            time = int(line[1:])
        elif line and line[0] in '01xXzZbB':
            if line[0] in 'bB':
                parts = line[1:].split()
                if len(parts) != 2:
                    continue
                value, code = parts
            else:
                value, code = line[0], line[1:]
            for signal in aliases.get(code, []):
                signal['events'].append([time, value.lower()])
            count += 1
            if count >= max_events:
                break
    return dict(signals=signals, end=time, timescale=timescale[1].strip() if timescale else 'Not Available', truncated=count >= max_events, source='Imported VCD', kind='REAL DATA')


def reconstruct_floorplan():
    sys.path.insert(0, str(ROOT / 'openlane'))
    spec = importlib.util.spec_from_file_location('source_floorplan', ROOT / 'openlane/gen_core_files.py')
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    # Exact row dimensions from row_summary.csv, CORE_GEN_DEFAULT from run_flow.sh.
    args = SimpleNamespace(a_gap_x=200.0, strip=1000.0, b_wide=True, b_gap_y=200.0, band=None)
    feeder = mod.macros_of('u_buffer_feeder.u_feature_tile_mem', 256, 512) + mod.macros_of('u_buffer_feeder.u_weight_tile_mem', 256, 1024)
    inbuf = mod.macros_of('u_input_buffer.u_feature_mem', 256, 512) + mod.macros_of('u_input_buffer.u_weight_mem', 256, 1024)
    outbuf = mod.macros_of('u_output_buffer.u_accum_mem', 1024, 512)
    row_w, row_h = 3517.62, 133.28
    gap = mod.snap_up(20.0, mod.SITE_H)
    # Read the actual default --gap instead of assuming it.
    source = (ROOT / 'openlane/gen_core_files.py').read_text(encoding='utf8')
    default_gap = re.search(r'add_argument\("--gap",\s*type=float,\s*default=([\d.]+)', source)
    if not default_gap:
        raise ValueError('Cannot identify floorplan row gap')
    gap = mod.snap_up(float(default_gap[1]), mod.SITE_H)
    result = mod.layout_v3(args, 32, 8, row_w, row_h, gap, row_h+gap, feeder, inbuf, outbuf, 'u_buffer_feeder.u_compute_core.u_processing_element_array')
    place, w, h = result[:3]
    macros = []
    for i, (name, x, y, orient, mw, mh) in enumerate(place):
        row = name.endswith('u_row')
        macros.append(dict(id=name, name=f'PE ROW {i:02}' if row else f'SRAM {i-32:02}', type='row' if row else 'sram', master='ProcessingElementRow' if row else mod.SRAM, x=x,y=y,w=mw,h=mh,orientation=orient,rtl='rtl_asic/PE_row.v' if row else 'rtl_asic/sram_1r1w.v', source='gen_core_files.py layout_v3 + run_flow.sh CORE_GEN_DEFAULT + row_summary.csv'))
    return dict(die=[w,h], origin=[0,0], macros=macros, kind='RECONSTRUCTED', source='core_v11 constraints reconstruction; NOT an as-built DEF snapshot', unresolvedMasters=[])


def extract():
    files = sorted(p for p in ROOT.rglob('*') if p.is_file() and WEB not in p.parents and '.git' not in p.parts)
    inventory = [dict(path=p.relative_to(ROOT).as_posix(), size=p.stat().st_size, sha256=hashlib.sha256(p.read_bytes()).hexdigest()) for p in files]
    baseline = WEB / 'scripts/validation/source-baseline.json'
    baseline.parent.mkdir(parents=True, exist_ok=True)
    if not baseline.exists():
        baseline.write_text(json.dumps(inventory, indent=2), encoding='utf8')
    data_dir = ROOT / 'docs/paper/data'
    tables = {}
    for name in ['ip_summary','row_summary','axi_summary','energy_job_50MHz','perf_gls_50MHz','power_by_phase_50MHz','antenna_convergence','slack_histogram_final','routing_utilisation','blocks_pe_row','sram_range_50MHz','power_clock_vs_data_64','cap_ratio_rcx_grt','reproducibility','irdrop_ip_v2_summary','irdrop_v2A_summary','irdrop_v2B_summary','irdrop_v2B_vccd1_worst100','irdrop_v2B_vssd1_worst100','sram_clk_slew_before_after','drv_by_eco_round','leakage_by_block_3corners']:
        path = data_dir / f'{name}.csv'
        if path.exists():
            tables[name] = dict(source=path.relative_to(ROOT).as_posix(), rows=read_csv(path))
    modules = []
    for path in sorted((ROOT/'rtl_asic').rglob('*.v')):
        text = re.sub(r'//[^\n]*|/\*.*?\*/', '', path.read_text(encoding='utf8'), flags=re.S)
        for name in re.findall(r'\bmodule\s+(\w+)', text):
            modules.append(dict(name=name, source=path.relative_to(ROOT).as_posix(), signals=re.findall(r'\b(?:input|output)\s+(?:wire\s+|reg\s+)?(?:signed\s+)?(?:\[[^]]+\]\s*)?(\w+)',text)))
    notes = []
    for line in (ROOT/'NHATKY.md').read_text(encoding='utf8').splitlines():
        if re.match(r'\| core_v\w+ \|',line):
            cols = [s.strip() for s in line.strip('|').split('|')]
            notes.append(dict(run=cols[0],change=cols[1],result=cols[2],source='NHATKY.md',evidence='Documented history; raw run artifacts absent'))
    # Trace text is genuine sampled RTL debug output; no invented clock samples.
    trace_path = data_dir/'errata_trace_M2_2x32x32.txt'
    trace_rows = []
    for line in trace_path.read_text(encoding='utf8').splitlines():
        pairs = re.findall(r'(\w+)=(-?\d+)', line)
        if pairs:
            trace_rows.append({k:int(v) for k,v in pairs})
    trace = dict(source=trace_path.relative_to(ROOT).as_posix(), kind='REAL DATA', timescale='sampled RTL cycles (sparse)', rows=trace_rows)
    signoff_source = 'docs/TIEN_DO_SIGNOFF.md'
    # Transcribed documented summary, explicitly distinct from direct report parsing.
    signoff = dict(source=signoff_source, evidence='Documented signoff; raw final signoff files absent locally', run='gemm_ip final ECO s7E/a5', date='2026-10-20', frequencyMHz=50, setupTT=1.428, holdTT=0.319, holdFF=0.126, holdSS=0.231, setupSS=-4.944, drt=0, magic=0, antenna=0, lvs='Match', xor=0, gls='PASS · 3 shapes', ioHoldSS=-4.041, sramClockSlewTT=0.739)
    floorplan = reconstruct_floorplan()
    # Full-IP offset follows gen_ip_files.py; extents from the extracted CSV.
    ip = {r['metric']:r['value'] for r in tables['ip_summary']['rows']}
    axi = {r['metric']:r['value'] for r in tables['axi_summary']['rows']}
    ipw, iph = float(ip['die_w_um']), float(ip['die_h_um'])
    dx, dy = round(ipw-floorplan['die'][0],2), round(iph-floorplan['die'][1],2)
    for m in floorplan['macros']:
        m['x'], m['y'] = round(m['x']+dx,2), round(m['y']+dy,2)
        m['id'] = 'u_gemm_accelerator.'+m['id']
    ip_source=(ROOT/'openlane/gen_ip_files.py').read_text(encoding='utf8')
    sx_match=re.search(r'add_argument\("--shell-x",\s*type=float,\s*default=([\d.]+)',ip_source)
    if not sx_match:
        raise ValueError('Missing AXI shell x default')
    floorplan['macros'].append(dict(id='u_axi_shell',name='AXI SHELL',type='axi',master='GemmAxiShell',x=float(sx_match[1]),y=10.88,w=float(axi['die_w_um']),h=float(axi['die_h_um']),orientation='N',rtl='rtl_asic/axi/GemmAxiShell.v',source='gen_ip_files.py defaults + axi_summary.csv'))
    floorplan['die']=[ipw,iph]
    floorplan['source']='Full-IP constraints reconstruction: gen_core_files.py + gen_ip_files.py + ip/row/axi_summary.csv; not an as-built DEF'
    payload = dict(schemaVersion=1, version=dict(branch=None,commit=None,note='Workspace is a source export without .git; reference branch eco-signoff-wip is not verified'), inventory=inventory, modules=modules, tables=tables, floorplan=floorplan, runs=notes, trace=trace, signoff=signoff, availability={ext: [f['path'] for f in inventory if f['path'].lower().endswith('.'+ext)] for ext in ['def','lef','gds','vcd','spef','sdf','sdc','rpt','csv','log']})
    out = WEB/'public/generated-data/project.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')),encoding='utf8')
    # Make only small, reviewed evidence text browsable. No PDK, layout binaries or large files.
    evidence = {t['source'] for t in tables.values()} | {signoff_source,'README.md','NHATKY.md','docs/paper/SUMMARY.md',trace['source'],'docs/paper/data/errata_rtl_tests.txt','docs/paper/data/gls_errata.txt','docs/paper/data/pe_equiv2_yosys062.log'}
    evidence |= {m['source'] for m in modules}
    evidence |= {'tools/eco/README.md','openlane/designs/gemm_ip/ip_full.tcl','openlane/gen_ip_files.py','openlane/designs/gemm_ip/config.tcl','openlane/designs/gemm_core/keep_rows_clear.tcl','openlane/designs/gemm_ip/ip_hold_fix.tcl','openlane/designs/gemm_ip/ip_route_signoff.tcl'}
    for rel in evidence:
        target = WEB/'public/evidence'/rel
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_text((ROOT/rel).read_text(encoding='utf8'),encoding='utf8')
    for rel in ['layout/chip_blocks.png','irdrop_map_v2A.png','irdrop_map_v2B.png','placement_density.png']:
        src=ROOT/'docs/paper/figures'/rel
        if src.exists() and src.stat().st_size<5*1024*1024:
            target=WEB/'public/assets'/rel
            target.parent.mkdir(parents=True,exist_ok=True)
            target.write_bytes(src.read_bytes())
    print(f'{len(inventory)} source files audited; {len(modules)} RTL modules; {len(payload["floorplan"]["macros"])} reconstructed macro extents; {len(tables)} evidence tables. No source files written.')


def main():
    global ROOT
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project-root',type=Path,help='Research source root; not needed for DEF/LEF/VCD-only imports')
    parser.add_argument('--def-file',type=Path)
    parser.add_argument('--lef',type=Path,action='append',default=[])
    parser.add_argument('--vcd',type=Path)
    args=parser.parse_args()
    if args.project_root:
        ROOT=args.project_root.resolve()
    (WEB/'public/generated-data').mkdir(parents=True,exist_ok=True)
    if not (args.def_file or args.vcd):
        extract()
    if args.def_file:
        sizes={}
        for path in args.lef:
            sizes.update(parse_lef(path.read_text(encoding='utf8',errors='replace')))
        geometry=parse_def(args.def_file.read_text(encoding='utf8',errors='replace'),sizes)
        geometry['source']=f'{args.def_file.name} + '+', '.join(p.name for p in args.lef)
        (WEB/'public/generated-data/imported-layout.json').write_text(json.dumps(geometry),encoding='utf8')
    if args.vcd:
        if args.vcd.stat().st_size > 128*1024*1024:
            raise ValueError('Pre-window VCD to <=128 MiB with the existing VCD window tools first')
        wave=parse_vcd(args.vcd.read_text(encoding='utf8',errors='replace'))
        wave['source']=args.vcd.name
        (WEB/'public/generated-data/imported-waveform.json').write_text(json.dumps(wave),encoding='utf8')


if __name__=='__main__':
    main()
