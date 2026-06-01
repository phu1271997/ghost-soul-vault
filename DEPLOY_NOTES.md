# 🩺 DEPLOY_NOTES — Hướng Dẫn Deploy & Khắc Phục Lỗi GenLayer Studio

Tài liệu này chứa các quy tắc thiết yếu và bảng tra lỗi nhanh khi deploy Intelligent Contracts trên GenLayer Studio (`https://studio.genlayer.com/run-debug`).

---

## 🛡️ 7 LUẬT CHỐNG LỖI DEPLOY (NON-NEGOTIABLE)

Tuân thủ nghiêm ngặt 7 luật dưới đây để tránh contract bị lỗi compile hoặc runtime trên GenVM:

### 1️⃣ DÒNG ĐẦU TIÊN phải là chỉ thị phiên bản `# v0.2.16`
```python
# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
```
*   **Hệ quả nếu thiếu**: Hệ thống tự động rơi về v0.1.0 gây lỗi `Contract Queues not found`, `Contract IdlenessPhase not found`, hoặc `Contract RevealingPhase not found`.

### 2️⃣ KHÔNG gán lại `TreeMap()` hoặc `DynArray()` trong `__init__`
```python
# ❌ SAI — Gây lỗi AssertionError: Is right the same storage type? TreeMap <- TreeMap
def __init__(self):
    self.convo_log = TreeMap()

# ✅ ĐÚNG — GenVM tự động khởi tạo các trường lưu trữ này ở trạng thái rỗng.
def __init__(self):
    self.is_sealed = False
    self.owner = gl.message.sender_address
```

### 3️⃣ KHÔNG sử dụng kiểu `float` trong signature của public method
```python
# ❌ SAI
def petition(self, requested_amount: float): ...

# ✅ ĐÚNG — Luôn dùng u256 hoặc int (nhân với 10^x nếu cần lưu phần thập phân)
def petition(self, requested_amount: u256): ...
```

### 4️⃣ CHỈ dùng các kiểu dữ liệu được phép trong public method
*   **Được phép (✅)**: `str`, `bool`, `bytes`, `int`, sized ints (`u8`..`u256`, `i8`..`i256`), `Address`, `DynArray[T]`, `TreeMap[K, V]`
*   **Bị cấm (❌)**: `float`, `list[T]`, `dict[K,V]`, generic chưa được định nghĩa kiểu cụ thể, custom class.

### 5️⃣ Storage bắt buộc dùng `TreeMap`/`DynArray`, KHÔNG bao giờ dùng `dict`/`list` trực tiếp làm kiểu dữ liệu của class field
```python
class Contract(gl.Contract):
    heir_allocation: TreeMap[Address, u256]   # ✅ ĐÚNG
    # heir_allocation: dict[str, int]         # ❌ SAI
```

### 6️⃣ Class chính bắt buộc phải đặt tên là `Contract` và kế thừa từ `gl.Contract`
```python
class Contract(gl.Contract): ...   # ✅ ĐÚNG
# class Ghost(gl.Contract): ...    # ❌ SAI (Studio không nhận diện được entry point)
```

### 7️⃣ MỌI lệnh gọi non-deterministic (`gl.nondet.*`) PHẢI được bọc trong `gl.vm.run_nondet_unsafe`
```python
def leader_fn():
    life = gl.nondet.web.render("https://x.com/heir", mode="text")
    return gl.nondet.exec_prompt(f"Nhập vai... {life}", response_format="json")
    
def validator_fn(leader_result) -> bool:
    return isinstance(leader_result, gl.vm.Return)

result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
```

### ➕ Luật R13: KHÔNG đặt alias khi import GenLayer
Luôn dùng duy nhất cú pháp `from genlayer import *`.
❌ KHÔNG `import genlayer as gl` hoặc `import genlayer`.

---

## 🩺 BẢNG TRA LỖI NHANH (TROUBLESHOOTING)

| Triệu chứng | Nguyên nhân chính | Hướng giải quyết |
| :--- | :--- | :--- |
| `Contract Queues not found` | Thiếu chỉ thị `# v0.2.16` ở dòng 1 | Thêm đúng header ở 2 dòng đầu tiên. |
| Tx `FINALIZED` nhưng có Result `ERROR: AssertionError: TreeMap <- TreeMap` | Gán lại TreeMap/DynArray trong `__init__` | Xóa dòng gán TreeMap/DynArray trong constructor, để GenVM tự khởi tạo. |
| Lỗi compile schema | Sử dụng kiểu không hợp lệ (float, dict, list) ở public signature | Chuyển đổi signature sang `u256` hoặc `str`. Sử dụng JSON string cho tham số phức tạp. |
| Sidebar hiển thị "Not deployed yet" nhưng giao dịch đã `FINALIZED` | Lỗi xảy ra trong quá trình deploy | Click vào transaction ở lịch sử giao dịch sidebar, xem thông tin trường "Result" để đọc traceback lỗi chi tiết. |
| Deploy ngày hôm trước chạy bình thường, hôm nay báo lỗi bất thường | Trạng thái cache lưu trữ của Studio bị lỗi | Đi tới **Settings -> Reset Storage -> Confirm**, sau đó thực hiện **Hard Refresh** (Cmd+Shift+R / Ctrl+Shift+F5) trình duyệt. |
| `AttributeError: module 'genlayer' has no attribute 'Contract'` | Import sai cú pháp hoặc alias | Xóa toàn bộ import thừa, chỉ giữ lại duy nhất: `from genlayer import *`. |
