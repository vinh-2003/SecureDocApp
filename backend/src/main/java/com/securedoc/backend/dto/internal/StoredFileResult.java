package com.securedoc.backend.dto.internal;

import lombok.AllArgsConstructor;
import lombok.Data;
import javax.crypto.SecretKey;

@Data
@AllArgsConstructor
public class StoredFileResult {
    private String gridFsId;
    private SecretKey secretKey;
    private byte[] iv;
    private String mimeType;
    private long size;
}