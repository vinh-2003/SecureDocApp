import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { toast } from 'react-toastify';

/**
 * =============================================================================
 * USE FILE WEBSOCKET HOOK
 * =============================================================================
 * Hook quản lý kết nối WebSocket để nhận thông báo realtime về trạng thái file
 * 
 * @param {string} userId - ID của user hiện tại
 * @param {Function} onFileUpdate - Callback khi có cập nhật file
 * @param {Object} options - Các tùy chọn bổ sung
 * @param {boolean} options.showToast - Hiển thị toast notification (default: true)
 * @param {Function} options.onConnect - Callback khi kết nối thành công
 * @param {Function} options.onDisconnect - Callback khi ngắt kết nối
 * @param {Function} options. onError - Callback khi có lỗi
 * =============================================================================
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const WS_ENDPOINT = '/ws';
const RECONNECT_DELAY = 5000; // 5 seconds
const HEARTBEAT_INCOMING = 10000; // 10 seconds
const HEARTBEAT_OUTGOING = 10000; // 10 seconds

/**
 * Các trạng thái file có thể nhận được
 */
export const FILE_STATUS = {
    PROCESSING: 'PROCESSING',
    AVAILABLE: 'AVAILABLE',
    FAILED: 'FAILED'
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Tạo thông báo toast dựa trên status
 * @param {Object} payload - Dữ liệu từ WebSocket
 */
const showStatusToast = (payload) => {
    const { status, fileName } = payload;

    switch (status) {
        case FILE_STATUS.AVAILABLE:
            toast.success(
                <div>
                    <strong>Xử lý hoàn tất!</strong>
                    <p className="text-sm mt-1">Tệp "{fileName}" đã sẵn sàng. </p>
                </div>,
                { icon: '✅' }
            );
            break;

        case FILE_STATUS.FAILED:
            toast.error(
                <div>
                    <strong>Xử lý thất bại!</strong>
                    <p className="text-sm mt-1">Tệp "{fileName}" gặp lỗi.</p>
                </div>,
                { icon: '❌' }
            );
            break;

        default:
            break;
    }
};

// =============================================================================
// HOOK
// =============================================================================

const useFileWebSocket = (userId, onFileUpdate, options = {}) => {
    const {
        showToast = true,
        onConnect,
        onDisconnect,
        onError
    } = options;

    const clientRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    // Lấy URL backend từ environment
    const backendUrl = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL?.replace('/api', '');

    /**
     * Xử lý message từ WebSocket
     */
    const handleMessage = useCallback((message) => {
        if (!message.body) return;

        try {
            const payload = JSON.parse(message.body);

            // Gọi callback để component xử lý
            if (onFileUpdate) {
                onFileUpdate(payload);
            }

            // Hiển thị toast nếu được bật
            if (showToast) {
                showStatusToast(payload);
            }
        } catch (error) {
            console.error('❌ Failed to parse WebSocket message:', error);
        }
    }, [onFileUpdate, showToast]);

    /**
     * Tạo và cấu hình STOMP client
     */
    const createClient = useCallback(() => {
        if (!backendUrl) {
            console.error('❌ WebSocket:  Backend URL not configured');
            return null;
        }

        const client = new Client({
            // WebSocket factory sử dụng SockJS
            webSocketFactory: () => new SockJS(`${backendUrl}${WS_ENDPOINT}`),

            // Heartbeat settings
            heartbeatIncoming: HEARTBEAT_INCOMING,
            heartbeatOutgoing: HEARTBEAT_OUTGOING,

            // Reconnect settings
            reconnectDelay: RECONNECT_DELAY,

            // Connection handlers
            onConnect: (frame) => {
                console.log('🔌 WebSocket connected');

                // Subscribe to user's topic
                const topic = `/topic/files/${userId}`;
                client.subscribe(topic, handleMessage);

                // Callback
                if (onConnect) {
                    onConnect(frame);
                }
            },

            onDisconnect: (frame) => {
                console.log('🔌 WebSocket disconnected');

                if (onDisconnect) {
                    onDisconnect(frame);
                }
            },

            onStompError: (frame) => {
                const errorMessage = frame.headers?.['message'] || 'Unknown error';
                console.error('❌ WebSocket STOMP error:', errorMessage);

                if (onError) {
                    onError(new Error(errorMessage));
                }
            },

            onWebSocketError: (event) => {
                console.error('❌ WebSocket connection error:', event);

                if (onError) {
                    onError(event);
                }
            },

            // Debug (chỉ trong development)
            debug: (str) => {
                if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_WS_DEBUG === 'true') {
                    console.log('🔍 STOMP:', str);
                }
            }
        });

        return client;
    }, [backendUrl, userId, handleMessage, onConnect, onDisconnect, onError]);

    /**
     * Kết nối WebSocket
     */
    const connect = useCallback(() => {
        // Disconnect existing connection
        if (clientRef.current?.active) {
            clientRef.current.deactivate();
        }

        const client = createClient();
        if (client) {
            client.activate();
            clientRef.current = client;
        }
    }, [createClient]);

    /**
     * Ngắt kết nối WebSocket
     */
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (clientRef.current) {
            clientRef.current.deactivate();
            clientRef.current = null;
        }
    }, []);

    // Effect:  Kết nối khi có userId
    useEffect(() => {
        if (!userId) {
            disconnect();
            return;
        }

        connect();

        // Cleanup khi unmount
        return () => {
            disconnect();
        };
    }, [userId, connect, disconnect]);

    // Return các hàm control nếu cần
    return {
        isConnected: clientRef.current?.active || false,
        connect,
        disconnect
    };
};

export default useFileWebSocket;