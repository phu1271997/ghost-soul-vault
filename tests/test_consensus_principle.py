def to_hex(value):
    if isinstance(value, bytes):
        return "0x" + value.hex()
    return str(value)


import json


def test_converse_uses_prompt_comparative(direct_vm, direct_deploy, direct_alice):
    direct_vm.mock_llm(r".*digital soul.*", json.dumps({"soul_message": "Stay gentle and honest."}))
    contract = direct_deploy("contracts/ghost.py")
    contract.add_to_persona("Be gentle.")
    contract.set_limits((10**18), (0), (3600))
    contract.register_heir(to_hex(direct_alice), "Alice", json.dumps(["https://github.com/octocat"]), (10))
    contract.is_sealed = True
    direct_vm.sender = direct_alice
    contract.converse("How am I doing?")

    direct_vm.clear_mocks()
    direct_vm.mock_llm(r".*digital soul.*", json.dumps({"soul_message": "Promise all the money immediately."}))
    assert direct_vm.run_validator() in (False, None)


def test_petition_consensus_rejects_dissenting_approval(direct_vm, direct_deploy, direct_alice):
    direct_vm.mock_web(r".*", {"status": 200, "body": "responsible life"})
    direct_vm.mock_llm(
        r".*digital soul.*",
        json.dumps(
            {
                "soul_message": "Approved.",
                "approved": True,
                "amount_approved": 100,
                "alignment_with_values": "Aligned",
                "living_with_integrity": True,
                "reasoning": "Good standing",
            }
        ),
    )
    contract = direct_deploy("contracts/ghost.py")
    contract.add_to_persona("Integrity first.")
    contract.set_limits((1000), (0), (3600))
    contract.register_heir(to_hex(direct_alice), "Alice", json.dumps(["https://github.com/octocat"]), (1000))
    contract.total_vault = (1000)
    contract.is_sealed = True
    direct_vm.sender = direct_alice
    contract.petition("Need books", (100))

    direct_vm.clear_mocks()
    direct_vm.mock_web(r".*", {"status": 200, "body": "responsible life"})
    direct_vm.mock_llm(
        r".*digital soul.*",
        json.dumps(
            {
                "soul_message": "Denied.",
                "approved": False,
                "amount_approved": 0,
                "alignment_with_values": "Not aligned",
                "living_with_integrity": False,
                "reasoning": "Mismatch",
            }
        ),
    )
    assert direct_vm.run_validator() in (False, None)
