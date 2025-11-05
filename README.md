# Backend

## Yêu cầu
- Docker & Docker Compose

## Chạy bằng Docker
1) Build và chạy dịch vụ:
```bash
docker compose up -d --build
```
2) Xem log backend:
```bash
docker compose logs -f be
```
3) Kiểm tra API:
- Mở: http://localhost:3000/
- Kết quả: `{ "message": "Be API is running" }`

## Cấu hình mặc định
- Backend: mở cổng 3000 -> http://localhost:3000

## Lệnh hữu ích
- Dừng dịch vụ: `docker compose stop`
- Khởi động lại: `docker compose restart`
- Xóa containers + volumes: `docker compose down -v`

