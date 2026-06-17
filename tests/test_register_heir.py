def to_hex(value):
    if isinstance(value, bytes):
        return "0x" + value.hex()
    return str(value)


import json


def bootstrap(contract, owner, heir):
    contract.set_limits((10**18), (60), (3600))
    contract.register_heir(to_hex(heir), "Alice", json.dumps(["https://github.com/octocat"]), (2 * 10**18))


def test_register_heir_accepts_string_address(direct_deploy, direct_owner, direct_alice):
    contract = direct_deploy("contracts/ghost.py")
    bootstrap(contract, direct_owner, direct_alice)
    assert contract.is_registered_heir(to_hex(direct_alice)) is True


def test_register_heir_rejects_invalid_hex(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/ghost.py")
    contract.set_limits((10**18), (60), (3600))
    with direct_vm.expect_revert("Invalid address format"):
        contract.register_heir("not-an-address", "Alice", json.dumps(["https://github.com/octocat"]), (10))


def test_register_heir_rejects_zero_address(direct_vm, direct_deploy):
    contract = direct_deploy("contracts/ghost.py")
    contract.set_limits((10**18), (60), (3600))
    with direct_vm.expect_revert("Zero address not allowed"):
        contract.register_heir(
            "0x0000000000000000000000000000000000000000",
            "Alice",
            json.dumps(["https://github.com/octocat"]),
            (10),
        )


def test_register_heir_rejects_duplicate(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/ghost.py")
    bootstrap(contract, None, direct_alice)
    with direct_vm.expect_revert("Heir already registered"):
        contract.register_heir(to_hex(direct_alice), "Alice", json.dumps(["https://github.com/octocat"]), (10))


def test_register_heir_rejects_invalid_social_json(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/ghost.py")
    contract.set_limits((10**18), (60), (3600))
    with direct_vm.expect_revert("social_json must be array"):
        contract.register_heir(to_hex(direct_alice), "Alice", json.dumps({"x": "bad"}), (10))
