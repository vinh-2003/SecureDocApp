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
import useUserSearch from '../../hooks/useUserSearch';

// Utils
import { formatDateShort } from '../../utils/format';

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
      setSearchEmail(initialValues?.ownerEmail || '');
    }
  }, [visible, initialValues]);

  useEffect(() => {
      setFilters(prev => ({ ...prev, ownerEmail: searchEmail }));
  }, [searchEmail]);

  // 4. Handlers
  const handleApply = () => {
    const payload = {
      ...filters,
      ownerEmail: searchEmail,
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
    if (event.type === 'set' && selectedDate && dateField) {
      setFilters(prev => ({ ...prev, [dateField]: selectedDate }));
    }
  };

  const openDatePicker = (field) => {
    setDateField(field);
    setShowDatePicker(true);
  };

  const closeDatePickerIOS = () => {
    setShowDatePicker(false);
    setDateField(null);
  };

  // Xóa ngày đã chọn
  const clearDate = (field) => {
    setFilters(prev => ({ ...prev, [field]: null }));
  };

  const renderDateText = (date, placeholder) => {
    if (!date) return <Text style={styles.placeholderText}>{placeholder}</Text>;
    return <Text style={styles.valueText}>{formatDateShort(date)}</Text>;
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

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            
            {/* 1. Loại file */}
            <Text style={styles.label}>Loại tài liệu</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.typeContainer}>
                {FILE_TYPES.map(type => (
                  <TouchableOpacity
                    key={type.value || 'all'}
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

            {/* 2. Người tạo */}
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
                    {searchEmail.length > 0 && !isUserSearching && (
                        <TouchableOpacity 
                            style={styles.inputIcon} 
                            onPress={() => {
                                setSearchEmail('');
                                resetUserSearch();
                            }}
                        >
                            <FontAwesome5 name="times-circle" size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
                
                {foundUser && (
                    <View style={styles.userCard}>
                        {foundUser.avatarUrl ? (
                            <Image source={{ uri: foundUser.avatarUrl }} style={styles.avatar} />
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
                {Array.isArray(folderOptions) && folderOptions.map((folder) => (
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
              {/* From Date */}
              <View style={styles.dateInputContainer}>
                <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('fromDate')}>
                  <Text style={styles.subLabel}>Từ ngày</Text>
                  <View style={styles.dateValueRow}>
                    <FontAwesome5 name="calendar-alt" size={14} color="#6B7280" />
                    {renderDateText(filters.fromDate, 'Chọn ngày')}
                  </View>
                </TouchableOpacity>
                {/* Nút xóa ngày */}
                {filters.fromDate && (
                  <TouchableOpacity 
                    style={styles.clearDateBtn} 
                    onPress={() => clearDate('fromDate')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <FontAwesome5 name="times-circle" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ width: 12 }} />

              {/* To Date */}
              <View style={styles.dateInputContainer}>
                <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('toDate')}>
                  <Text style={styles.subLabel}>Đến ngày</Text>
                  <View style={styles.dateValueRow}>
                    <FontAwesome5 name="calendar-alt" size={14} color="#6B7280" />
                    {renderDateText(filters.toDate, 'Chọn ngày')}
                  </View>
                </TouchableOpacity>
                {/* Nút xóa ngày */}
                {filters.toDate && (
                  <TouchableOpacity 
                    style={styles.clearDateBtn} 
                    onPress={() => clearDate('toDate')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <FontAwesome5 name="times-circle" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Android DatePicker */}
            {showDatePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={filters[dateField] || new Date()}
                mode="date"
                display="default"
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            )}
            
            {/* iOS DatePicker */}
            {showDatePicker && Platform.OS === 'ios' && (
              <View style={styles.iosDatePickerContainer}>
                <View style={styles.iosDatePickerHeader}>
                  <Text style={styles.iosDatePickerTitle}>
                    {dateField === 'fromDate' ? 'Từ ngày' : 'Đến ngày'}
                  </Text>
                  <TouchableOpacity onPress={closeDatePickerIOS}>
                    <Text style={styles.iosDatePickerDone}>Xong</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={filters[dateField] || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                  style={styles.iosDatePicker}
                />
              </View>
            )}

            {/* 5. Switch Thùng rác */}
            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <FontAwesome5 name="trash" size={14} color="#DC2626" />
                <Text style={styles.switchLabel}>Tìm trong thùng rác</Text>
              </View>
              <Switch
                value={filters.inTrash}
                onValueChange={(val) => setFilters({ ...filters, inTrash: val })}
                trackColor={{ false: "#D1D5DB", true: "#FCA5A5" }}
                thumbColor={filters.inTrash ? "#DC2626" : "#f4f3f4"}
              />
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
              <FontAwesome5 name="undo" size={14} color="#6B7280" />
              <Text style={styles.resetText}>Đặt lại</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleApply} style={styles.applyBtn}>
              <FontAwesome5 name="search" size={14} color="#fff" />
              <Text style={styles.applyText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end' 
  },
  modalContainer: { 
    backgroundColor: 'white', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6' 
  },
  title: { 
    fontSize: 18, 
    fontWeight: 'bold',
    color: '#1F2937'
  },
  body: { 
    paddingHorizontal: 20 
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#374151', 
    marginBottom: 8, 
    marginTop: 16 
  },
  subLabel: { 
    fontSize: 11, 
    color: '#6B7280', 
    marginBottom: 2 
  },
  
  // User Search Styles
  inputWrapper: { 
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center'
  },
  input: { 
    flex: 1,
    borderWidth: 1, 
    borderColor: '#D1D5DB', 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 14, 
    paddingRight: 40,
    backgroundColor: '#F9FAFB'
  },
  inputIcon: { 
    position: 'absolute', 
    right: 12, 
    top: 12 
  },
  userCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 8, 
    padding: 10, 
    backgroundColor: '#D1FAE5', 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#6EE7B7' 
  },
  avatar: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    marginRight: 10 
  },
  userName: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#065F46' 
  },
  userEmail: { 
    fontSize: 12, 
    color: '#047857' 
  },
  errorText: { 
    fontSize: 12, 
    color: '#DC2626', 
    marginTop: 4 
  },

  // Picker
  pickerWrapper: { 
    borderWidth: 1, 
    borderColor: '#D1D5DB', 
    borderRadius: 8, 
    overflow: 'hidden', 
    backgroundColor: '#F9FAFB' 
  },

  // Type chips
  typeContainer: { 
    flexDirection: 'row', 
    gap: 8, 
    paddingRight: 20,
    paddingBottom: 4
  },
  typeChip: { 
    paddingVertical: 8, 
    paddingHorizontal: 14, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    backgroundColor: '#F9FAFB', 
    marginRight: 8 
  },
  typeChipActive: { 
    backgroundColor: '#3B82F6', 
    borderColor: '#3B82F6' 
  },
  typeText: { 
    fontSize: 13, 
    color: '#6B7280',
    fontWeight: '500'
  },
  typeTextActive: { 
    color: '#fff', 
    fontWeight: '600' 
  },

  // Date
  row: { 
    flexDirection: 'row' 
  },
  dateInputContainer: {
    flex: 1,
    position: 'relative'
  },
  dateInput: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#D1D5DB', 
    borderRadius: 8, 
    padding: 10, 
    backgroundColor: '#F9FAFB' 
  },
  dateValueRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginTop: 2 
  },
  valueText: { 
    fontSize: 14, 
    color: '#1F2937', 
    fontWeight: '500' 
  },
  placeholderText: { 
    fontSize: 14, 
    color: '#9CA3AF' 
  },
  clearDateBtn: {
    position: 'absolute',
    right: 8,
    top: 8,
    padding: 4,
    zIndex: 1
  },

  // iOS DatePicker
  iosDatePickerContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginTop: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  iosDatePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff'
  },
  iosDatePickerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151'
  },
  iosDatePickerDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6'
  },
  iosDatePicker: {
    height: 180
  },

  // Switch
  switchRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 20, 
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 12
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  switchLabel: { 
    fontSize: 14, 
    color: '#374151', 
    fontWeight: '600' 
  },

  // Footer
  footer: { 
    padding: 20, 
    borderTopWidth: 1, 
    borderTopColor: '#F3F4F6', 
    flexDirection: 'row', 
    gap: 12, 
    backgroundColor: 'white' 
  },
  resetBtn: { 
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14, 
    borderRadius: 12, 
    backgroundColor: '#F3F4F6'
  },
  resetText: { 
    fontWeight: '600', 
    color: '#6B7280',
    fontSize: 15
  },
  applyBtn: { 
    flex: 2, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14, 
    borderRadius: 12, 
    backgroundColor: '#3B82F6'
  },
  applyText: { 
    fontWeight: '600', 
    color: '#fff',
    fontSize: 15
  }
});

export default AdvancedSearchModal;