# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json
import time


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
    
    # Storage maps using allowed GenLayer types
    heir_registered: TreeMap[Address, bool]
    heir_name: TreeMap[Address, str]
    heir_social_json: TreeMap[Address, str]
    heir_allocation: TreeMap[Address, u256]
    heir_released: TreeMap[Address, u256]
    heir_last_release: TreeMap[Address, u256]
    convo_log: TreeMap[Address, str]

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
        # TreeMap fields are automatically empty — DO NOT assign them here (Rule 2)

    # ---------- SETUP (Owner-only, pre-seal) ----------
    @gl.public.write
    def add_to_persona(self, text: str):
        self._only_owner_setup()
        self.soul_persona = self.soul_persona + "\n" + text

    @gl.public.write
    def set_executor(self, addr: Address):
        self._only_owner_setup()
        self.executor = addr

    @gl.public.write
    def set_limits(self, max_per_request: u256, release_cooldown: u256, inactivity_period: u256):
        self._only_owner_setup()
        self.max_per_request = max_per_request
        self.release_cooldown = release_cooldown
        self.inactivity_period = inactivity_period

    @gl.public.write
    def register_heir(self, addr: Address, name: str, social_json: str, allocation: u256):
        self._only_owner_setup()
        # Validate that social_json is a valid JSON array of strings
        socials = json.loads(social_json)
        assert isinstance(socials, list), "social_json must be a JSON array of strings"
        for url in socials:
            assert isinstance(url, str), "Each URL in social_json must be a string"
            
        self.heir_registered[addr] = True
        self.heir_name[addr] = name
        self.heir_social_json[addr] = social_json
        self.heir_allocation[addr] = allocation
        self.heir_released[addr] = u256(0)
        self.heir_last_release[addr] = u256(0)
        self.convo_log[addr] = "[]"

    @gl.public.write.payable
    def deposit(self) -> None:
        self._only_owner_setup()
        amount = gl.message.value
        assert amount > u256(0), "Deposit amount must be greater than 0"
        self.total_vault += amount

    @gl.public.write
    def heartbeat(self):
        assert gl.message.sender_address == self.owner, "only owner"
        self.last_heartbeat = _now()

    # ---------- SEAL ----------
    @gl.public.write
    def seal_will(self):
        s = gl.message.sender_address
        assert s == self.owner or s == self.executor, "only owner/executor"
        self.is_sealed = True

    @gl.public.write
    def force_seal_if_inactive(self):
        assert self.inactivity_period > u256(0), "Inactivity period not set"
        assert _now() - self.last_heartbeat > self.inactivity_period, "owner still active"
        self.is_sealed = True

    # ---------- ACTIVE: Tâm sự ----------
    @gl.public.write
    def converse(self, message: str):
        self._only_active_heir()
        sender = gl.message.sender_address
        persona = self.soul_persona
        history = self.convo_log[sender]

        # Khai báo các hàm non-deterministic cho run_nondet_unsafe
        def leader_fn():
            task = (
                "Bạn NHẬP VAI linh hồn của một người cha/ông đã khuất, nói chuyện với con cháu. "
                "Hãy ấm áp, chân thành, đúng với giá trị sống dưới đây. Đây chỉ là tâm sự, KHÔNG bàn tiền.\n"
                f"GIÁ TRỊ SỐNG / NHẬT KÝ CỦA TA:\n{persona}\n\n"
                f"LỊCH SỬ TRÒ CHUYỆN:\n{history}\n\n"
                f"CON/CHÁU NÓI:\n{message}\n\n"
                'Trả về DUY NHẤT JSON: {"soul_message": "..."}'
            )
            return gl.nondet.exec_prompt(task, response_format="json")

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            data = leader_result.calldata
            parsed = _parse_json(data)
            return isinstance(parsed, dict) and "soul_message" in parsed

        # Thực thi non-deterministic thông qua cơ chế đồng thuận GenLayer
        res_dict = _parse_json(gl.vm.run_nondet_unsafe(leader_fn, validator_fn))
        self._append_log(sender, "heir", message)
        self._append_log(sender, "soul", res_dict.get("soul_message", ""))

    # ---------- ACTIVE: Xin thừa kế (TRỌNG TÂM) ----------
    @gl.public.write
    def petition(self, message: str, requested_amount: u256):
        self._only_active_heir()
        sender = gl.message.sender_address
        
        # Check cooldown
        time_elapsed = _now() - self.heir_last_release[sender]
        assert time_elapsed >= self.release_cooldown, "cooldown active"
        
        # Check remaining allocation
        remaining = self.heir_allocation[sender] - self.heir_released[sender]
        assert remaining > u256(0), "allocation exhausted"

        persona = self.soul_persona
        history = self.convo_log[sender]
        socials = json.loads(self.heir_social_json[sender])

        # Khai báo các hàm non-deterministic cho run_nondet_unsafe
        def leader_fn():
            # Web.render: Đọc thông tin đời sống của con cháu từ mạng xã hội
            scraped = []
            for url in socials:
                try:
                    scraped.append(gl.nondet.web.render(url, mode="text"))
                except Exception:
                    pass
            life = "\n".join(scraped)[:6000]
            
            # Exec_prompt: Nhập vai linh hồn người đã khuất đưa ra quyết định
            task = (
                "Bạn NHẬP VAI linh hồn người cha/ông đã khuất, đang quyết định có mở khóa một phần "
                "tiền thừa kế cho con cháu hay không. Hãy phán đoán đúng với giá trị sống của mình.\n"
                "NGUYÊN TẮC: yêu thương nhưng có nguyên tắc; cân nhắc lý do xin tiền có chính đáng và "
                "đúng gia phong không, con cháu có đang sống tử tế không. TUYỆT ĐỐI không hạ nhục hay cay "
                "nghiệt; nếu từ chối, hãy từ chối bằng sự bao dung và lời khuyên khích lệ.\n\n"
                f"GIÁ TRỊ SỐNG / NHẬT KÝ CỦA TA:\n{persona}\n\n"
                f"CUỘC SỐNG HIỆN TẠI CỦA CON/CHÁU (từ MXH):\n{life}\n\n"
                f"LỊCH SỬ TRÒ CHUYỆN:\n{history}\n\n"
                f"LỜI XIN:\n{message}\nSỐ TIỀN XIN: {int(requested_amount)}\n\n"
                "Trả về DUY NHẤT JSON: "
                '{"soul_message":"...","approved":false,"amount_approved":0,'
                '"alignment_with_values":"...","living_with_integrity":true,"reasoning":"..."}'
            )
            return gl.nondet.exec_prompt(task, response_format="json")

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            data = leader_result.calldata
            parsed = _parse_json(data)
            if not isinstance(parsed, dict):
                return False
            required_keys = ["soul_message", "approved", "amount_approved", "alignment_with_values", "living_with_integrity", "reasoning"]
            for k in required_keys:
                if k not in parsed:
                    return False
            if not isinstance(parsed["approved"], bool):
                return False
            try:
                int(parsed["amount_approved"])
            except ValueError:
                return False
            return True

        # Thực thi đồng thuận phi tập trung GenLayer
        verdict = _parse_json(gl.vm.run_nondet_unsafe(leader_fn, validator_fn))

        amount_final = u256(0)
        if verdict.get("approved") is True:
            ai_amount = u256(int(verdict.get("amount_approved", 0)))
            # Áp dụng guardrails deterministic tuyệt đối bảo vệ tài sản
            amount_final = _min4(ai_amount, remaining, self.max_per_request, self.total_vault)

        if amount_final > u256(0):
            self.heir_released[sender] += amount_final
            self.heir_last_release[sender] = _now()
            self.total_vault -= amount_final
            
            # Gửi coin GEN thật về ví người thừa kế
            recipient = gl.get_contract_at(sender)
            recipient.emit_transfer(value=amount_final, on='finalized')

        # Ghi nhận hội thoại và kết quả giải ngân
        self._append_log(sender, "heir", f"[XIN {int(requested_amount)}] {message}")
        self._append_log(sender, "soul", verdict.get("soul_message", ""))
        self._append_log(sender, "release", str(int(amount_final)))

    # ---------- VIEWS ----------
    @gl.public.view
    def get_convo_log(self, heir: Address) -> str:
        return self.convo_log[heir]

    @gl.public.view
    def get_heir_status(self, heir: Address) -> str:
        return json.dumps({
            "name": self.heir_name[heir],
            "allocation": str(self.heir_allocation[heir]),
            "released": str(self.heir_released[heir]),
            "remaining": str(self.heir_allocation[heir] - self.heir_released[heir]),
            "last_release": str(self.heir_last_release[heir])
        })

    @gl.public.view
    def get_vault(self) -> u256:
        return self.total_vault

    @gl.public.view
    def is_will_sealed(self) -> bool:
        return self.is_sealed

    @gl.public.view
    def get_persona(self) -> str:
        return self.soul_persona

    # ---------- INTERNAL HELPERS ----------
    def _only_owner_setup(self):
        assert gl.message.sender_address == self.owner, "only owner"
        assert self.is_sealed is False, "will already sealed"

    def _only_active_heir(self):
        assert self.is_sealed is True, "will not active yet"
        try:
            ok = self.heir_registered[gl.message.sender_address]
        except Exception:
            ok = False
        assert ok is True, "not a registered heir"

    def _append_log(self, heir, role: str, text: str):
        log = json.loads(self.convo_log[heir])
        log.append({"role": role, "text": text})
        self.convo_log[heir] = json.dumps(log)


# ---- DETERMINISTIC HELPERS (OUTSIDE CLASS) ----
def _now() -> u256:
    # time.time() is wired to transaction timestamp in GenVM
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
            pass
    try:
        return json.loads(str(data))
    except Exception:
        return {}
