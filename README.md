# Ghost · Conditional Inheritance Vault

Ghost dies without GenLayer because only Intelligent Contracts can:  
1. inspect live web evidence about heirs on-chain,  
1. let validators compare subjective AI judgment about integrity and values, and  
1. still enforce deterministic payout guardrails that prevent the soul agent from draining the vault.

Ghost is a luxury dark-themed inheritance dApp where a deceased persona can converse with heirs and decide whether to release funds based on lifestyle alignment, public evidence, and family values.

## Core Fixes in This Resubmission

1. `Address` parameters in public methods were replaced with `str` inputs plus internal `Address(...)` parsing.
1. Direct transfer misuse was replaced with a pull-withdrawal pattern via `withdrawable_balance` and `withdraw()`.
1. `run_nondet_unsafe` was replaced in the hot flows with `gl.eq_principle.prompt_comparative`.
1. Unsafe `TreeMap[key]` reads in key flows were replaced with `.get(...)`.
1. The frontend now includes contract health checks, a safer route structure, a demo gallery, and a dedicated treasury view.

## Product Surfaces

1. `/`
   Story-first landing page and submission framing.
1. `/setup`
   Owner setup wizard for persona, executor, guardrails, heirs, deposit, and seal flow.
1. `/heir`
   Conversation and petition dashboard for a registered heir.
1. `/petition/latest`
   Latest verdict card rendered from the most recent finalized petition receipt.
1. `/executor`
   Review surface for the planned override workflow.
1. `/demo`
   Demo family gallery with two sample scenarios.
1. `/treasury`
   Vault and connected-heir treasury breakdown.

## Contract Notes

Main deployable entrypoint:

- `contracts/ghost.py`

Supporting documentation:

- `docs/ARCHITECTURE.md`
- `docs/ECONOMICS.md`
- `docs/SECURITY.md`
- `docs/SAMPLES.md`

## Local Run

```bash
npm install
npm run build
npm run dev
```

Environment:

```bash
cp .env.example .env
```

Set:

```bash
VITE_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT
```

## GenLayer Flow

Deploy:

```bash
python3 scripts/deploy.py
```

Seed sample family:

```bash
python3 scripts/seed_demo_family.py <contract-address> --sample family_scenario_1.json
```

## Tests

The repository includes pytest-style GenLayer direct mode tests under `tests/`.

Planned command:

```bash
pytest tests -v
```

## Demo Scenarios

1. `docs/samples/family_scenario_1.json`
   Traditional father with three heirs.
1. `docs/samples/family_scenario_2.json`
   Integrity-focused tycoon with two heirs.

## Solidity vs GenLayer

| Question | Solidity only | Ghost on GenLayer |
| --- | --- | --- |
| Read live public evidence | No | Yes |
| Make subjective moral judgment | No | Yes |
| Keep final payout deterministic | Yes | Yes |
| Combine both in one contract system | No | Yes |
