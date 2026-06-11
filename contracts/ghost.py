# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json
import time


@gl.evm.contract_interface
class Recipient:
    class View:
        pass

    class Write:
        pass


class Contract(gl.Contract):
    owner: Address
    executor: Address
    is_sealed: bool
    soul_persona: str
    total_vault: u256
    max_per_request: u256
    release_cooldown: u256
    inactivity_period: u256
    last_heartbeat: u256
    heir_count: u256

    heir_registered: TreeMap[Address, bool]
    heir_name: TreeMap[Address, str]
    heir_social_json: TreeMap[Address, str]
    heir_allocation: TreeMap[Address, u256]
    heir_released: TreeMap[Address, u256]
    heir_last_release: TreeMap[Address, u256]
    convo_log: TreeMap[Address, str]
    withdrawable_balance: TreeMap[Address, u256]

    def __init__(self):
        self.owner = gl.message.sender_address
        self.executor = gl.message.sender_address
        self.is_sealed = False
        self.soul_persona = ""
        self.total_vault = u256(0)
        self.max_per_request = u256(0)
        self.release_cooldown = u256(0)
        self.inactivity_period = u256(0)
        self.last_heartbeat = _now()
        self.heir_count = u256(0)

    @gl.public.write
    def add_to_persona(self, text: str) -> None:
        self._only_owner_setup()
        clean_text = text.strip()
        if clean_text == "":
            raise gl.vm.UserError("Persona text cannot be empty")
        if self.soul_persona == "":
            self.soul_persona = clean_text
        else:
            self.soul_persona = self.soul_persona + "\n" + clean_text

    @gl.public.write
    def set_executor(self, addr: str) -> str:
        self._only_owner_setup()
        executor_addr = _parse_address(addr)
        self.executor = executor_addr
        return executor_addr.as_hex

    @gl.public.write
    def set_limits(
        self,
        max_per_request: u256,
        release_cooldown: u256,
        inactivity_period: u256,
    ) -> None:
        self._only_owner_setup()
        if int(max_per_request) == 0:
            raise gl.vm.UserError("max_per_request must be > 0")
        if int(inactivity_period) == 0:
            raise gl.vm.UserError("inactivity_period must be > 0")
        self.max_per_request = max_per_request
        self.release_cooldown = release_cooldown
        self.inactivity_period = inactivity_period

    @gl.public.write
    def register_heir(
        self,
        addr: str,
        name: str,
        social_json: str,
        allocation: u256,
    ) -> str:
        self._only_owner_setup()
        if int(self.max_per_request) == 0 or int(self.inactivity_period) == 0:
            raise gl.vm.UserError("Set limits before registering heirs")

        heir_addr = _parse_address(addr)
        if self.heir_registered.get(heir_addr, False):
            raise gl.vm.UserError("Heir already registered")

        clean_name = name.strip()
        if clean_name == "":
            raise gl.vm.UserError("Heir name cannot be empty")

        socials = _validate_social_json(social_json)
        if int(allocation) == 0:
            raise gl.vm.UserError("Allocation must be > 0")

        self.heir_registered[heir_addr] = True
        self.heir_name[heir_addr] = clean_name
        self.heir_social_json[heir_addr] = json.dumps(socials)
        self.heir_allocation[heir_addr] = allocation
        self.heir_released[heir_addr] = u256(0)
        self.heir_last_release[heir_addr] = u256(0)
        self.convo_log[heir_addr] = "[]"
        self.withdrawable_balance[heir_addr] = u256(0)
        self.heir_count = u256(int(self.heir_count) + 1)
        return heir_addr.as_hex

    @gl.public.write.payable
    def deposit(self) -> None:
        self._only_owner_setup()
        amount = gl.message.value
        if int(amount) == 0:
            raise gl.vm.UserError("Deposit amount must be greater than 0")
        self.total_vault = u256(int(self.total_vault) + int(amount))

    @gl.public.write
    def heartbeat(self) -> None:
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("Only owner can heartbeat")
        self.last_heartbeat = _now()

    @gl.public.write
    def seal_will(self) -> None:
        sender = gl.message.sender_address
        if sender != self.owner and sender != self.executor:
            raise gl.vm.UserError("Only owner or executor can seal")
        if self.is_sealed:
            raise gl.vm.UserError("Will already sealed")
        if self.soul_persona == "":
            raise gl.vm.UserError("Persona cannot be empty before sealing")
        if int(self.max_per_request) == 0 or int(self.inactivity_period) == 0:
            raise gl.vm.UserError("Limits not configured")
        if not self._has_registered_heir():
            raise gl.vm.UserError("At least one heir is required before sealing")
        self.is_sealed = True

    @gl.public.write
    def force_seal_if_inactive(self) -> None:
        if int(self.inactivity_period) == 0:
            raise gl.vm.UserError("Inactivity period not set")
        if int(_now()) - int(self.last_heartbeat) <= int(self.inactivity_period):
            raise gl.vm.UserError("Owner still active")
        self.is_sealed = True

    @gl.public.write
    def converse(self, message: str) -> str:
        heir_addr = self._only_active_heir()
        clean_message = message.strip()
        if clean_message == "":
            raise gl.vm.UserError("Message cannot be empty")

        persona = self.soul_persona
        history = self.convo_log.get(heir_addr, "[]")

        def leader_fn():
            task = (
                "You are the digital soul of a deceased parent or grandparent. "
                "Respond warmly, consistently, and in character. "
                "This conversation is emotional support only. Do not discuss money. "
                f"\n\nVALUES AND MEMORIES:\n{persona}\n\n"
                f"CHAT HISTORY:\n{history}\n\n"
                f"HEIR MESSAGE:\n{clean_message}\n\n"
                'Return JSON only: {"soul_message":"..."}'
            )
            return gl.nondet.exec_prompt(task, response_format="json")

        result = gl.eq_principle.prompt_comparative(
            leader_fn,
            (
                "Validators must produce a soul_message that maintains consistent "
                "persona, tone, and emotional alignment with the deceased's "
                "recorded values. Exact wording may differ but tone and the "
                "absence of financial commitments must match across validators."
            ),
        )
        res_dict = _parse_json(result)
        soul_message = str(res_dict.get("soul_message", "")).strip()
        if soul_message == "":
            soul_message = "I am here with you. Speak honestly and keep living with dignity."

        self._append_log(heir_addr, "heir", clean_message)
        self._append_log(heir_addr, "soul", soul_message)
        return soul_message

    @gl.public.write
    def petition(self, message: str, requested_amount: u256) -> str:
        heir_addr = self._only_active_heir()
        clean_message = message.strip()
        if clean_message == "":
            raise gl.vm.UserError("Petition message cannot be empty")
        if int(requested_amount) == 0:
            raise gl.vm.UserError("Requested amount must be > 0")
        if int(self.total_vault) == 0:
            raise gl.vm.UserError("Vault is empty")

        last_release = self.heir_last_release.get(heir_addr, u256(0))
        if int(_now()) - int(last_release) < int(self.release_cooldown):
            raise gl.vm.UserError("Cooldown active")

        allocation = self.heir_allocation.get(heir_addr, u256(0))
        released = self.heir_released.get(heir_addr, u256(0))
        remaining = u256(int(allocation) - int(released))
        if int(remaining) <= 0:
            raise gl.vm.UserError("Allocation exhausted")

        persona = self.soul_persona
        history = self.convo_log.get(heir_addr, "[]")
        social_json = self.heir_social_json.get(heir_addr, "[]")
        socials = _validate_social_json(social_json)
        heir_name = self.heir_name.get(heir_addr, "Unknown heir")

        def leader_fn():
            scraped = _scrape_sources(socials)
            life = "\n\n".join(scraped)
            task = (
                "You are the digital soul of a deceased family elder deciding "
                "whether to approve inheritance funds. Be compassionate but firm. "
                "Judge whether the heir is living with integrity and whether the "
                "request aligns with the family's values. "
                f"\n\nHEIR NAME:\n{heir_name}\n\n"
                f"VALUES AND MEMORIES:\n{persona}\n\n"
                f"LIVE EVIDENCE ABOUT THE HEIR:\n{life}\n\n"
                f"CHAT HISTORY:\n{history}\n\n"
                f"PETITION MESSAGE:\n{clean_message}\n\n"
                f"REQUESTED AMOUNT:\n{int(requested_amount)}\n\n"
                "Return JSON only with keys: "
                '{"soul_message":"...","approved":false,"amount_approved":0,'
                '"alignment_with_values":"...","living_with_integrity":true,'
                '"reasoning":"..."}'
            )
            return gl.nondet.exec_prompt(task, response_format="json")

        verdict = _parse_json(
            gl.eq_principle.prompt_comparative(
                leader_fn,
                (
                    "Validators MUST agree on: "
                    "(1) approved boolean — exact match required. "
                    "If one validator approves and another denies, consensus fails. "
                    "(2) amount_approved — if both approve, the amounts must be within "
                    "plus or minus twenty percent relative deviation. "
                    "(3) living_with_integrity boolean — exact match required. "
                    "Minor wording differences in soul_message, reasoning, and "
                    "alignment_with_values are acceptable, but the core "
                    "moral and financial verdict must align."
                ),
            )
        )

        approved = bool(verdict.get("approved", False))
        ai_amount = _coerce_u256(verdict.get("amount_approved", 0))
        amount_final = u256(0)
        if approved:
            amount_final = _min4(ai_amount, remaining, self.max_per_request, self.total_vault)

        if int(amount_final) > 0:
            self.heir_released[heir_addr] = u256(int(released) + int(amount_final))
            self.heir_last_release[heir_addr] = _now()
            self.total_vault = u256(int(self.total_vault) - int(amount_final))
            current_withdrawable = self.withdrawable_balance.get(heir_addr, u256(0))
            self.withdrawable_balance[heir_addr] = u256(
                int(current_withdrawable) + int(amount_final)
            )

        soul_message = str(verdict.get("soul_message", "")).strip()
        if soul_message == "":
            soul_message = "I have considered your request carefully."

        result_payload = {
            "soul_message": soul_message,
            "approved": approved,
            "amount_approved": str(ai_amount),
            "amount_final": str(amount_final),
            "alignment_with_values": str(verdict.get("alignment_with_values", "")),
            "living_with_integrity": bool(verdict.get("living_with_integrity", False)),
            "reasoning": str(verdict.get("reasoning", "")),
        }

        self._append_log(heir_addr, "heir", f"[PETITION {int(requested_amount)}] {clean_message}")
        self._append_log(heir_addr, "soul", soul_message)
        self._append_log(heir_addr, "release", str(int(amount_final)))
        return json.dumps(result_payload)

    @gl.public.write
    def withdraw(self) -> u256:
        sender = gl.message.sender_address
        amount = self.withdrawable_balance.get(sender, u256(0))
        if int(amount) == 0:
            raise gl.vm.UserError("No balance to withdraw")
        self.withdrawable_balance[sender] = u256(0)
        Recipient(sender).emit_transfer(value=amount)
        return amount

    @gl.public.view
    def get_convo_log(self, heir: str) -> str:
        heir_addr = _parse_address(heir)
        return self.convo_log.get(heir_addr, "[]")

    @gl.public.view
    def get_heir_status(self, heir: str) -> str:
        heir_addr = _parse_address(heir)
        allocation = self.heir_allocation.get(heir_addr, u256(0))
        released = self.heir_released.get(heir_addr, u256(0))
        remaining = u256(0)
        if int(allocation) >= int(released):
            remaining = u256(int(allocation) - int(released))

        return json.dumps(
            {
                "registered": self.heir_registered.get(heir_addr, False),
                "name": self.heir_name.get(heir_addr, ""),
                "allocation": str(allocation),
                "released": str(released),
                "remaining": str(remaining),
                "last_release": str(self.heir_last_release.get(heir_addr, u256(0))),
                "withdrawable": str(self.withdrawable_balance.get(heir_addr, u256(0))),
            }
        )

    @gl.public.view
    def is_registered_heir(self, addr: str) -> bool:
        heir_addr = _parse_address(addr)
        return self.heir_registered.get(heir_addr, False)

    @gl.public.view
    def get_withdrawable(self, addr: str) -> u256:
        heir_addr = _parse_address(addr)
        return self.withdrawable_balance.get(heir_addr, u256(0))

    @gl.public.view
    def get_vault(self) -> u256:
        return self.total_vault

    @gl.public.view
    def is_will_sealed(self) -> bool:
        return self.is_sealed

    @gl.public.view
    def get_persona(self) -> str:
        return self.soul_persona

    @gl.public.view
    def get_executor(self) -> str:
        return self.executor.as_hex

    def _only_owner_setup(self) -> None:
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("Only owner can modify setup")
        if self.is_sealed:
            raise gl.vm.UserError("Will already sealed")

    def _only_active_heir(self) -> Address:
        if not self.is_sealed:
            raise gl.vm.UserError("Will not active yet")
        sender = gl.message.sender_address
        if not self.heir_registered.get(sender, False):
            raise gl.vm.UserError("Not a registered heir")
        return sender

    def _append_log(self, heir: Address, role: str, text: str) -> None:
        log = _parse_log(self.convo_log.get(heir, "[]"))
        log.append({"role": role, "text": text})
        self.convo_log[heir] = json.dumps(log)

    def _has_registered_heir(self) -> bool:
        return int(self.heir_count) > 0


