import React, { useEffect, useState, useRef, useContext } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { FileContext } from '../../context/FileContext';
import FileItem from '../../components/FileExplorer/FileItem';
import EmptyState from '../../components/FileExplorer/EmptyState';
import AdvancedSearchModal from '../../components/Search/AdvancedSearchModal';
import FilterChips from '../../components/Search/FilterChips';
import useFileActions from '../../hooks/useFileActions';
import useSearchPreview from '../../hooks/useSearchPreview'; 

const SearchScreen = ({ navigation }) => {
    // State UI cục bộ (Modal, Filters)
    const [advancedFilters, setAdvancedFilters] = useState({});
    const [showAdvancedModal, setShowAdvancedModal] = useState(false);
    const inputRef = useRef(null);

    // [FIX] Setup Hooks - Truyền advancedFilters vào hook
    const { 
        keyword, 
        setKeyword, 
        results, 
        isSearching, 
        isFullSearch, 
        triggerSearch, 
        reset 
    } = useSearchPreview({ 
        debounceMs: 500,
        extraFilters: advancedFilters 
    });

    const { handleRename, handleUploadFile, handleCreateFolder } = useContext(FileContext);
    const { showActionSheetWithOptions } = useActionSheet();
    
    const fileActions = useFileActions({
        handleRename, handleUploadFile, handleCreateFolder,
        onRefresh: () => triggerSearch(advancedFilters)
    });

    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    // [HELPER] Làm sạch object filter (xóa các key null/undefined/empty string)
    // Giúp nút filter không bị sáng nếu chỉ có key rỗng
    const cleanFilters = (filters) => {
        const cleaned = {};
        Object.keys(filters).forEach(key => {
            if (filters[key] !== null && filters[key] !== '' && filters[key] !== undefined && filters[key] !== false) {
                cleaned[key] = filters[key];
            }
        });
        return cleaned;
    };

    const handleSubmit = () => {
        Keyboard.dismiss();
        triggerSearch(advancedFilters);
    };

    const handleApplyFilters = (newFilters) => {
        // [FIX] Clean filter trước khi set state
        const cleaned = cleanFilters(newFilters);
        setAdvancedFilters(cleaned);
        triggerSearch(cleaned);
    };

    const handleRemoveFilter = (key) => {
        const newFilters = { ...advancedFilters };
        delete newFilters[key];
        // Không cần clean lại vì xoá key là xoá hẳn rồi
        setAdvancedFilters(newFilters);
        triggerSearch(newFilters);
    };

    const handleClearAllFilters = () => {
        setAdvancedFilters({});
        triggerSearch({});
    };

    const handleClearInput = () => {
        reset();
        setAdvancedFilters({});
        inputRef.current?.focus(); 
    };

    // ... (Giữ nguyên các hàm handleItemPress, handleMenuPress) ...
    const handleItemPress = (item) => {
        if (item.type === 'FOLDER') {
            navigation.push('FolderDetail', { folderId: item.id, folderName: item.name });
        } else {
            navigation.navigate('FileViewer', { fileId: item.id, file: item });
        }
    };

    const handleMenuPress = (item) => {
        const options = ['Chi tiết', 'Đổi tên', 'Di chuyển', 'Xóa', 'Hủy'];
        showActionSheetWithOptions(
            { options, cancelButtonIndex: 4, destructiveButtonIndex: 3 },
            (index) => {
                switch(index) {
                    case 0: fileActions.openInfoModal(item); break;
                    case 1: fileActions.openRenameModal(item); break;
                    case 2: fileActions.openMoveModal([item]); break;
                    case 3: fileActions.openDeleteModal([item]); break;
                }
            }
        );
    };

    // Kiểm tra xem có filter nào đang active không để highlight nút
    const hasActiveFilters = Object.keys(advancedFilters).length > 0;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <FontAwesome5 name="arrow-left" size={20} color="#333" />
                </TouchableOpacity>
                
                <View style={styles.inputContainer}>
                    <FontAwesome5 name="search" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        placeholder="Tìm kiếm tài liệu..."
                        value={keyword}
                        onChangeText={setKeyword}
                        onSubmitEditing={handleSubmit}
                        returnKeyType="search"
                        autoCorrect={false}
                    />
                    {keyword.length > 0 && (
                        <TouchableOpacity onPress={handleClearInput}>
                            <FontAwesome5 name="times-circle" size={16} color="#9CA3AF" solid />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity 
                    // [FIX] Sử dụng biến hasActiveFilters đã được clean logic
                    style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]} 
                    onPress={() => setShowAdvancedModal(true)}
                >
                    <FontAwesome5 name="sliders-h" size={18} color={hasActiveFilters ? "#2563EB" : "#6B7280"} />
                </TouchableOpacity>
            </View>

            <FilterChips 
                filters={advancedFilters}
                onRemove={handleRemoveFilter}
                onClearAll={handleClearAllFilters}
            />

            {/* List Results - Giữ nguyên logic hiển thị */}
            {isSearching ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <FileItem 
                            item={item} 
                            onPress={() => handleItemPress(item)}
                            onMenuPress={() => handleMenuPress(item)} 
                        />
                    )}
                    ListHeaderComponent={
                        (!isSearching && results.length > 0 && !isFullSearch) ? (
                            <View style={styles.previewHeader}>
                                <Text style={styles.previewText}>Kết quả gợi ý (Nhấn Enter để xem tất cả)</Text>
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        (keyword.trim() || hasActiveFilters) ? (
                            <EmptyState type="search" message="Không tìm thấy kết quả phù hợp" />
                        ) : (
                            <View style={styles.center}>
                                <FontAwesome5 name="search" size={40} color="#E5E7EB" style={{marginBottom: 16}} />
                                <Text style={styles.hintText}>Nhập từ khóa để tìm kiếm</Text>
                            </View>
                        )
                    }
                    contentContainerStyle={{ paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                />
            )}

            <AdvancedSearchModal
                visible={showAdvancedModal}
                onClose={() => setShowAdvancedModal(false)}
                onApply={handleApplyFilters}
                initialValues={advancedFilters}
            />
            
            {/* Include Modals... */}
        </SafeAreaView>
    );
};
// ... Styles giữ nguyên
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#F3F4F6' },
    backBtn: { padding: 8, marginRight: 4 },
    inputContainer: { 
        flex: 1, flexDirection: 'row', alignItems: 'center', 
        backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 12, height: 44 
    },
    input: { flex: 1, fontSize: 16, color: '#1F2937', height: '100%' },
    filterBtn: { padding: 10, marginLeft: 8 },
    filterBtnActive: { backgroundColor: '#EFF6FF', borderRadius: 8 },
    center: { padding: 40, alignItems: 'center' },
    hintText: { color: '#9CA3AF', fontSize: 14 },
    previewHeader: { padding: 10, backgroundColor: '#FEF3C7', alignItems: 'center' },
    previewText: { fontSize: 12, color: '#92400E', fontWeight: '500' }
});

export default SearchScreen;