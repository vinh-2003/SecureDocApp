import React, { createContext, useState } from 'react';
import { toast } from 'react-toastify';
import fileService from '../services/fileService';

export const FileContext = createContext();

export const FileProvider = ({ children }) => {
  // Trạng thái thư mục hiện tại (null = Root)
  const [currentFolder, setCurrentFolder] = useState(null);
  const [currentFolderName, setCurrentFolderName] = useState('Thư mục gốc');

  // [MỚI] State lưu quyền của thư mục hiện tại (Mặc định full quyền cho Root)
  const [currentPermissions, setCurrentPermissions] = useState({
    canCreateFolder: true,
    canUploadFile: true,
    canUploadFolder: true
  });

  // Biến dùng để ép Dashboard reload lại dữ liệu
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  // --- LOGIC TẠO FOLDER (GIỮ NGUYÊN) ---
  // Hàm update quyền (Dashboard sẽ gọi hàm này khi load folder)
  const updatePermissions = (perms) => {
    setCurrentPermissions(perms);
  };

  const handleCreateFolder = async (name) => {
    try {
      await fileService.createFolder(name, currentFolder);
      toast.success(`Đã tạo thư mục: ${name}`);
      triggerRefresh();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi tạo thư mục");
      return false;
    }
  };

  // --- LOGIC UPLOAD FILE (ĐÃ CẬP NHẬT: BATCH UPLOAD + KIỂM TRA DUNG LƯỢNG) ---
  const handleUploadFile = async (files) => {
    // 1. Kiểm tra đầu vào
    if (!files || files.length === 0) return false;

    // 2. CẤU HÌNH GIỚI HẠN DUNG LƯỢNG
    const MAX_FILE_SIZE = 10 * 1024 * 1024;   // 10MB (Cho từng file)
    const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB (Cho tổng cả lần gửi)

    let totalSize = 0;

    // 3. KIỂM TRA DUNG LƯỢNG (Pre-check)
    for (let i = 0; i < files.length; i++) {
      // Check từng file
      if (files[i].size > MAX_FILE_SIZE) {
        toast.error(`File "${files[i].name}" quá lớn! Vui lòng chọn file dưới 10MB.`);
        return false; // Dừng ngay lập tức
      }
      totalSize += files[i].size;
    }

    // Check tổng dung lượng
    if (totalSize > MAX_TOTAL_SIZE) {
      toast.error(`Tổng dung lượng các file (${(totalSize / 1024 / 1024).toFixed(2)}MB) vượt quá giới hạn cho phép là 100MB.`);
      return false; // Dừng ngay lập tức
    }

    // 4. BẮT ĐẦU UPLOAD
    // Toast loading
    const toastId = toast.loading(`Đang xử lý ${files.length} tệp...`);

    try {
      const formData = new FormData();
      // Gửi parentId (nếu null thì gửi chuỗi rỗng để BE xử lý là Root)
      formData.append("parentId", currentFolder || "");

      // Append từng file vào FormData
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      // Gọi API Batch Upload
      const res = await fileService.uploadBatch(formData);

      if (res.success) {
        const report = res.data; // { successCount, failCount, successfulFiles, failedFiles... }

        // --- TRƯỜNG HỢP 1: THÀNH CÔNG 100% ---
        if (report.failCount === 0) {
          // Kiểm tra xem có file nào bị đổi tên do trùng không
          const renamedCount = report.successfulFiles.filter(f => f.message.includes("đổi tên")).length;

          let msg = `Tải lên thành công ${report.successCount} tệp!`;
          if (renamedCount > 0) {
            msg += ` (Đã tự động đổi tên ${renamedCount} tệp trùng)`;
          }

          toast.update(toastId, {
            render: msg,
            type: "success",
            isLoading: false,
            autoClose: 3000
          });
        }
        // --- TRƯỜNG HỢP 2: THẤT BẠI 100% ---
        else if (report.successCount === 0) {
          toast.update(toastId, {
            render: `Tải lên thất bại toàn bộ (${report.failCount} tệp).`,
            type: "error",
            isLoading: false,
            autoClose: 4000
          });
          // Hiện chi tiết lỗi đầu tiên
          if (report.failedFiles.length > 0) {
            toast.error(`Lỗi: ${report.failedFiles[0].message}`);
          }
        }
        // --- TRƯỜNG HỢP 3: CÓ LỖI VÀI FILE (MIXED) ---
        else {
          toast.update(toastId, {
            render: `Hoàn tất: ${report.successCount} thành công, ${report.failCount} lỗi.`,
            type: "warning",
            isLoading: false,
            autoClose: 5000
          });

          // Hiển thị danh sách file lỗi
          const errorMsg = report.failedFiles.map(f => `• ${f.fileName}: ${f.message}`).join("\n");
          console.error("Các file lỗi:", report.failedFiles);

          // Dùng toast error để hiện danh sách lỗi (cần set style whitespace-pre-line nếu muốn xuống dòng đẹp)
          toast.error("Một số file không tải lên được:\n" + errorMsg);
        }

        // Nếu có ít nhất 1 file thành công thì reload lại danh sách
        if (report.successCount > 0) {
          triggerRefresh();
        }
        return true;
      }
    } catch (error) {
      let errorMessage = error.response?.data?.message || "Lỗi kết nối Server";

      // Xử lý riêng trường hợp Backend trả về lỗi 413 (Payload Too Large) 
      // dù FE đã check (phòng hờ hacker bypass FE)
      if (error.response?.status === 413) {
        errorMessage = "Dung lượng file vượt quá giới hạn cho phép của Server.";
      }

      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 4000
      });
      return false;
    }
  };

  // --- THÊM LOGIC UPLOAD FOLDER ---
  const handleUploadFolder = async (files) => {
    // 1. Kiểm tra đầu vào
    if (!files || files.length === 0) return false;

    // 2. CẤU HÌNH GIỚI HẠN (Dùng chung cấu hình)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const MAX_TOTAL_SIZE = 100 * 1024 * 1024;

    let totalSize = 0;

    // 3. KIỂM TRA DUNG LƯỢNG (Pre-check)
    for (let i = 0; i < files.length; i++) {
      // webkitRelativePath là đường dẫn file trong thư mục (VD: TaiLieu/HinhAnh/a.png)
      // Nếu file quá lớn thì chặn
      if (files[i].size > MAX_FILE_SIZE) {
        toast.error(`File "${files[i].name}" trong thư mục quá lớn! (>10MB)`);
        return false;
      }
      totalSize += files[i].size;
    }

    if (totalSize > MAX_TOTAL_SIZE) {
      toast.error(`Tổng dung lượng thư mục (${(totalSize / 1024 / 1024).toFixed(2)}MB) vượt quá 100MB.`);
      return false;
    }

    // 4. BẮT ĐẦU UPLOAD
    const toastId = toast.loading(`Đang xử lý tải lên thư mục (${files.length} tệp)...`);

    try {
      const formData = new FormData();
      formData.append("parentId", currentFolder || "");

      // --- ĐIỂM KHÁC BIỆT QUAN TRỌNG ---
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
        // Gửi kèm đường dẫn tương đối của từng file để BE tái tạo cấu trúc
        // webkitRelativePath là thuộc tính có sẵn khi input có 'webkitdirectory'
        formData.append("paths", files[i].webkitRelativePath);
      }

      // Gọi API Upload Folder
      const res = await fileService.uploadFolder(formData);

      if (res.success) {
        const report = res.data;

        // --- XỬ LÝ PHẢN HỒI (Tương tự uploadBatch) ---
        if (report.failCount === 0) {
          let msg = `Tải lên thư mục thành công (${report.successCount} tệp)!`;
          toast.update(toastId, { render: msg, type: "success", isLoading: false, autoClose: 3000 });
        } else if (report.successCount === 0) {
          toast.update(toastId, { render: "Tải lên thư mục thất bại toàn bộ.", type: "error", isLoading: false, autoClose: 4000 });
          if (report.failedFiles.length > 0) toast.error(`Lỗi: ${report.failedFiles[0].message}`);
        } else {
          toast.update(toastId, { render: `Hoàn tất: ${report.successCount} thành công, ${report.failCount} lỗi.`, type: "warning", isLoading: false, autoClose: 5000 });
          const errorMsg = report.failedFiles.map(f => `• ${f.fileName}: ${f.message}`).join("\n");
          console.error("File lỗi:", report.failedFiles);
          toast.error("Một số file trong thư mục bị lỗi:\n" + errorMsg);
        }

        if (report.successCount > 0) triggerRefresh();
        return true;
      }
    } catch (error) {
      let errorMessage = error.response?.data?.message || "Lỗi kết nối Server";
      if (error.response?.status === 413) errorMessage = "Tổng dung lượng thư mục vượt quá giới hạn Server.";

      toast.update(toastId, { render: errorMessage, type: "error", isLoading: false, autoClose: 4000 });
      return false;
    }
  };

  const handleRename = async (item, newName) => {
    if (!newName.trim() || newName === item.name) return false;

    try {
      let res;
      // Phân loại để gọi đúng API
      if (item.type === 'FOLDER') {
        res = await fileService.renameFolder(item.id, newName);
      } else {
        res = await fileService.renameFile(item.id, newName);
      }

      if (res.success) {
        toast.success("Đổi tên thành công!");
        triggerRefresh(); // Reload lại danh sách
        return true;
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Lỗi khi đổi tên";
      toast.error(msg);
      return false;
    }
  };

  const handleUpdateDescription = async (item, description) => {
    // Nếu mô tả không đổi thì không gọi API
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
        toast.success("Cập nhật mô tả thành công!");
        triggerRefresh();
        return true;
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Lỗi khi cập nhật mô tả";
      toast.error(msg);
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
      handleUploadFile, // Hàm này giờ nhận vào FileList
      handleUploadFolder,
      handleRename,
      handleUpdateDescription,
      currentPermissions,  // <--- Export state
      updatePermissions
    }}>
      {children}
    </FileContext.Provider>
  );
};