def _now() -> u256:
    return u256(int(time.time()))


def _min4(a: u256, b: u256, c: u256, d: u256) -> u256:
    m1 = a if a < b else b
    m2 = c if c < d else d
    return m1 if m1 < m2 else m2


def _parse_json(data):
    if isinstance(data, dict):
        return data
    if isinstance(data, str):
        try:
            return json.loads(data)
        except Exception:
            return {}
    try:
        return json.loads(str(data))
    except Exception:
        return {}


def _parse_log(log_text: str):
    parsed = _parse_json(log_text)
    if isinstance(parsed, list):
        return parsed
    return []


def _parse_address(addr: str) -> Address:
    try:
        parsed = Address(addr)
    except Exception:
        raise gl.vm.UserError(f"Invalid address format: {addr}")
    if parsed == Address("0x0000000000000000000000000000000000000000"):
        raise gl.vm.UserError("Zero address not allowed")
    return parsed


def _validate_social_json(social_json: str):
    try:
        socials = json.loads(social_json)
    except Exception:
        raise gl.vm.UserError("social_json must be valid JSON")
    if not isinstance(socials, list):
        raise gl.vm.UserError("social_json must be array")
    normalized = []
    for url in socials:
        if not isinstance(url, str):
            raise gl.vm.UserError("Each social URL must be string")
        clean_url = url.strip()
        if not (
            clean_url.startswith("http://") or clean_url.startswith("https://")
        ):
            raise gl.vm.UserError(f"Invalid URL: {clean_url}")
        normalized.append(clean_url)
    return normalized


def _scrape_sources(socials):
    scraped = []
    for url in socials:
        try:
            page = gl.nondet.web.render(url, mode="text")
            scraped.append(str(page))
        except Exception:
            scraped.append(f"Failed to fetch: {url}")
    if len(scraped) == 0:
        scraped.append("No external evidence available.")
    return scraped


def _coerce_u256(value) -> u256:
    try:
        amount = int(value)
    except Exception:
        amount = 0
    if amount < 0:
        amount = 0
    return u256(amount)
