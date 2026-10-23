"""Optional KLayout GDS -> top-level macro bounding boxes (not flattened polygons).
Input is read-only. Output is fixed inside this website. Never copies the GDS/PDK.
Install optional dependency yourself with: python -m pip install klayout
"""
import argparse
import json
from pathlib import Path
import re
import sys
sys.dont_write_bytecode=True
WEB=Path(__file__).resolve().parents[2]

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('gds',type=Path)
    parser.add_argument('--top',help='Required when GDS has multiple top cells')
    parser.add_argument('--master-pattern',default='ProcessingElementRow|sram|GemmAxiShell',help='Only include matched top-level macro masters')
    args=parser.parse_args()
    try:
        import klayout.db as kdb
    except ImportError:
        parser.error('Optional KLayout Python module is not installed. Install klayout to enable this adapter.')
    layout=kdb.Layout()
    layout.read(str(args.gds.resolve()))
    tops=list(layout.top_cells())
    if args.top:
        cell=layout.cell(args.top)
        if cell is None:parser.error('Requested top cell does not exist')
    elif len(tops)==1:cell=tops[0]
    else:parser.error('Multiple top cells; specify --top explicitly')
    scale=layout.dbu
    bounds=cell.bbox()
    origin=[bounds.left*scale,bounds.bottom*scale]
    macros=[]
    for index,instance in enumerate(cell.each_inst()):
        master=layout.cell(instance.cell_index)
        if not re.search(args.master_pattern,master.name,re.I):continue
        # Expand regular instance arrays; preserve transform / hierarchy by per-member bounds.
        for member,transform in enumerate(instance.each_cplx_trans()):
            box=master.bbox().transformed(transform)
            kind='row' if 'row' in master.name.lower() else 'sram' if 'sram' in master.name.lower() else 'axi' if 'axi' in master.name.lower() else 'macro'
            macros.append(dict(id=f'{cell.name}/{master.name}@{index}:{member}',name=f'{master.name} #{index}:{member}',master=master.name,type=kind,x=box.left*scale,y=box.bottom*scale,w=box.width()*scale,h=box.height()*scale,orientation=str(transform),rtl=None,source=f'{args.gds.name} · KLayout top-level bounding boxes; synthetic instance IDs'))
            if len(macros)>20000:parser.error('Over 20,000 matched instances; narrow --master-pattern')
    payload=dict(die=[bounds.width()*scale,bounds.height()*scale],origin=origin,macros=macros,kind='REAL DATA',source=f'{args.gds.name} · top {cell.name}; extracted macro BBOX only, not internal polygons. Top-cell bbox is not necessarily a die boundary.',unresolvedMasters=[])
    out=WEB/'public/generated-data/imported-layout.json'
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(payload,separators=(',',':')),encoding='utf8')
    print(f'{len(macros)} macro bounding boxes -> {out}. GDS source untouched.')

if __name__=='__main__':main()
