package com.securedoc.backend.service;

import com.mongodb.client.gridfs.model.GridFSFile;
import com.securedoc.backend.dto.internal.StoredFileResult;
import com.securedoc.backend.utils.CryptoUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.SecretKey;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;

@Service
@RequiredArgsConstructor
public class CoreFileService {

    private final GridFsTemplate gridFsTemplate;
    private final CryptoUtils cryptoUtils;

    /**
     * Hàm dùng chung: Nhận InputStream -> Mã hoá -> Lưu GridFS -> Trả về ID, Key, IV
     */
    public StoredFileResult storeEncryptedData(InputStream inputStream, String fileName, String contentType) throws Exception {
        // 1. Tạo Key & IV mới cho file/ảnh này
        SecretKey fileKey = cryptoUtils.generateSecretKey();
        byte[] iv = cryptoUtils.generateIV();

        // 2. Mã hoá luồng dữ liệu
        Cipher encryptCipher = cryptoUtils.getEncryptCipher(fileKey, iv);
        CipherInputStream encryptedStream = new CipherInputStream(inputStream, encryptCipher);

        // 3. Lưu vào GridFS
        Object gridFsId = gridFsTemplate.store(encryptedStream, fileName, contentType);

        // 4. Trả về kết quả để Service khác tự lưu vào DB
        return new StoredFileResult(
                gridFsId.toString(),
                fileKey,
                iv,
                contentType,
                0 // Size có thể lấy từ metadata GridFS nếu cần chính xác
        );
    }

    /**
     * Hàm đọc file Input Stream từ GridFS dựa trên ID (Chưa giải mã)
     * @param gridFsId: ID string của file trong GridFS
     */
    public InputStream loadRawFileStream(String gridFsId) throws IOException {
        // 1. Tìm file Metadata trong GridFS bằng ID
        GridFSFile file = gridFsTemplate.findOne(new Query(Criteria.where("_id").is(gridFsId)));

        // 2. Kiểm tra tồn tại
        if (file == null) {
            throw new FileNotFoundException("Không tìm thấy file trong GridFS với ID: " + gridFsId);
        }

        // 3. Lấy Resource và trả về InputStream
        return gridFsTemplate.getResource(file).getInputStream();
    }

    /**
     * [MỚI] Hàm lưu file dùng Key có sẵn (Dùng cho các trang con)
     */
    public StoredFileResult storeWithExistingKey(InputStream inputStream, String fileName, String contentType, SecretKey existingKey) throws Exception {
        // 1. Sinh IV MỚI ngẫu nhiên (BẮT BUỘC KHÁC NHAU CHO MỖI FILE ẢNH)
        byte[] iv = cryptoUtils.generateIV();

        // 2. Mã hoá với Key cũ + IV mới
        Cipher encryptCipher = cryptoUtils.getEncryptCipher(existingKey, iv);
        CipherInputStream encryptedStream = new CipherInputStream(inputStream, encryptCipher);

        // 3. Lưu vào GridFS
        Object gridFsId = gridFsTemplate.store(encryptedStream, fileName, contentType);

        // 4. Trả về kết quả (Lưu ý: secretKey trả về chính là key đầu vào)
        return new StoredFileResult(
                gridFsId.toString(),
                existingKey,
                iv,
                contentType,
                0
        );
    }
}