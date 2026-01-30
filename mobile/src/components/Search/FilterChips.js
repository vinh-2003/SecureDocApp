import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

// Hooks & Services
import useFolderList from '../../hooks/useFolderList';
import userService from '../../services/userService'; // [MỚI] Import service để lấy tên

const FilterChips = ({ filters, onRemove, onClearAll }) => {
  const { getFolderById } = useFolderList();
  
  // [MỚI] State lưu tên người tạo đã được resolve từ email
  const [ownerDisplayName, setOwnerDisplayName] = useState('');

  // [MỚI] Effect: Khi email thay đổi -> Gọi API lấy tên user
  useEffect(() => {
    let isMounted = true;
    const email = filters.ownerEmail;

    if (!email) {
        setOwnerDisplayName('');
        return;
    }

    const fetchUserName = async () => {
        try {
            // Gọi API tìm user theo email
            const res = await userService.findUserByEmail(email);
            if (isMounted && res.success && res.data) {
                // Ưu tiên hiển thị FullName, nếu không có thì lấy Username
                setOwnerDisplayName(res.data.fullName || res.data.username);
            } else {
                setOwnerDisplayName(email); // Fallback về email nếu không tìm thấy
            }
        } catch (error) {
            if (isMounted) setOwnerDisplayName(email);
        }
    };

    fetchUserName();

    return () => { isMounted = false; };
  }, [filters.ownerEmail]); // Chạy lại khi email filter thay đổi

  
  // Chuyển đổi filters thành mảng chips
  const activeFilters = useMemo(() => {
    const chips = [];

    // 1. Loại file
    if (filters.fileType) {
      const typeLabels = {
        'FOLDER': 'Thư mục',
        'pdf': 'Tài liệu PDF',
        'docx': 'Word Document',
        'xlsx': 'Excel Sheet',
        'jpg': 'Hình ảnh'
      };
      chips.push({
        key: 'fileType',
        label: `Loại: ${typeLabels[filters.fileType] || filters.fileType}`,
        color: '#DBEAFE',
        text: '#1E40AF'
      });
    }

    // 2. Vị trí (Folder Name)
    if (filters.locationId) {
      const folder = getFolderById(filters.locationId);
      const folderName = folder ? folder.name : 'Thư mục không tồn tại';
      chips.push({
        key: 'locationId',
        label: `Vị trí: ${folderName}`,
        color: '#FEF3C7',
        text: '#B45309'
      });
    }

    // 3. Người tạo (Dùng tên đã resolve)
    if (filters.ownerEmail) {
      chips.push({
        key: 'ownerEmail',
        // [CẬP NHẬT] Hiển thị Tên (nếu đã load xong) hoặc Email (nếu đang load/lỗi)
        label: `Người tạo: ${ownerDisplayName || filters.ownerEmail}`,
        color: '#F3E8FF',
        text: '#6B21A8'
      });
    }

    // 4. Thời gian
    if (filters.fromDate) {
      chips.push({ key: 'fromDate', label: `Từ: ${filters.fromDate}`, color: '#D1FAE5', text: '#065F46' });
    }
    if (filters.toDate) {
      chips.push({ key: 'toDate', label: `Đến: ${filters.toDate}`, color: '#D1FAE5', text: '#065F46' });
    }

    // 5. Thùng rác
    if (filters.inTrash) {
      chips.push({ key: 'inTrash', label: 'Trong thùng rác', color: '#FEE2E2', text: '#991B1B' });
    }

    return chips;
  }, [filters, getFolderById, ownerDisplayName]); // Thêm ownerDisplayName vào dependency

  if (activeFilters.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.label}>Đang lọc:</Text>
        
        {activeFilters.map((filter) => (
          <View key={filter.key} style={[styles.chip, { backgroundColor: filter.color }]}>
            <Text style={[styles.chipText, { color: filter.text }]}>{filter.label}</Text>
            <TouchableOpacity 
                onPress={() => onRemove(filter.key)} 
                style={styles.removeBtn}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            >
              <FontAwesome5 name="times" size={10} color={filter.text} />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity onPress={onClearAll} style={styles.clearBtn}>
          <Text style={styles.clearText}>Xóa hết</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingVertical: 8, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  scroll: { alignItems: 'center', paddingHorizontal: 16, gap: 8 },
  label: { fontSize: 12, color: '#6B7280', marginRight: 4, fontWeight: '500' },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: 20, marginRight: 6
  },
  chipText: { fontSize: 12, fontWeight: '600', marginRight: 6 },
  removeBtn: { padding: 2 },
  clearBtn: { padding: 6, marginLeft: 4 },
  clearText: { fontSize: 12, color: '#2563EB', fontWeight: '500' }
});

export default FilterChips;