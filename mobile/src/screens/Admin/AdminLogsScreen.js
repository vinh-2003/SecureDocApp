import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TextInput, 
    TouchableOpacity, 
    ActivityIndicator,
    ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

// Components & Hooks
import Header from '../../components/Header/Header';
import { PageHeader, Loading } from '../../components/Common';
import LogItem from '../../components/Admin/LogItem'; // Nhớ tạo file này hoặc nhúng vào
import useAccessLogs from '../../hooks/useAccessLogs';

const FILTER_OPTIONS = [
    { label: 'Tất cả', value: 'ALL' },
    { label: 'Đăng nhập', value: 'LOGIN' },
    { label: 'Đăng xuất', value: 'LOGOUT' },
    { label: 'Google', value: 'GOOGLE_LOGIN' },
    { label: 'Token', value: 'REFRESH_TOKEN' },
];

const AdminLogsScreen = () => {
    const { 
        logs, loading, refreshing, loadingMore, 
        keyword, actionFilter,
        setKeyword, setActionFilter, onRefresh, onLoadMore 
    } = useAccessLogs();

    // Render footer loading khi scroll infinite
    const renderFooter = () => {
        if (!loadingMore) return <View style={{ height: 20 }} />;
        return (
            <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color="#3B82F6" />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* 1. Header Navigation */}
            <Header title="Quản trị viên" />

            {/* 2. Page Header */}
            <PageHeader 
                title="Nhật ký truy cập" 
                subtitle="Lịch sử đăng nhập & hoạt động"
            />

            {/* 3. Toolbar: Search & Filter */}
            <View style={styles.toolbar}>
                {/* Search Input */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm Username hoặc IP..."
                        placeholderTextColor="#9CA3AF"
                        value={keyword}
                        onChangeText={setKeyword}
                    />
                    {keyword.length > 0 && (
                        <TouchableOpacity onPress={() => setKeyword('')}>
                            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Horizontal Filter Chips */}
                <View style={styles.filterWrapper}>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterContainer}
                    >
                        {FILTER_OPTIONS.map((opt) => {
                            const isSelected = actionFilter === opt.value;
                            return (
                                <TouchableOpacity
                                    key={opt.value}
                                    style={[
                                        styles.chip,
                                        isSelected && styles.chipSelected
                                    ]}
                                    onPress={() => setActionFilter(opt.value)}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        isSelected && styles.chipTextSelected
                                    ]}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>

            {/* 4. Log List */}
            {loading && !refreshing && logs.length === 0 ? (
                <Loading variant="inline" text="Đang tải dữ liệu..." />
            ) : (
                <FlatList
                    data={logs}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => <LogItem item={item} />}
                    contentContainerStyle={styles.listContent}
                    
                    // Pull to Refresh
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    
                    // Infinite Scroll
                    onEndReached={onLoadMore}
                    onEndReachedThreshold={0.5} // Load khi còn 50% độ dài
                    ListFooterComponent={renderFooter}
                    
                    // Empty State
                    ListEmptyComponent={
                        !loading && (
                            <View style={styles.emptyContainer}>
                                <FontAwesome5 name="clipboard-list" size={40} color="#E5E7EB" />
                                <Text style={styles.emptyText}>Không tìm thấy nhật ký nào</Text>
                            </View>
                        )
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    
    toolbar: {
        backgroundColor: '#FFF',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        marginHorizontal: 16,
        paddingHorizontal: 12,
        height: 40,
        borderRadius: 8,
        marginBottom: 12,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, color: '#1F2937' },
    
    filterWrapper: { height: 32 },
    filterContainer: { paddingHorizontal: 16 },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    chipSelected: {
        backgroundColor: '#EFF6FF', // Blue-50
        borderColor: '#BFDBFE', // Blue-200
    },
    chipText: { fontSize: 13, color: '#4B5563' },
    chipTextSelected: { color: '#2563EB', fontWeight: '600' },

    listContent: { padding: 16 },
    
    emptyContainer: { alignItems: 'center', marginTop: 40 },
    emptyText: { marginTop: 12, color: '#9CA3AF', fontSize: 14 },
});

export default AdminLogsScreen;