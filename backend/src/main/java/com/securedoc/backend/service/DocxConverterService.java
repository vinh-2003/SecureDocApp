package com.securedoc.backend.service;

import com.securedoc.backend.exception.AppErrorCode;
import com.securedoc.backend.exception.AppException;
import fr.opensagres.poi.xwpf.converter.pdf.PdfConverter;
import fr.opensagres.poi.xwpf.converter.pdf.PdfOptions;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
@Slf4j
public class DocxConverterService {

    /**
     * Chuyển đổi DOCX byte[] -> PDF byte[]
     */
    public byte[] convertDocxToPdf(byte[] docxData) {
        log.info("Đang chuyển đổi DOCX sang PDF (Kích thước: {} bytes)", docxData.length);

        try (ByteArrayInputStream docxInputStream = new ByteArrayInputStream(docxData);
             ByteArrayOutputStream pdfOutputStream = new ByteArrayOutputStream()) {

            // 1. Load DOCX bằng Apache POI
            XWPFDocument document = new XWPFDocument(docxInputStream);

            // 2. Cấu hình PDF Options (nếu cần font, encoding...)
            PdfOptions options = PdfOptions.create();

            // 3. Thực hiện Convert
            PdfConverter.getInstance().convert(document, pdfOutputStream, options);

            log.info("Chuyển đổi thành công. Kích thước PDF: {} bytes", pdfOutputStream.size());
            return pdfOutputStream.toByteArray();

        } catch (IOException e) {
            log.error("Lỗi IO khi convert DOCX: ", e);
            throw new AppException(AppErrorCode.READ_DOCX_FILE);
        } catch (Exception e) {
            log.error("Lỗi không xác định khi convert DOCX: ", e);
            throw new AppException(AppErrorCode.DOCX_TO_PDF_CONVERT_ERROR);
        }
    }
}