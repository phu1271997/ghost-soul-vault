#!/usr/bin/env python3
import re
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "contracts" / "ghost.py"


def main() -> int:
    cmd = ["genlayer", "deploy", "--contract", str(CONTRACT)]
    completed = subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True)
    print(completed.stdout)
    if completed.returncode != 0:
      print(completed.stderr)
      return completed.returncode

    match = re.search(r"0x[a-fA-F0-9]{40}", completed.stdout)
    if match:
        print(f"\nDeployed contract: {match.group(0)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
