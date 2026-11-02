# Nạp dữ liệu demo

Seed sẽ tạo hoặc cập nhật bệnh viện demo CarePlus, khoa Tim mạch, hồ sơ bác sĩ
và các tài khoản đăng nhập bên dưới. Mật khẩu được lưu dưới dạng bcrypt hash;
có thể chạy lại seed an toàn.

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| DOCTOR | `dr.khoi@careplus.vn` | `Doctor@123` |
| RECEPTIONIST | `reception@careplus.vn` | `Reception@123` |
| HOSPITAL_ADMIN | `admin@careplus.vn` | `Admin@123` |

Từ thư mục gốc repository, khởi động PostgreSQL, cấu hình `DATABASE_URL`, chạy
migration, tạo Prisma Client rồi nạp dữ liệu:

```powershell
docker compose up -d postgres
$env:DATABASE_URL = "postgresql://postgres:postgrespassword@localhost:5432/healthcare_db?schema=public"
npx prisma migrate deploy --schema packages/database/prisma/schema.prisma
npm run prisma:generate
npm run db:seed
```

Nếu dùng PostgreSQL khác, thay `DATABASE_URL` bằng connection string tương ứng
trước khi chạy các lệnh.
