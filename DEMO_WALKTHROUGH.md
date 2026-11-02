# Kịch bản demo liên viện CarePlus

**Thời lượng gợi ý:** 12–15 phút  
**Thứ tự trình diễn:** Người bệnh → Lễ tân → Bác sĩ → Quản trị viên  
**Mục tiêu:** Theo dõi một lượt đặt lịch qua các vai trò, trình diễn chốt an toàn lâm sàng, phân ca và xem chỉ số vận hành.

> **Quy ước khi thuyết trình:** Phân biệt dữ liệu mock của giao diện với dữ liệu backend. Một số màn hình hiện hoạt động độc lập; lượt đặt lịch trên cổng bệnh nhân không tự xuất hiện trong danh sách mock của lễ tân/bác sĩ. Không trình bày dữ liệu minh họa như một giao dịch hay hồ sơ lâm sàng thật.

## Phần 0 — Khởi động hệ thống

### Checklist chuẩn bị

- [ ] Tại thư mục gốc, cài dependencies nếu đây là lần đầu chạy:

  ```powershell
  npm install
  ```

- [ ] Khởi động hai cổng giao diện:

  ```powershell
  npm run dev:all
  ```

- [ ] Mở các địa chỉ:

  | Thành phần | Địa chỉ | Ghi chú |
  | --- | --- | --- |
  | Cổng Người bệnh (`web-patient`) | <http://localhost:3000> | Đặt lịch và quản lý hồ sơ bệnh nhân |
  | Cổng Bệnh viện (`web-hospital`) | <http://localhost:3001> | Lễ tân, bác sĩ, lịch trực và quản trị |
  | API trung tâm (`api-central`) | <http://localhost:4000> | Backend; `npm run dev:all` **không** tự khởi động API |

- [ ] Nếu trình diễn backend thật, khởi động PostgreSQL/Redis và API trong terminal riêng; cấu hình `DATABASE_URL`, `PORT=4000`, `REDIS_HOST` và `REDIS_PORT` theo môi trường. Chạy migration, tạo Prisma Client và seed tài khoản:

  ```powershell
  docker compose up -d postgres redis
  npx prisma migrate deploy --schema packages/database/prisma/schema.prisma
  npm run prisma:generate
  npm run db:seed
  npm run dev --workspace @healthcare/api-central
  ```

  Xem hướng dẫn cấu hình database tại [packages/database/README.md](./packages/database/README.md). Để xác nhận Redis lock, API phải hoạt động và luồng đặt lịch phải dùng backend, không phải mock.

### Tài khoản demo

| Vai trò | Tài khoản | Mật khẩu | Cách sử dụng |
| --- | --- | --- | --- |
| Người bệnh | Không có tài khoản seed | Tự đăng ký trên trình duyệt demo | Tạo hồ sơ tại `/auth`, sau đó đăng nhập bằng số điện thoại hoặc CCCD trên cùng trình duyệt |
| Bác sĩ | `dr.khoi@careplus.vn` | `Doctor@123` | Tài khoản seed cho backend; trang đăng nhập dev có thể dùng phiên mock |
| Lễ tân | `reception@careplus.vn` | `Reception@123` | Tài khoản seed cho backend; trang đăng nhập dev có thể dùng phiên mock |
| Admin bệnh viện | `admin@careplus.vn` | `Admin@123` | Tài khoản seed cho backend; trang đăng nhập dev có thể dùng phiên mock |

Tài khoản nhân viên được seed bằng `npm run db:seed` sau khi cấu hình database. Trong môi trường phát triển, trang nhân viên có thể tự tạo phiên demo; chọn đúng vai trò tại `/login` để vào màn hình tương ứng. Hồ sơ người bệnh được lưu cục bộ trên trình duyệt, không phải tài khoản đăng nhập API.

Trên cổng người bệnh, mật khẩu được lưu dưới dạng mã băm PBKDF2 và cài đặt thông báo chỉ có hiệu lực trên trình duyệt hiện tại; dữ liệu chưa được đồng bộ với máy chủ. Vì bản demo không quản lý phiên tập trung, thao tác thu hồi phiên trên thiết bị khác hiện chỉ thông báo giới hạn này.

## Kịch bản 1 — Phía Người bệnh (`localhost:3000`)

**Mục tiêu:** Tạo hồ sơ, điền thông tin đặt lịch, giữ một slot và giới thiệu cơ chế chống đặt trùng.

