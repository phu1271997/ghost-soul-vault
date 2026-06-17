def to_hex(value):
    if isinstance(value, bytes):
        return "0x" + value.hex()
    return str(value)


import json


def setup_live_contract(direct_vm, direct_deploy, direct_alice):
    direct_vm.mock_web(r".*github\.com.*", {"status": 200, "body": "steady work and positive reputation"})
    direct_vm.mock_llm(
        r".*digital soul.*",
        json.dumps(
            {
                "soul_message": "You have shown discipline. I will help within reason.",
                "approved": True,
                "amount_approved": 5 * 10**17,
                "alignment_with_values": "Strong alignment",
                "living_with_integrity": True,
                "reasoning": "Responsible request for development.",
            }
        ),
    )
    contract = direct_deploy("contracts/ghost.py")
    contract.add_to_persona("Work hard, stay humble, help family.")
    contract.set_limits((10**18), (0), (3600))
    contract.register_heir(to_hex(direct_alice), "Alice", json.dumps(["https://github.com/octocat"]), (2 * 10**18))
    contract.total_vault = (2 * 10**18)
    contract.seal_will()
    return contract


def test_full_flow_converse_petition_withdraw(direct_vm, direct_deploy, direct_alice):
    contract = setup_live_contract(direct_vm, direct_deploy, direct_alice)
    direct_vm.sender = direct_alice
    soul_reply = contract.converse("I am studying and working.")
    assert "I am here" in soul_reply or "You have" in soul_reply

    result = json.loads(contract.petition("I need help paying tuition.", (8 * 10**17)))
    assert result["approved"] is True
    assert int(result["amount_final"]) > 0
    assert int(contract.get_withdrawable(to_hex(direct_alice))) > 0

    withdrawn = contract.withdraw()
    assert int(withdrawn) > 0
    assert int(contract.get_withdrawable(to_hex(direct_alice))) == 0


def test_petition_rejects_when_unregistered(direct_vm, direct_deploy, direct_bob):
    contract = direct_deploy("contracts/ghost.py")
    contract.add_to_persona("Integrity first.")
    contract.set_limits((10**18), (0), (3600))
    contract.seal_will = lambda: None
    contract.is_sealed = True
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Not a registered heir"):
        contract.petition("Hello", (1))


def test_petition_rejects_empty_vault(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/ghost.py")
    contract.add_to_persona("Integrity first.")
    contract.set_limits((10**18), (0), (3600))
    contract.register_heir(to_hex(direct_alice), "Alice", json.dumps(["https://github.com/octocat"]), (10))
    contract.is_sealed = True
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Vault is empty"):
        contract.petition("Need support", (1))


def test_withdraw_rejects_when_empty(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/ghost.py")
    contract.register_heir = lambda *args, **kwargs: None
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("No balance to withdraw"):
        contract.withdraw()


def test_get_heir_status_contains_withdrawable(direct_vm, direct_deploy, direct_alice):
    contract = setup_live_contract(direct_vm, direct_deploy, direct_alice)
    direct_vm.sender = direct_alice
    contract.petition("Need support", (3 * 10**17))
    status = json.loads(contract.get_heir_status(to_hex(direct_alice)))
    assert "withdrawable" in status
