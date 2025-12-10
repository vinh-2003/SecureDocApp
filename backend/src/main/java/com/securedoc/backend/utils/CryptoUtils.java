package com.securedoc.backend.utils;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

@Component
public class CryptoUtils {

    @Value("${app.security.master-key}")
    private String masterKeyStr;

    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int AES_KEY_SIZE = 256; // 256 bit
    private static final int GCM_IV_LENGTH = 12; // 12 bytes cho IV chuẩn GCM
    private static final int GCM_TAG_LENGTH = 128; // 128 bit tag

    // --- 1. CÁC HÀM SINH KHÓA & IV ---

    /**
     * Sinh một khóa AES ngẫu nhiên cho từng file (File Key)
     */
    public SecretKey generateSecretKey() throws Exception {
        KeyGenerator keyGenerator = KeyGenerator.getInstance(ALGORITHM);
        keyGenerator.init(AES_KEY_SIZE);
        return keyGenerator.generateKey();
    }

    /**
     * Sinh IV (Initialization Vector) ngẫu nhiên
     */
    public byte[] generateIV() {
        byte[] iv = new byte[GCM_IV_LENGTH];
        new SecureRandom().nextBytes(iv);
        return iv;
    }

    /**
     * Tạo Cipher để MÃ HÓA luồng dữ liệu (Dùng cho InputStream)
     */
    public Cipher getEncryptCipher(SecretKey key, byte[] iv) throws Exception {
        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.ENCRYPT_MODE, key, parameterSpec);
        return cipher;
    }

    /**
     * Tạo Cipher để GIẢI MÃ luồng dữ liệu (Dùng khi download)
     */
    public Cipher getDecryptCipher(SecretKey key, byte[] iv) throws Exception {
        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.DECRYPT_MODE, key, parameterSpec);
        return cipher;
    }

    // --- 2. CÁC HÀM BẢO VỆ KHÓA (KEY WRAPPING) ---

    /**
     * Mã hóa FileKey bằng MasterKey để lưu vào DB an toàn.
     * Output format: Base64(IV + EncryptedKeyBytes)
     */
    public String encryptFileKey(SecretKey fileKey) throws Exception {
        // 1. Chuẩn bị Master Key (chuẩn hóa 32 bytes)
        SecretKey masterKey = getEffectiveMasterKey();

        // 2. Sinh IV riêng cho việc mã hóa key này
        byte[] iv = generateIV();

        // 3. Mã hóa
        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        cipher.init(Cipher.ENCRYPT_MODE, masterKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        byte[] encryptedKeyBytes = cipher.doFinal(fileKey.getEncoded());

        // 4. Ghép IV + Key đã mã hóa lại với nhau
        ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + encryptedKeyBytes.length);
        byteBuffer.put(iv);
        byteBuffer.put(encryptedKeyBytes);

        // 5. Trả về chuỗi Base64
        return Base64.getEncoder().encodeToString(byteBuffer.array());
    }

    /**
     * Giải mã chuỗi từ DB để lấy lại FileKey gốc.
     * Input format: Base64(IV + EncryptedKeyBytes)
     */
    public SecretKey decryptFileKey(String encryptedKeyBase64) throws Exception {
        // 1. Decode Base64
        byte[] combined = Base64.getDecoder().decode(encryptedKeyBase64);

        // 2. Tách IV và Nội dung
        ByteBuffer byteBuffer = ByteBuffer.wrap(combined);
        byte[] iv = new byte[GCM_IV_LENGTH];
        byteBuffer.get(iv); // Đọc 12 bytes đầu làm IV
        byte[] encryptedKeyBytes = new byte[byteBuffer.remaining()];
        byteBuffer.get(encryptedKeyBytes); // Đọc phần còn lại

        // 3. Chuẩn bị Master Key
        SecretKey masterKey = getEffectiveMasterKey();

        // 4. Giải mã
        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        cipher.init(Cipher.DECRYPT_MODE, masterKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        byte[] originalKeyBytes = cipher.doFinal(encryptedKeyBytes);

        // 5. Khôi phục SecretKey object
        return new SecretKeySpec(originalKeyBytes, ALGORITHM);
    }

    // --- 3. CÁC HÀM TIỆN ÍCH KHÁC ---

    /**
     * Chuyển chuỗi MasterKey trong file config thành khóa AES 32 bytes chuẩn.
     * Sử dụng SHA-256 để băm chuỗi đầu vào.
     */
    private SecretKey getEffectiveMasterKey() throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] keyBytes = digest.digest(masterKeyStr.getBytes(StandardCharsets.UTF_8));
        return new SecretKeySpec(keyBytes, ALGORITHM);
    }

    public String encodeBase64(byte[] bytes) {
        return Base64.getEncoder().encodeToString(bytes);
    }

    public byte[] decodeBase64(String str) {
        return Base64.getDecoder().decode(str);
    }
}