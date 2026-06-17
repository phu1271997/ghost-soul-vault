def to_hex(value):
    if isinstance(value, bytes):
        return "0x" + value.hex()
    return str(value)


import json
import random


def test_withdrawable_plus_vault_never_exceeds_seeded_balance(direct_vm, direct_deploy, direct_alice):
    direct_vm.mock_web(r".*", {"status": 200, "body": "good life"})
    direct_vm.mock_llm(
        r".*digital soul.*",
        json.dumps(
            {
                "soul_message": "Approved.",
                "approved": True,
                "amount_approved": 10,
                "alignment_with_values": "Aligned",
                "living_with_integrity": True,
                "reasoning": "All good",
            }
        ),
    )

    contract = direct_deploy("contracts/ghost.py")
    contract.add_to_persona("Protect the family treasury.")
    contract.set_limits((10), (0), (3600))
    contract.register_heir(to_hex(direct_alice), "Alice", json.dumps(["https://github.com/octocat"]), (1000))
    contract.total_vault = (1000)
    contract.is_sealed = True
    direct_vm.sender = direct_alice

    seeded = 1000
    for _ in range(25):
      requested = random.randint(1, 10)
      try:
          contract.petition("Support productive work", (requested))
      except Exception:
          pass

      withdrawable = int(contract.get_withdrawable(to_hex(direct_alice)))
      vault_remaining = int(contract.get_vault())
      assert withdrawable + vault_remaining <= seeded
