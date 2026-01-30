import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { formatBytes } from '../../utils/format';

const DashboardStats = ({ stats }) => {
  if (!stats) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tổng quan</Text>

      <View style={styles.row}>
        {/* Card 1: Dung lượng */}
        <View style={styles.card}>
          <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
            <FontAwesome5 name="hdd" size={20} color="#2563EB" />
          </View>
          <View>
            {/* Ưu tiên dùng usedStorage, fallback về 0 */}
            <Text style={styles.statValue}>
              {formatBytes(stats.usedStorage || stats.totalSize || 0)}
            </Text>
            <Text style={styles.statLabel}>Đã sử dụng</Text>
          </View>
        </View>

        {/* Card 2: Số lượng file */}
        <View style={styles.card}>
          <View style={[styles.iconContainer, { backgroundColor: '#D1FAE5' }]}>
            <FontAwesome5 name="file-alt" size={20} color="#059669" />
          </View>
          <View>
            <Text style={styles.statValue}>
              {stats.totalFiles || 0}
            </Text>
            <Text style={styles.statLabel}>Tổng số tệp</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12, // Khoảng cách giữa 2 thẻ
  },
  card: {
    flex: 1, // Để 2 thẻ chia đều chiều rộng (50% - 50%)
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    height: 110,
    justifyContent: 'space-between',
    
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2
  }
});

export default DashboardStats;