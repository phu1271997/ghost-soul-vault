# Security Checklist

## Fixed in Resubmission

1. Public methods no longer accept `Address` directly where frontend ABI encoding caused crashes.
1. Address strings are normalized through `Address(...)` inside the contract with explicit `UserError` messages.
1. Zero-address and duplicate-heir registration are rejected.
1. TreeMap reads now use `.get(key, default)` in the hot paths that previously crashed.
1. Direct value transfer misuse was replaced by a pull-withdrawal pattern.
1. `run_nondet_unsafe` was replaced by `gl.eq_principle.prompt_comparative` in the key AI flows.

## Remaining Hardening Targets

1. Add executor override flow in-contract for seven-day post-denial review.
1. Persist an explicit petition ledger instead of relying on frontend session history for operator review.
1. Expand evidence sources with Google result summaries and richer GitHub activity analysis.
1. Add stricter direct-mode coverage around payable deposit handling once the local test runtime is pinned.
