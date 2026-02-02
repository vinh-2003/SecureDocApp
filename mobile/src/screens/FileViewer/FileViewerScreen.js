import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    Dimensions,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { FontAwesome5 } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

// Context & Services
import { AuthContext } from '../../context/AuthContext';
import fileService from '../../services/fileService';
import { getToken } from '../../api/axiosClient';

// Components
import SecureImage from '../../components/FileViewer/SecureImage';
import ViewerToolbar from '../../components/FileViewer/ViewerToolbar';
import ThumbnailSidebar from '../../components/FileViewer/ThumbnailSidebar';
import LockedPageOverlay from '../../components/FileViewer/LockedPageOverlay';
import RequestAccessModal from '../../components/FileViewer/RequestAccessModal';
import ManageAccessModal from '../../components/FileViewer/ManageAccessModal';

// Utils
import { formatBytes } from '../../utils/format';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FileViewerScreen = ({ navigation, route }) => {
    const { fileId, file: initialFile } = route.params || {};
    const { user } = useContext(AuthContext);
    const currentUserId = user?.userId;

    // =========================================================================
    // STATE
    // =========================================================================
    const [loading, setLoading] = useState(true);
    const [fileInfo, setFileInfo] = useState(initialFile || null);
    const [pages, setPages] = useState([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [viewType, setViewType] = useState('DOCUMENT'); // DOCUMENT | UNSUPPORTED | VIDEO

    // UI State
    const [showSidebar, setShowSidebar] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);

    // Permissions
    const [isOwner, setIsOwner] = useState(false);

    // Modals
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showManageModal, setShowManageModal] = useState(false);

    // =========================================================================
    // FETCH DATA
    // =========================================================================
    const fetchFileData = useCallback(async () => {
        if (!fileId) {
            Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không tìm thấy file' });
            navigation.goBack();
            return;
        }

        setLoading(true);

        try {
            // 1. Lấy thông tin file
            const fileRes = await fileService.getFileDetails(fileId);
            if (fileRes.success && fileRes.data) {
                setFileInfo(fileRes.data);
                setIsOwner(fileRes.data.ownerId === currentUserId);

                // 2. Xác định loại file
                const mime = fileRes.data.mimeType || '';
                const name = (fileRes.data.name || '').toLowerCase();

                const isDocument = 
                    mime === 'application/pdf' ||
                    name.endsWith('.pdf') ||
                    name.endsWith('.docx') ||
                    name.endsWith('.doc');

                const isVideo = mime.startsWith('video/');

                if (isDocument) {
                    setViewType('DOCUMENT');
                    // 3. Lấy danh sách trang
                    await fetchPages();
                } else if (isVideo) {
                    setViewType('VIDEO');
                } else {
                    setViewType('UNSUPPORTED');
                }
            }
        } catch (error) {
            console.error('Fetch file data error:', error);
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Không thể tải thông tin file'
            });
        } finally {
            setLoading(false);
        }
    }, [fileId, currentUserId]);

    const fetchPages = useCallback(async () => {
        try {
            const pagesRes = await fileService.getFilePages(fileId);
            if (pagesRes.success && pagesRes.data) {
                const pagesData = pagesRes.data.map(page => ({
                    ...page,
                    // canViewClear = true nếu không bị khóa hoặc có quyền xem
                    // canViewClear: !page.locked || page.hasAccess || isOwner
                }));
                setPages(pagesData);
            }
        } catch (error) {
            console.error('Fetch pages error:', error);
        }
    }, [fileId, isOwner]);

    useEffect(() => {
        fetchFileData();
    }, [fetchFileData]);

    // =========================================================================
    // NAVIGATION HANDLERS
    // =========================================================================
    const goToPage = useCallback((index) => {
        if (index >= 0 && index < pages.length) {
            setCurrentPageIndex(index);
        }
    }, [pages.length]);

    const nextPage = useCallback(() => {
        if (currentPageIndex < pages.length - 1) {
            setCurrentPageIndex(prev => prev + 1);
        }
    }, [currentPageIndex, pages.length]);

    const prevPage = useCallback(() => {
        if (currentPageIndex > 0) {
            setCurrentPageIndex(prev => prev - 1);
        }
    }, [currentPageIndex]);

    // =========================================================================
    // ZOOM HANDLERS
    // =========================================================================
    const zoomIn = useCallback(() => {
        setZoomLevel(prev => Math.min(prev + 25, 200));
    }, []);

    const zoomOut = useCallback(() => {
        setZoomLevel(prev => Math.max(prev - 25, 50));
    }, []);

    // =========================================================================
    // LOCK/UNLOCK HANDLERS
    // =========================================================================
    const togglePageLock = useCallback(async () => {
        if (!isOwner) return;

        const currentPage = pages[currentPageIndex];
        if (!currentPage) return;

        try {
            const res = await fileService.togglePageLock(currentPage.id);
            if (res.success) {
                // Cập nhật state local
                setPages(prev => prev.map((p, idx) => 
                    idx === currentPageIndex 
                        ? { ...p, locked: !p.locked }
                        : p
                ));

                Toast.show({
                    type: 'success',
                    text1: currentPage.locked ? 'Đã mở khóa' : 'Đã khóa',
                    text2: `Trang ${currentPageIndex + 1}`
                });
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Không thể thay đổi trạng thái khóa'
            });
        }
    }, [isOwner, pages, currentPageIndex]);

    // =========================================================================
    // DOWNLOAD HANDLER
    // =========================================================================
    const handleDownload = useCallback(async () => {
        Toast.show({
            type: 'info',
            text1: 'Đang tải xuống...',
            text2: fileInfo?.name,
            autoHide: false
        });

        try {
            const token = await getToken();
            if (!token) throw new Error('Chưa đăng nhập');

            const downloadUrl = fileService.getDownloadUrl(fileId);
            const fileUri = FileSystem.documentDirectory + (fileInfo?.name || 'download');

            const downloadResult = await FileSystem.downloadAsync(
                downloadUrl,
                fileUri,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            Toast.hide();

            if (downloadResult.status === 200) {
                const isSharingAvailable = await Sharing.isAvailableAsync();
                if (isSharingAvailable) {
                    await Sharing.shareAsync(downloadResult.uri, {
                        mimeType: fileInfo?.mimeType || 'application/octet-stream',
                        dialogTitle: `Lưu hoặc chia sẻ: ${fileInfo?.name}`
                    });
                }
                Toast.show({ type: 'success', text1: 'Tải xuống thành công!' });
            } else {
                throw new Error('Tải xuống thất bại');
            }
        } catch (error) {
            Toast.hide();
            Toast.show({
                type: 'error',
                text1: 'Lỗi tải xuống',
                text2: error.message
            });
        }
    }, [fileId, fileInfo]);

    // =========================================================================
    // CURRENT PAGE
    // =========================================================================
    const currentPage = pages[currentPageIndex] || null;
    const isCurrentPageLocked = currentPage?.locked && !currentPage?.canViewClear;
    const canGoNext = currentPageIndex < pages.length - 1;
    const canGoPrev = currentPageIndex > 0;

    // =========================================================================
    // RENDER: LOADING
    // =========================================================================
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Đang tải tài liệu...</Text>
            </View>
        );
    }

    // =========================================================================
    // RENDER: UNSUPPORTED FILE
    // =========================================================================
    if (viewType === 'UNSUPPORTED' || viewType === 'VIDEO') {
        return (
            <SafeAreaView style={styles.unsupportedContainer} edges={['top']}>
                {/* Header */}
                <View style={styles.unsupportedHeader}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <FontAwesome5 name="arrow-left" size={18} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.unsupportedHeaderTitle} numberOfLines={1}>
                        {fileInfo?.name || 'Chi tiết file'}
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Content */}
                <View style={styles.unsupportedContent}>
                    <View style={styles.unsupportedIconContainer}>
                        <FontAwesome5
                            name={viewType === 'VIDEO' ? 'film' : 'file-archive'}
                            size={48}
                            color="#9CA3AF"
                        />
                    </View>

                    <Text style={styles.unsupportedTitle}>
                        {viewType === 'VIDEO' ? 'Video clip' : 'Không hỗ trợ xem trước'}
                    </Text>

                    <Text style={styles.unsupportedSubtitle}>
                        {viewType === 'VIDEO'
                            ? 'Vui lòng tải xuống để xem video'
                            : 'Định dạng file này không hỗ trợ xem trực tiếp'}
                    </Text>

                    <TouchableOpacity
                        style={styles.downloadButton}
                        onPress={handleDownload}
                    >
                        <FontAwesome5 name="download" size={16} color="#fff" />
                        <Text style={styles.downloadButtonText}>
                            Tải xuống ({formatBytes(fileInfo?.size || 0)})
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // =========================================================================
    // RENDER: DOCUMENT VIEWER
    // =========================================================================
    return (
        <View style={styles.container}>
            {/* Toolbar */}
            <ViewerToolbar
                fileName={fileInfo?.name}
                currentPage={currentPageIndex + 1}
                totalPages={pages.length}
                zoomLevel={zoomLevel}
                isOwner={isOwner}
                showSidebar={showSidebar}
                canGoNext={canGoNext}
                canGoPrev={canGoPrev}
                onBack={() => navigation.goBack()}
                onPrevPage={prevPage}
                onNextPage={nextPage}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onToggleSidebar={() => setShowSidebar(!showSidebar)}
                onDownload={handleDownload}
                onManageAccess={() => setShowManageModal(true)}
            />

            {/* Main Content */}
            <View style={styles.mainContent}>
                {/* Sidebar */}
                {showSidebar && (
                    <ThumbnailSidebar
                        pages={pages}
                        currentPageIndex={currentPageIndex}
                        onPageClick={goToPage}
                        onClose={() => setShowSidebar(false)}
                    />
                )}

                {/* Page Viewer */}
                <View style={styles.pageContainer}>
                    {currentPage ? (
                        <>
                            {/* Page Image */}
                            <SecureImage
                                pageId={currentPage.id}
                                isLocked={isCurrentPageLocked}
                                zoomLevel={zoomLevel}
                                style={styles.pageImage}
                            />

                            {/* Locked Overlay */}
                            {isCurrentPageLocked && (
                                <LockedPageOverlay
                                    onRequestAccess={() => setShowRequestModal(true)}
                                />
                            )}

                            {/* Lock Toggle Button (Owner only) */}
                            {isOwner && !isCurrentPageLocked && (
                                <TouchableOpacity
                                    style={[
                                        styles.lockToggleButton,
                                        currentPage.locked && styles.lockToggleButtonActive
                                    ]}
                                    onPress={togglePageLock}
                                >
                                    <FontAwesome5
                                        name={currentPage.locked ? 'lock' : 'unlock'}
                                        size={12}
                                        color={currentPage.locked ? '#fff' : '#6B7280'}
                                    />
                                    <Text style={[
                                        styles.lockToggleText,
                                        currentPage.locked && styles.lockToggleTextActive
                                    ]}>
                                        {currentPage.locked ? 'Đang khóa' : 'Khóa trang'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </>
                    ) : (
                        <View style={styles.noPageContainer}>
                            <FontAwesome5 name="file-alt" size={48} color="#D1D5DB" />
                            <Text style={styles.noPageText}>Không có trang nào</Text>
                        </View>
                    )}

                    {/* Navigation Buttons */}
                    {canGoPrev && (
                        <TouchableOpacity
                            style={[styles.navButton, styles.navButtonLeft]}
                            onPress={prevPage}
                        >
                            <FontAwesome5 name="chevron-left" size={20} color="#fff" />
                        </TouchableOpacity>
                    )}

                    {canGoNext && (
                        <TouchableOpacity
                            style={[styles.navButton, styles.navButtonRight]}
                            onPress={nextPage}
                        >
                            <FontAwesome5 name="chevron-right" size={20} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Page Indicator */}
            <View style={styles.pageIndicator}>
                <Text style={styles.pageIndicatorText}>
                    {currentPageIndex + 1} / {pages.length}
                </Text>
            </View>

            {/* Modals */}
            <RequestAccessModal
                visible={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                fileId={fileId}
                pages={pages}
                onSuccess={() => {
                    setShowRequestModal(false);
                    fetchPages();
                }}
            />

            <ManageAccessModal
                visible={showManageModal}
                onClose={() => setShowManageModal(false)}
                fileId={fileId}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1F2937'
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#1F2937',
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        color: '#9CA3AF',
        marginTop: 12,
        fontSize: 14
    },

    // Unsupported View
    unsupportedContainer: {
        flex: 1,
        backgroundColor: '#F9FAFB'
    },
    unsupportedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center'
    },
    unsupportedHeaderTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        textAlign: 'center',
        marginHorizontal: 12
    },
    unsupportedContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32
    },
    unsupportedIconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24
    },
    unsupportedTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8
    },
    unsupportedSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 20
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    },
    downloadButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    },

    // Main Content
    mainContent: {
        flex: 1,
        flexDirection: 'row'
    },
    pageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
    },
    pageImage: {
        width: '100%',
        height: '100%'
    },
    noPageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    noPageText: {
        color: '#9CA3AF',
        marginTop: 12,
        fontSize: 14
    },

    // Navigation Buttons
    navButton: {
        position: 'absolute',
        top: '50%',
        marginTop: -24,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    navButtonLeft: {
        left: 16
    },
    navButtonRight: {
        right: 16
    },

    // Lock Toggle
    lockToggleButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    lockToggleButtonActive: {
        backgroundColor: '#EAB308'
    },
    lockToggleText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280'
    },
    lockToggleTextActive: {
        color: '#fff'
    },

    // Page Indicator
    pageIndicator: {
        position: 'absolute',
        bottom: 24,
        left: '50%',
        marginLeft: -40,
        width: 80,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20
    },
    pageIndicatorText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center'
    }
});

export default FileViewerScreen;