# Economics and Guardrails

Ghost intentionally separates recommendation from release.

## Release Formula

The LLM can only recommend. The final payout is clipped on-chain:

`amount_final = min(ai_amount, remaining_allocation, max_per_request, total_vault)`

## Pull Withdrawal Pattern

The contract never pushes GEN directly to an heir during `petition()`.

1. `petition()` credits `withdrawable_balance[heir]`
1. The heir calls `withdraw()`
1. The contract emits a finalization-time external transfer to the heir address

This prevents direct-send bugs, makes state transitions auditable, and avoids coupling LLM consensus to value transfer side effects.

## Treasury Invariant

At every step:

`sum(withdrawable balances) + total_vault <= total deposited`

The property test in `tests/test_treasury_solvency.py` is intended to guard this invariant over repeated petitions.
