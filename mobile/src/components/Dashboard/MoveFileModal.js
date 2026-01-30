import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import CustomModal from '../Common/CustomModal';
import fileService from '../../services/fileService';

const MoveFileModal = ({ isOpen, onClose, onSuccess, selectedItems }) => {
    // State quản lý việc duyệt folder trong modal
    const [currentId, setCurrentId] = useState(null); // null = Root
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]); // Stack để back lại

    useEffect(() => {
        if (isOpen) {
            setCurrentId(null);
            setHistory([]);
            loadFolders(null);
        }
    }, [isOpen]);

    const loadFolders = async (parentId) => {
        setLoading(true);
        try {
            // Gọi API lấy danh sách file, sau đó lọc lấy Folder
            const res = await fileService.getFiles(parentId);
            const folderList = (res.data || []).filter(item => item.type === 'FOLDER');
            setFolders(folderList);
        } catch (error) {
            console.log('Error loading folders', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFolderPress = (folder) => {
        setHistory([...history, { id: currentId, name: '...' }]); // Lưu lịch sử
        setCurrentId(folder.id);
        loadFolders(folder.id);
    };

    const handleBack = () => {
        if (history.length === 0) return;
        const prev = history[history.length - 1];
        setHistory(history.slice(0, -1));
        setCurrentId(prev.id);
        loadFolders(prev.id);
    };

    const handleMoveHere = async () => {
        // Gọi API Move
        // logic gọi onSuccess(currentId)
        onClose();
    };

    if (!isOpen) return null;

    return (
        <CustomModal visible={isOpen} onClose={onClose}>
            <View style={styles.header}>
                {history.length > 0 && (
                    <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                        <FontAwesome5 name="arrow-left" size={16} color="#333" />
                    </TouchableOpacity>
                )}
                <Text style={styles.title}>Di chuyển đến</Text>
            </View>

            <View style={styles.listContainer}>
                {loading ? (
                    <ActivityIndicator color="#2563EB" />
                ) : (
                    <FlatList
                        data={folders}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.item} onPress={() => handleFolderPress(item)}>
                                <FontAwesome5 name="folder" size={20} color="#F59E0B" />
                                <Text style={styles.itemName}>{item.name}</Text>
                                <FontAwesome5 name="chevron-right" size={12} color="#CCC" />
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={<Text style={styles.empty}>Không có thư mục con</Text>}
                    />
                )}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity onPress={onClose} style={styles.btnCancel}>
                    <Text>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleMoveHere} style={styles.btnMove}>
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Chuyển đến đây</Text>
                </TouchableOpacity>
            </View>
        </CustomModal>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderColor: '#EEE', paddingBottom: 10 },
    backBtn: { marginRight: 10, padding: 5 },
    title: { fontSize: 16, fontWeight: 'bold' },
    listContainer: { height: 250 },
    item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F9FAFB' },
    itemName: { flex: 1, marginLeft: 10, fontSize: 15 },
    empty: { textAlign: 'center', marginTop: 20, color: '#999' },
    footer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15, gap: 10 },
    btnCancel: { padding: 10 },
    btnMove: { backgroundColor: '#2563EB', padding: 10, borderRadius: 8 }
});

export default MoveFileModal;