- [ ] Mở <http://localhost:3000/auth>.
- [ ] Nếu chưa có hồ sơ trên trình duyệt này, chọn đăng ký; nhập họ tên, CCCD, số điện thoại, ngày sinh, giới tính và mật khẩu. Hoàn tất để lưu hồ sơ demo.
- [ ] Mở <http://localhost:3000/booking>. Trang demo hiện đã chọn chuyên khoa **Tim mạch** và bác sĩ **BS.CKII Nguyễn Minh Khôi**; chọn một khung giờ đang còn trống.
- [ ] Kiểm tra form tự điền họ tên, CCCD và điện thoại từ hồ sơ vừa tạo; nhập triệu chứng sơ bộ nếu muốn minh họa, rồi chọn **Xác nhận giữ chỗ**.
- [ ] Tại trang giữ chỗ, trình bày mã lịch hẹn thực tế được sinh, thời gian hết hạn và đồng hồ 10 phút. `BK-88219` chỉ là mã ví dụ để nói; mã trên màn hình có thể khác.
- [ ] **Điểm nhấn công nghệ:** Khi booking chạy qua API, Redis khóa slot bằng khóa phân tán với TTL 600 giây; yêu cầu đồng thời cho cùng slot sẽ không thể cùng giữ chỗ. Khi chạy mock hoặc không kết nối API, giao diện chỉ tạo lượt giữ chỗ minh họa — không khẳng định Redis đã cấp khóa.

  Có thể kiểm tra key trong Redis khi đang dùng backend:

  ```powershell
  docker exec healthcare-redis redis-cli --scan --pattern "lock:slot:*"
  docker exec healthcare-redis redis-cli TTL "lock:slot:<doctorId>:<startTime>"
  ```

  Thay `<doctorId>` và `<startTime>` bằng giá trị của lượt đặt. TTL ban đầu xấp xỉ 600 giây.

- [ ] Chỉ trình bày vị trí nút thanh toán. Giao diện hiện tại chưa hoàn tất thanh toán VNPAY/MoMo; không nhập thông tin thẻ hoặc nói giao dịch đã thành công. Nếu có cấu hình sandbox riêng, chỉ demo giao dịch sandbox đã được tích hợp và xác nhận callback.

**Lời dẫn gợi ý:** “Hồ sơ được điền lại để giảm nhập liệu. Khi bật backend, Redis Distributed Lock giữ slot tối đa 10 phút và ngăn hai yêu cầu đặt trùng cùng lúc.”

> **Lưu ý luồng liên viện:** Trang booking demo hiện dùng bác sĩ/slot dựng sẵn và có thể giữ chỗ mock. Dữ liệu booking chưa tự đồng bộ sang danh sách lịch hẹn mock ở cổng bệnh viện.

## Kịch bản 2 — Bàn tiếp đón Lễ tân (`localhost:3001/dashboard/reception`)

**Mục tiêu:** Tra cứu lịch xác nhận, check-in và chỉ ra bệnh nhân đã được tiếp nhận.

- [ ] Mở <http://localhost:3001/login>, chọn vai trò **Lễ tân** và đăng nhập/khởi tạo phiên demo.
- [ ] Mở <http://localhost:3001/dashboard/reception>.
- [ ] Dùng ô tìm kiếm theo tên, CCCD hoặc số điện thoại. Giao diện hiện không tìm theo mã lịch hẹn.
- [ ] Dùng dữ liệu mẫu có sẵn: tìm **Trần Quốc Bảo**, CCCD `079198004321`, lịch `APT-24002` đang `CONFIRMED`.
- [ ] Nhấn **Tiếp nhận**. Kiểm tra trạng thái chuyển thành `CHECKED_IN` và chỉ số **Đã tiếp nhận** cập nhật.
- [ ] Nêu hàng đợi phòng khám 201 như bối cảnh quy trình tiếp nhận; màn hình hiện tại xác nhận check-in và trạng thái, không có thao tác phân phòng riêng cho lượt này.

> `APT-24002` là lịch mẫu độc lập, không phải lượt booking vừa tạo ở Kịch bản 1. Dùng lịch mẫu để minh họa check-in; không khẳng định lịch bệnh nhân vừa đặt đã được liên thông nếu chưa cấu hình tích hợp dữ liệu.

## Kịch bản 3 — Buồng khám Bác sĩ (`localhost:3001/dashboard/doctor`)

**Mục tiêu:** Chọn hồ sơ trong danh sách chờ, nhập nội dung khám, trình diễn cảnh báo dị ứng và in phiếu.

