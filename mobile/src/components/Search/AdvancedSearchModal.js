import React, { useState, useEffect } from 'react';
import { 
  View, Text, Modal, StyleSheet, TouchableOpacity, 
  TextInput, ScrollView, Switch, Platform, ActivityIndicator, Image
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

// Hooks
import useFolderList from '../../hooks/useFolderList';
import useUserSearch from '../../hooks/useUserSearch'; // Hook tìm user

// Utils
import { formatDate } from '../../utils/format';

const FILE_TYPES = [
  { value: '', label: 'Tất cả' },
  { value: 'FOLDER', label: 'Thư mục' },
  { value: 'pdf', label: 'PDF' },
  { value: 'docx', label: 'Word' },
  { value: 'xlsx', label: 'Excel' },
  { value: 'jpg', label: 'Ảnh' }
];

const AdvancedSearchModal = ({ visible, onClose, onApply, initialValues }) => {
  // 1. Data Hooks
  const { folderOptions } = useFolderList();
  
  // Hook tìm kiếm user (Load user khi nhập email)
  const {
      searchEmail,
      setSearchEmail,
      foundUser,
      isSearching: isUserSearching,
      error: userError,
      reset: resetUserSearch
  } = useUserSearch({ debounceMs: 600 });

  // 2. Local State
  const [filters, setFilters] = useState({
    fileType: '',
    ownerEmail: '',
    fromDate: null,
    toDate: null,
    locationId: '',
    inTrash: false
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState(null);

  // 3. Sync Initial Values
  useEffect(() => {
    if (visible) {
      setFilters({
        ...initialValues,
        fromDate: initialValues?.fromDate ? new Date(initialValues.fromDate) : null,
        toDate: initialValues?.toDate ? new Date(initialValues.toDate) : null,
        locationId: initialValues?.locationId || '',
        fileType: initialValues?.fileType || '',
        inTrash: initialValues?.inTrash || false,
      });
      // Set email vào hook search user để hiển thị nếu đã có
      setSearchEmail(initialValues?.ownerEmail || '');
    }
  }, [visible, initialValues]);

  // Sync email từ hook user search ngược lại filters state
  useEffect(() => {
      setFilters(prev => ({ ...prev, ownerEmail: searchEmail }));
  }, [searchEmail]);

  // 4. Handlers
  const handleApply = () => {
    const payload = {
      ...filters,
      ownerEmail: searchEmail, // Lấy email từ hook search
      fromDate: filters.fromDate ? filters.fromDate.toISOString().split('T')[0] : '',
      toDate: filters.toDate ? filters.toDate.toISOString().split('T')[0] : ''
    };
    onApply(payload);
    onClose();
  };

  const handleReset = () => {
    setFilters({ fileType: '', ownerEmail: '', fromDate: null, toDate: null, locationId: '', inTrash: false });
    resetUserSearch();
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate && dateField) {
      setFilters(prev => ({ ...prev, [dateField]: selectedDate }));
    }
  };

  const openDatePicker = (field) => {
    setDateField(field);
    setShowDatePicker(true);
  };

  const renderDateText = (date, placeholder) => {
    if (!date) return <Text style={styles.placeholderText}>{placeholder}</Text>;
    return <Text style={styles.valueText}>{formatDate(date)}</Text>;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Bộ lọc nâng cao</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome5 name="times" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            
            {/* 1. Loại file */}
            <Text style={styles.label}>Loại tài liệu</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.typeContainer}>
                {FILE_TYPES.map(type => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeChip, 
                      filters.fileType === type.value && styles.typeChipActive
                    ]}
                    onPress={() => setFilters({ ...filters, fileType: type.value })}
                  >
                    <Text style={[
                      styles.typeText,
                      filters.fileType === type.value && styles.typeTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* 2. Người tạo (User Search Integration) */}
            <Text style={styles.label}>Người tạo</Text>
            <View>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="Nhập email người tạo..."
                        value={searchEmail}
                        onChangeText={setSearchEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    {isUserSearching && (
                        <ActivityIndicator style={styles.inputIcon} size="small" color="#2563EB" />
                    )}
                </View>
                
                {/* Hiển thị User tìm thấy */}
                {foundUser && (
                    <View style={styles.userCard}>
                        {foundUser.avatar ? (
                            <Image source={{ uri: foundUser.avatar }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, { backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }]}>
                                <FontAwesome5 name="user" size={14} color="#2563EB" />
                            </View>
                        )}
                        <View style={{flex: 1}}>
                            <Text style={styles.userName}>{foundUser.fullName}</Text>
                            <Text style={styles.userEmail}>{foundUser.email}</Text>
                        </View>
                        <FontAwesome5 name="check-circle" size={16} color="#059669" />
                    </View>
                )}
                
                {/* Hiển thị lỗi nếu không tìm thấy */}
                {userError ? (
                    <Text style={styles.errorText}>{userError}</Text>
                ) : null}
            </View>

            {/* 3. Vị trí */}
            <Text style={styles.label}>Vị trí tìm kiếm</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={filters.locationId}
                onValueChange={(itemValue) => setFilters({ ...filters, locationId: itemValue })}
                style={Platform.OS === 'ios' ? { height: 150 } : { height: 50 }}
                itemStyle={{ fontSize: 14, height: 120 }}
              >
                <Picker.Item label="-- Tất cả (Gốc) --" value="" />
                {folderOptions.map((folder) => (
                  <Picker.Item 
                    key={folder.id} 
                    label={folder.level > 0 ? `  ${'-- '.repeat(folder.level)}${folder.name}` : folder.name} 
                    value={folder.id} 
                  />
                ))}
              </Picker>
            </View>

            {/* 4. Thời gian */}
            <Text style={styles.label}>Thời gian</Text>
            <View style={styles.row}>
              <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('fromDate')}>
                <Text style={styles.subLabel}>Từ ngày</Text>
                <View style={styles.dateValueRow}>
                  <FontAwesome5 name="calendar-alt" size={14} color="#6B7280" />
                  {renderDateText(filters.fromDate, 'Chọn ngày')}
                </View>
              </TouchableOpacity>
              <View style={{ width: 12 }} />
              <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('toDate')}>
                <Text style={styles.subLabel}>Đến ngày</Text>
                <View style={styles.dateValueRow}>
                  <FontAwesome5 name="calendar-alt" size={14} color="#6B7280" />
                  {renderDateText(filters.toDate, 'Chọn ngày')}
                </View>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={filters[dateField] || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            )}
            
            {Platform.OS === 'ios' && showDatePicker && (
               <TouchableOpacity style={styles.iosCloseBtn} onPress={() => setShowDatePicker(false)}>
                 <Text style={{color: 'blue', fontWeight: 'bold'}}>Xong</Text>
               </TouchableOpacity>
            )}

            {/* 5. Switch Thùng rác */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Tìm trong thùng rác</Text>
              <Switch
                value={filters.inTrash}
                onValueChange={(val) => setFilters({ ...filters, inTrash: val })}
                trackColor={{ false: "#767577", true: "#93C5FD" }}
                thumbColor={filters.inTrash ? "#2563EB" : "#f4f3f4"}
              />
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
              <Text style={styles.resetText}>Đặt lại</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleApply} style={styles.applyBtn}>
              <Text style={styles.applyText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  title: { fontSize: 18, fontWeight: 'bold' },
  body: { paddingHorizontal: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  subLabel: { fontSize: 11, color: '#6B7280', marginBottom: 2 },
  
  // User Search Styles
  inputWrapper: { position: 'relative' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 14, paddingRight: 40 },
  inputIcon: { position: 'absolute', right: 10, top: 12 },
  userCard: { flexDirection: 'row', alignItems: 'center', marginTop: 8, padding: 8, backgroundColor: '#F9FAFB', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  userName: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  userEmail: { fontSize: 12, color: '#6B7280' },
  errorText: { fontSize: 12, color: '#DC2626', marginTop: 4 },

  pickerWrapper: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, overflow: 'hidden', backgroundColor: '#F9FAFB' },
  typeContainer: { flexDirection: 'row', gap: 8, paddingRight: 20 },
  typeChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', marginRight: 8 },
  typeChipActive: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
  typeText: { fontSize: 12, color: '#4B5563' },
  typeTextActive: { color: '#2563EB', fontWeight: '500' },
  row: { flexDirection: 'row' },
  dateInput: { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, backgroundColor: '#F9FAFB' },
  dateValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  valueText: { fontSize: 14, color: '#1F2937', fontWeight: '500' },
  placeholderText: { fontSize: 14, color: '#9CA3AF' },
  iosCloseBtn: { alignItems: 'flex-end', padding: 10, backgroundColor: '#F3F4F6' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  switchLabel: { fontSize: 14, color: '#374151', fontWeight: '500' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6', flexDirection: 'row', gap: 12, backgroundColor: 'white' },
  resetBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center' },
  resetText: { fontWeight: '600', color: '#374151' },
  applyBtn: { flex: 2, padding: 14, borderRadius: 10, backgroundColor: '#2563EB', alignItems: 'center' },
  applyText: { fontWeight: '600', color: 'white' }
});

export default AdvancedSearchModal;