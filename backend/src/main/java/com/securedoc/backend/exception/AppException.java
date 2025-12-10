package com.securedoc.backend.exception;

import lombok.Getter;

@Getter
public class AppException extends RuntimeException {

    private final AppErrorCode errorCode;

    public AppException(AppErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}