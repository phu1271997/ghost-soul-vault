#!/usr/bin/env python3
import argparse
import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SAMPLES_DIR = ROOT / "docs" / "samples"


def run_write(contract: str, method: str, args: list[str]) -> None:
    cmd = ["genlayer", "write", contract, method]
    if args:
        cmd.extend(["--args", *args])
    completed = subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True)
    print(completed.stdout)
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("contract_address")
    parser.add_argument("--sample", default="family_scenario_1.json")
    args = parser.parse_args()

    sample_path = SAMPLES_DIR / args.sample
    sample = json.loads(sample_path.read_text())

    for persona_line in sample["persona_lines"]:
        run_write(args.contract_address, "add_to_persona", [persona_line])

    run_write(
        args.contract_address,
        "set_executor",
        [sample["executor"]],
    )
    run_write(
        args.contract_address,
        "set_limits",
        [
            str(sample["limits"]["max_per_request_wei"]),
            str(sample["limits"]["release_cooldown"]),
            str(sample["limits"]["inactivity_period"]),
        ],
    )

    for heir in sample["heirs"]:
        run_write(
            args.contract_address,
            "register_heir",
            [
                heir["address"],
                heir["name"],
                json.dumps(heir["socials"]),
                str(heir["allocation_wei"]),
            ],
        )

    print("Demo family seeded. Deposit and seal the will separately.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