- [ ] Đăng xuất vai trò Lễ tân nếu cần, mở `/login`, chọn **Bác sĩ** và vào <http://localhost:3001/dashboard/doctor>.
- [ ] Chọn hồ sơ trong danh sách chờ. Màn hình hiện không có nút **Gọi khám** riêng; việc chọn hồ sơ là thao tác mô phỏng tiếp nhận bệnh nhân vào buồng khám.
- [ ] Để trình diễn cảnh báo, chọn bệnh nhân mẫu **Nguyễn Minh Châu** (`APT-24001`), hồ sơ có ghi dị ứng nhẹ với Penicillin. Đây là hồ sơ demo riêng, không phải bệnh nhân Trần Quốc Bảo vừa check-in.
- [ ] Nhập triệu chứng/kết luận và mã ICD-10 phù hợp với tình huống minh họa, ví dụ `I10 - Tăng huyết áp vô căn`. Có thể chọn chỉ định **Điện tâm đồ (ECG)** và **Siêu âm Doppler tim**. Nội dung chỉ để demo; chẩn đoán và chỉ định thực tế phải do bác sĩ quyết định.
- [ ] Trong mục kê đơn, chọn **Amoxicillin 500mg**. Hộp cảnh báo dị ứng Penicillin màu đỏ xuất hiện và nút **Thêm vào đơn thuốc** bị vô hiệu hóa. Không thêm thuốc đang bị cảnh báo.
- [ ] Đổi sang **Paracetamol 500mg** và **Atorvastatin 20mg** để minh họa thuốc mẫu không phát cảnh báo. Nhập thông tin số lượng/cách dùng minh họa rồi nhấn **Thêm vào đơn thuốc**. Không xem nội dung demo là chỉ định điều trị thật.
- [ ] Nhấn **In phiếu khám & Đơn thuốc**. Trong hộp thoại trình duyệt, chọn máy in hoặc **Save as PDF**. Bản in dùng bố cục A4 và ẩn các phần giao diện không cần thiết.

**Lời dẫn gợi ý:** “Hệ thống đối chiếu tiền sử dị ứng với nhóm thuốc mẫu và chặn thao tác thêm Amoxicillin; người dùng có thể đổi sang thuốc khác để tiếp tục trình diễn đơn.”

## Kịch bản 4 — Phân ca & Thống kê Quản trị (`localhost:3001`)

### A. Ma trận lịch trực

- [ ] Mở <http://localhost:3001/dashboard/schedule>.
- [ ] Giới thiệu ma trận tuần: bộ lọc chuyên khoa, ô tìm bác sĩ, điều hướng tuần, bác sĩ/phòng cố định, ca sáng/chiều, số slot đã đặt và trạng thái.
- [ ] Chọn một thẻ ca đang mở và nhấn **Khóa ca** để mô phỏng bác sĩ bận hội chẩn hoặc mổ cấp cứu. Thẻ chuyển đỏ, hiển thị **Tạm ngưng nhận hẹn**; nhấn **Mở ca** để khôi phục.
- [ ] Nếu cần, nhấn **Thêm ca trực** để phân ca mới: chọn bác sĩ, ngày, ca sáng/chiều/cả ngày, phòng khám và giới hạn bệnh nhân; lưu để thấy ca xuất hiện trong ma trận.

> Khóa/mở và phân ca của trang hiện cập nhật state giao diện để demo, chưa ghi thay đổi vào backend hoặc tự khóa slot trong cổng người bệnh.

### B. Báo cáo & thống kê

- [ ] Mở <http://localhost:3001/dashboard/analytics>.
- [ ] Chọn lần lượt **Hôm nay**, **7 ngày qua**, **Tháng này**. Trình bày bốn KPI: **Tổng lượt khám**, **Doanh thu tạm ứng VNPAY**, **Show-up Rate**, **No-Show Rate**.
- [ ] Đọc biểu đồ **Khung giờ khám cao điểm** và **Cơ cấu bệnh nhân theo chuyên khoa**; nêu cách các chỉ số hỗ trợ điều phối lịch và nhân sự.
- [ ] Kết thúc bằng cách nhắc người nghe đây là **dữ liệu mock minh họa**, không phát sinh từ lượt đặt/check-in vừa thao tác.

## Checklist nhanh trước khi kết thúc

- [ ] Đã cho thấy form người bệnh tự điền từ hồ sơ trên trình duyệt và một slot còn trống.
- [ ] Đã nói rõ Redis TTL 10 phút chỉ được xác nhận khi backend thật đang hoạt động và có key/TTL tương ứng.
- [ ] Đã nói rõ thanh toán chưa hoàn tất tích hợp trên UI; không tuyên bố giao dịch thành công.
- [ ] Đã phân biệt lịch mẫu `APT-24002` với lượt booking ở cổng bệnh nhân.
- [ ] Đã hiển thị cảnh báo Penicillin và nút thêm Amoxicillin bị khóa; không thêm thuốc bị cảnh báo.
- [ ] Đã in phiếu khám/đơn thuốc bằng hộp thoại trình duyệt hoặc lưu PDF.
- [ ] Đã khóa rồi mở lại một ca trực, và nhắc thao tác hiện chỉ cập nhật giao diện.
- [ ] Đã xem đủ bốn KPI cùng hai biểu đồ, đồng thời nêu rõ số liệu là mock.
