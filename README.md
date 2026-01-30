Đây là đồ án tốt nghiệp của Phạm Văn Vinh - 21CN3 - 2155010283
Tên đề tài: "Nghiên cứu phần mềm Docker và Elasticsearch trong phát triển phần mềm hỗ trợ quản lý tài liệu được mã hóa theo nhiều cấp độ"
Gồm 1 phiên bản web và 1 phiên bản mobile
Để chạy được chúng ta cần cấu hình cho file .env trong thư mục docker
Lấy user, pass cho elastic, kibana chạy lệnh dưới
cd docker
docker exec -it doc_elasticsearch /usr/share/elasticsearch/bin/elasticsearch-setup-passwords auto
lưu lại và sửa vào các phần cấu hình tương ứng.
Để chạy được ứng dụng thì chạy lệnh dưới
cd docker
docker compose up -d --build