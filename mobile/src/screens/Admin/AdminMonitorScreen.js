import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    RefreshControl,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';

// Components & Services
import adminService from '../../services/adminService';
import { Loading, PageHeader } from '../../components/Common'; // <--- Import thêm PageHeader
import { formatBytes } from '../../utils/format';
import Header from '../../components/Header/Header'; // Header điều hướng (Menu/Back)

const { width } = Dimensions.get('window');

const STATUS_COLORS = {
    AVAILABLE: '#10B981',
    PROCESSING: '#3B82F6',
    PENDING: '#F59E0B',
    FAILED: '#EF4444'
};

const TYPE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

const AdminMonitorScreen = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await adminService.getDocumentStats();
            if (res.success) {
                setStats(res.data);
            }
        } catch (error) {
            console.error('Lỗi tải dữ liệu:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    if (loading && !refreshing) {
        return <Loading variant="page" text="Đang phân tích hệ thống..." />;
    }

    // Xử lý dữ liệu biểu đồ
    const mimeTypeData = stats ? Object.entries(stats.mimeTypeDistribution || {})
        .map(([key, value]) => ({ name: key, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5) : [];

    const maxTypeValue = mimeTypeData.length > 0 ? mimeTypeData[0].value : 1;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* 1. Header Điều hướng (Menu button) */}
            <Header title="Quản trị viên" /> 

            {/* 2. Page Header (Tiêu đề trang chuyên nghiệp) */}
            <PageHeader 
                title="Giám sát tài liệu" 
                subtitle="Tổng quan tình trạng lưu trữ & hệ thống"
            />
            
            {!stats ? (
                <View style={styles.center}>
                    <Text style={{ color: '#6B7280' }}>Không có dữ liệu thống kê.</Text>
                </View>
            ) : (
                <ScrollView 
                    style={styles.scrollView}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    {/* INFO CARDS */}
                    <View style={styles.grid}>
                        <StatCard title="Dung lượng" value={formatBytes(stats.totalSize)} icon="database" color="#3B82F6" />
                        <StatCard title="Tệp tin" value={stats.totalFiles?.toLocaleString()} icon="file-alt" color="#10B981" />
                        <StatCard title="Thư mục" value={stats.totalFolders?.toLocaleString()} icon="folder" color="#8B5CF6" />
                        <StatCard title="Dữ liệu rác" value={formatBytes(stats.trashSize)} subValue={`${stats.trashFiles} tệp`} icon="trash" color="#F87171" />
                    </View>

                    {/* CHARTS SECTION 1 */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Trạng thái tài liệu</Text>
                        <View style={styles.chartCard}>
                            {Object.entries(stats.statusDistribution || {}).map(([key, value]) => {
                                const percentage = (value / (stats.totalFiles || 1) * 100);
                                if (value === 0) return null;
                                return (
                                    <View key={key} style={styles.barContainer}>
                                        <View style={styles.barHeader}>
                                            <Text style={styles.barLabel}>{key}</Text>
                                            <Text style={styles.barValue}>{value} ({percentage.toFixed(1)}%)</Text>
                                        </View>
                                        <View style={styles.barBackground}>
                                            <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: STATUS_COLORS[key] || '#9CA3AF' }]} />
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* CHARTS SECTION 2 */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Phân bố loại tệp (Top 5)</Text>
                        <View style={styles.chartCard}>
                            {mimeTypeData.map((item, index) => {
                                const barWidth = (item.value / maxTypeValue) * 100;
                                return (
                                    <View key={item.name} style={styles.barContainer}>
                                        <View style={styles.barHeader}>
                                            <Text style={styles.barLabel} numberOfLines={1}>{item.name}</Text>
                                            <Text style={styles.barValue}>{item.value}</Text>
                                        </View>
                                        <View style={styles.barBackground}>
                                            <View style={[styles.barFill, { width: `${barWidth}%`, backgroundColor: TYPE_COLORS[index % TYPE_COLORS.length] }]} />
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* ALERT */}
                    {stats.statusDistribution?.FAILED > 0 && (
                        <View style={styles.alertCard}>
                            <View style={styles.alertHeader}>
                                <FontAwesome5 name="exclamation-triangle" size={18} color="#991B1B" />
                                <Text style={styles.alertTitle}>Cảnh báo hệ thống</Text>
                            </View>
                            <Text style={styles.alertText}>
                                Có <Text style={{fontWeight: 'bold'}}>{stats.statusDistribution.FAILED}</Text> tệp tin gặp lỗi xử lý.
                            </Text>
                            <TouchableOpacity style={styles.alertButton}>
                                <Text style={styles.alertButtonText}>Xem chi tiết</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

// ... (Giữ nguyên phần Component StatCard và Styles cũ của bạn ở dưới)
const StatCard = ({ title, value, subValue, icon, color }) => (
    <View style={styles.card}>
        <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>{title}</Text>
            <Text style={styles.cardValue}>{value}</Text>
            {subValue && <Text style={styles.cardSubValue}>{subValue}</Text>}
        </View>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
            <FontAwesome5 name={icon} size={18} color="#FFF" />
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    scrollView: { flex: 1, paddingHorizontal: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    grid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between',
        marginTop: 20 // Tăng margin top chút cho thoáng so với Header mới
    },
    // ... Copy lại toàn bộ styles cũ từ response trước vào đây ...
    card: {
        backgroundColor: '#FFF',
        width: (width - 40) / 2,
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    cardContent: { flex: 1, marginRight: 8 },
    cardLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
    cardValue: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
    cardSubValue: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: { marginTop: 16 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 10 },
    chartCard: {
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 1,
    },
    barContainer: { marginBottom: 14 },
    barHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    barLabel: { fontSize: 13, fontWeight: '500', color: '#4B5563', flex: 1, marginRight: 10 },
    barValue: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
    barBackground: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 4 },
    alertCard: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 12,
        padding: 16,
        marginTop: 20
    },
    alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    alertTitle: { marginLeft: 8, fontSize: 15, fontWeight: 'bold', color: '#991B1B' },
    alertText: { color: '#B91C1C', fontSize: 13, lineHeight: 20 },
    alertButton: {
        backgroundColor: '#EF4444',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12
    },
    alertButtonText: { color: '#FFF', fontWeight: '600', fontSize: 13 }
});

export default AdminMonitorScreen;