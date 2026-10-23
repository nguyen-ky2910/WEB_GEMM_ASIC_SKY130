import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import unittest

sys.dont_write_bytecode=True
WEB=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('extract',WEB/'scripts/extraction/extract_project.py')
extract=importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract)

class ExtractorTests(unittest.TestCase):
    def test_def_units_and_rotated_macro(self):
        lef='MACRO SRAM\n SIZE 10 BY 20 ;\nEND SRAM\n'
        sizes=extract.parse_lef(lef)
        result=extract.parse_def('UNITS DISTANCE MICRONS 1000 ; DIEAREA ( 1000 2000 ) ( 101000 202000 ) ; COMPONENTS 2 ; - bank SRAM + FIXED ( 5000 6000 ) E ; - missing NO_LEF + PLACED ( 0 0 ) N ; END COMPONENTS',sizes)
        self.assertEqual(result['die'],[100,200])
        self.assertEqual(result['origin'],[1,2])
        self.assertEqual((result['macros'][0]['w'],result['macros'][0]['h']),(20,10))
        self.assertEqual(result['macros'][0]['x'],5)
        self.assertEqual(result['unresolvedMasters'],['NO_LEF'])

    def test_missing_def_units_fails(self):
        with self.assertRaises(ValueError):extract.parse_def('DIEAREA ( 0 0 ) ( 10 10 ) ;',{})

    def test_vcd_shared_alias_updates_every_name(self):
        vcd='$timescale 1 ns $end\n$scope module top $end\n$var wire 1 ! clock $end\n$scope module child $end\n$var wire 1 ! clk $end\n$var wire 4 # data $end\n$upscope $end\n$upscope $end\n$enddefinitions $end\n#0\n0!\nb1010 #\n#10\n1!\n#20\n0!\n'
        wave=extract.parse_vcd(vcd)
        self.assertEqual(wave['signals'][0]['events'],wave['signals'][1]['events'])
        self.assertEqual(wave['signals'][2]['events'],[[0,'1010']])
        self.assertEqual(wave['timescale'],'1 ns')

    def test_csv_preserves_quotes_and_empty_missing_values(self):
        rows=extract.read_csv(WEB/'public/evidence/docs/paper/data/antenna_convergence.csv')
        self.assertEqual(rows[0]['violating_pins'],'1133')
        self.assertEqual(rows[0]['violating_nets'],'')

    def test_original_source_hashes_unchanged(self):
        if not (WEB.parent/'rtl_asic').is_dir():
            self.skipTest('Standalone web checkout has no original research tree; originals are verified in the research workspace only.')
        files=json.loads((WEB/'scripts/validation/source-baseline.json').read_text())
        for entry in files:
            with self.subTest(path=entry['path']):
                path=WEB.parent/entry['path']
                self.assertTrue(path.exists())
                self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(),entry['sha256'])

    def test_bundled_evidence_matches_original_hashes(self):
        files=json.loads((WEB/'scripts/validation/source-baseline.json').read_text())
        checked=0
        for entry in files:
            path=WEB/'public/evidence'/entry['path']
            if path.is_file():
                data=path.read_bytes()
                # Text exports and research originals may use different LF/CRLF endings.
                lf=data.replace(b'\r\n',b'\n')
                variants=[data,lf,lf.replace(b'\n',b'\r\n')]
                self.assertIn(entry['sha256'],[hashlib.sha256(v).hexdigest() for v in variants],entry['path'])
                checked+=1
        self.assertGreater(checked,40)

if __name__=='__main__':unittest.main()
