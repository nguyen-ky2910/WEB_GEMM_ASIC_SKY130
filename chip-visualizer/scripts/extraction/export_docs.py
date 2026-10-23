"""Copy this website's small documentation for static viewing; no source-research access."""
from pathlib import Path
WEB=Path(__file__).resolve().parents[2]
target=WEB/'public/docs'
target.mkdir(parents=True,exist_ok=True)
for name in ['README.md','DATA_AVAILABILITY.md','DATA_SOURCES.md','DATA_INTEGRATION_GUIDE.md','LIMITATIONS.md','IMPLEMENTATION_STATUS.md']:
    (target/name).write_bytes((WEB/name).read_bytes())
print('6 documentation files exported for static viewing.')
