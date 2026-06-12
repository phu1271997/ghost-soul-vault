def to_hex(value):
    if isinstance(value, bytes):
        return "0x" + value.hex()
    return str(value)


import json


def test_set_limits_requires_positive_max(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/ghost.py")
    with direct_vm.expect_revert("max_per_request must be > 0"):
        contract.set_limits((0), (0), (3600))


def test_set_limits_requires_positive_inactivity(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/ghost.py")
    with direct_vm.expect_revert("inactivity_period must be > 0"):
        contract.set_limits((1), (0), (0))


def test_seal_requires_persona(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/ghost.py")
    contract.set_limits((1), (0), (3600))
    with direct_vm.expect_revert("Persona cannot be empty before sealing"):
        contract.seal_will()


def test_only_owner_can_heartbeat(direct_vm, direct_deploy, direct_bob):
    contract = direct_deploy("contracts/ghost.py")
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Only owner can heartbeat"):
        contract.heartbeat()


def test_force_seal_requires_inactivity_elapsed(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/ghost.py")
    contract.inactivity_period = (3600)
    with direct_vm.expect_revert("Owner still active"):
        contract.force_seal_if_inactive()


def test_converse_requires_registered_heir(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/ghost.py")
    contract.is_sealed = True
    with direct_vm.expect_revert("Not a registered heir"):
        contract.converse("Hello")
