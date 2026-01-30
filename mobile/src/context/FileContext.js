import React, { createContext, useState } from 'react';
import Toast from 'react-native-toast-message'; // [THAY ĐỔI] Thư viện Toast cho Mobile
import fileService from '../services/fileService';

export const FileContext = createContext();

export const FileProvider = ({ children }) => {
    // Trạng thái thư mục hiện tại (null = Root)
    const [currentFolder, setCurrentFolder] = useState(null);
    const [currentFolderName, setCurrentFolderName] = useState('Thư mục gốc');

    // State lưu quyền của thư mục hiện tại
    const [currentPermissions, setCurrentPermissions] = useState({
        canCreateFolder: true,
        canUploadFile: true,
        canUploadFolder: false // Mobile tạm thời tắt upload folder
    });

    // Biến dùng để ép Dashboard reload lại dữ liệu
    const [refreshKey, setRefreshKey] = useState(0);

    const triggerRefresh = () => setRefreshKey(prev => prev + 1);

    const updatePermissions = (perms) => {
        // Mobile tạm thời không hỗ trợ upload folder recursive
        setCurrentPermissions({ ...perms, canUploadFolder: false });
    };

    // --- 1. TẠO THƯ MỤC ---
    const handleCreateFolder = async (name) => {
        try {
            await fileService.createFolder(name, currentFolder);
            Toast.show({
                type: 'success',
                text1: 'Thành công',
                text2: `Đã tạo thư mục: ${name}`
            });
            triggerRefresh();
            return true;
        } catch (error) {
            const msg = error.response?.data?.message || "Lỗi tạo thư mục";
            Toast.show({
                type: 'error',
                text1: 'Thất bại',
                text2: msg
            });
            return false;
        }
    };

    // --- 2. UPLOAD FILE (QUAN TRỌNG: Xử lý FormData cho Mobile) ---
    const handleUploadFile = async (pickedFiles) => {
        // pickedFiles là mảng kết quả từ DocumentPicker.getDocumentAsync()
        // Cấu trúc item: { uri, name, mimeType, size }

        if (!pickedFiles || pickedFiles.length === 0) return false;

        // CẤU HÌNH GIỚI HẠN
        const MAX_FILE_SIZE = 100 * 1024 * 1024;   // 100MB
        const MAX_TOTAL_SIZE = 1024 * 1024 * 1024; // 1GB

        let totalSize = 0;

        // CHECK DUNG LƯỢNG
        for (let i = 0; i < pickedFiles.length; i++) {
            const file = pickedFiles[i];
            if (file.size > MAX_FILE_SIZE) {
                Toast.show({
                    type: 'error',
                    text1: 'File quá lớn',
                    text2: `File "${file.name}" vượt quá 100MB.`
                });
                return false;
            }
            totalSize += file.size;
        }

        if (totalSize > MAX_TOTAL_SIZE) {
            Toast.show({
                type: 'error',
                text1: 'Tổng dung lượng quá lớn',
                text2: 'Tổng các file vượt quá 1GB.'
            });
            return false;
        }

        // THÔNG BÁO BẮT ĐẦU
        Toast.show({
            type: 'info',
            text1: 'Đang tải lên...',
            text2: `Đang xử lý ${pickedFiles.length} tệp`,
            autoHide: false // Giữ thông báo hiển thị
        });

        try {
            const formData = new FormData();
            formData.append("parentId", currentFolder || "");

            // [QUAN TRỌNG] Append file đúng chuẩn React Native
            pickedFiles.forEach((file) => {
                formData.append("files", {
                    uri: file.uri,                 // Đường dẫn file trên điện thoại
                    name: file.name,               // Tên file
                    type: file.mimeType || 'application/octet-stream' // Loại file (Bắt buộc cho Android)
                });
            });

            // Gọi API
            const res = await fileService.uploadBatch(formData);

            // Ẩn thông báo loading cũ đi
            Toast.hide();

            if (res.success) {
                const report = res.data;

                if (report.failCount === 0) {
                    Toast.show({
                        type: 'success',
                        text1: 'Hoàn tất',
                        text2: `Tải lên thành công ${report.successCount} tệp!`
                    });
                } else if (report.successCount === 0) {
                    Toast.show({
                        type: 'error',
                        text1: 'Thất bại',
                        text2: `Tải lên thất bại toàn bộ.`
                    });
                } else {
                    Toast.show({
                        type: 'info', // Dùng info hoặc warning (nếu custom)
                        text1: 'Hoàn tất một phần',
                        text2: `${report.successCount} thành công, ${report.failCount} lỗi.`
                    });
                }

                if (report.successCount > 0) {
                    triggerRefresh();
                }
                return true;
            }
        } catch (error) {
            Toast.hide();
            let errorMessage = error.response?.data?.message || "Lỗi kết nối Server";

            // Xử lý lỗi 413
            if (error.response?.status === 413) {
                errorMessage = "File quá lớn so với giới hạn Server.";
            }

            Toast.show({
                type: 'error',
                text1: 'Lỗi tải lên',
                text2: errorMessage
            });
            return false;
        }
    };

    // --- 3. UPLOAD FOLDER (Đã tắt cho Mobile) ---
    const handleUploadFolder = async () => {
        Toast.show({
            type: 'info',
            text1: 'Tính năng chưa hỗ trợ',
            text2: 'Mobile chưa hỗ trợ tải lên cả cấu trúc thư mục.'
        });
        return false;
    };

    // --- 4. ĐỔI TÊN ---
    const handleRename = async (item, newName) => {
        if (!newName.trim() || newName === item.name) return false;

        try {
            let res;
            if (item.type === 'FOLDER') {
                res = await fileService.renameFolder(item.id, newName);
            } else {
                res = await fileService.renameFile(item.id, newName);
            }

            if (res.success) {
                Toast.show({ type: 'success', text1: 'Đổi tên thành công' });
                triggerRefresh();
                return true;
            }
        } catch (error) {
            const msg = error.response?.data?.message || "Lỗi khi đổi tên";
            Toast.show({ type: 'error', text1: 'Lỗi', text2: msg });
            return false;
        }
    };

    // --- 5. CẬP NHẬT MÔ TẢ ---
    const handleUpdateDescription = async (item, description) => {
        const oldDesc = item.description || '';
        const newDesc = description || '';
        if (oldDesc === newDesc) return false;

        try {
            let res;
            if (item.type === 'FOLDER') {
                res = await fileService.updateFolderDescription(item.id, newDesc);
            } else {
                res = await fileService.updateFileDescription(item.id, newDesc);
            }

            if (res.success) {
                Toast.show({ type: 'success', text1: 'Cập nhật mô tả thành công' });
                triggerRefresh();
                return true;
            }
        } catch (error) {
            const msg = error.response?.data?.message || "Lỗi cập nhật";
            Toast.show({ type: 'error', text1: 'Lỗi', text2: msg });
            return false;
        }
    };

    return (
        <FileContext.Provider value={{
            currentFolder,
            setCurrentFolder,
            currentFolderName,
            setCurrentFolderName,
            refreshKey,
            triggerRefresh,
            handleCreateFolder,
            handleUploadFile,
            handleUploadFolder,
            handleRename,
            handleUpdateDescription,
            currentPermissions,
            updatePermissions
        }}>
            {children}
        </FileContext.Provider>
    );
};