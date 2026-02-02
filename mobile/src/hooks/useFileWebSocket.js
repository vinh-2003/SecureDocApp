import { useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import Toast from 'react-native-toast-message';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getBaseUrl } from '../api/axiosClient';

// Polyfill cho TextEncoder/TextDecoder
import 'text-encoding';

/**
 * =============================================================================
 * USE FILE WEBSOCKET HOOK (REACT NATIVE VERSION)
 * =============================================================================
 * Hook quản lý kết nối WebSocket để nhận thông báo realtime về trạng thái file
 * Sử dụng SockJS + STOMP giống như phiên bản Web
 * =============================================================================
 */

const RECONNECT_DELAY = 5000;
const HEARTBEAT_INCOMING = 10000;
const HEARTBEAT_OUTGOING = 10000;

export const FILE_STATUS = {
    PROCESSING: 'PROCESSING',
    AVAILABLE: 'AVAILABLE',
    FAILED: 'FAILED'
};

const showStatusToast = (payload) => {
    const { status, fileName } = payload;

    switch (status) {
        case FILE_STATUS.AVAILABLE:
            Toast.show({
                type: 'success',
                text1: 'Xử lý hoàn tất!',
                text2: `Tệp "${fileName}" đã sẵn sàng.`,
                visibilityTime: 4000
            });
            break;

        case FILE_STATUS.FAILED:
            Toast.show({
                type: 'error',
                text1: 'Xử lý thất bại!',
                text2: `Tệp "${fileName}" gặp lỗi.`,
                visibilityTime: 4000
            });
            break;

        default:
            break;
    }
};

const getWebSocketUrl = () => {
    const apiUrl = getBaseUrl();
    const baseUrl = apiUrl.replace('/api', '');
    return `${baseUrl}/ws`;
};

const useFileWebSocket = (userId, onFileUpdate, options = {}) => {
    const {
        showToast = true,
        onConnect,
        onDisconnect,
        onError
    } = options;

    const clientRef = useRef(null);
    const isConnectedRef = useRef(false);
    const appStateRef = useRef(AppState.currentState);
    const userIdRef = useRef(userId);

    useEffect(() => {
        userIdRef.current = userId;
    }, [userId]);

    const handleMessage = useCallback((message) => {
        if (!message.body) return;

        try {
            const payload = JSON.parse(message.body);
            console.log('📨 WebSocket message received:', payload);

            if (onFileUpdate) {
                onFileUpdate(payload);
            }

            if (showToast) {
                showStatusToast(payload);
            }
        } catch (error) {
            console.error('❌ Failed to parse WebSocket message:', error);
        }
    }, [onFileUpdate, showToast]);

    const createClient = useCallback(() => {
        const wsUrl = getWebSocketUrl();
        
        if (!wsUrl) {
            console.error('❌ WebSocket: Backend URL not configured');
            return null;
        }

        console.log('🔌 Creating STOMP client for:', wsUrl);

        const client = new Client({
            webSocketFactory: () => new SockJS(wsUrl),
            heartbeatIncoming: HEARTBEAT_INCOMING,
            heartbeatOutgoing: HEARTBEAT_OUTGOING,
            reconnectDelay: RECONNECT_DELAY,

            onConnect: (frame) => {
                console.log('🔌 STOMP connected');
                isConnectedRef.current = true;

                const currentUserId = userIdRef.current;
                if (currentUserId) {
                    const topic = `/topic/files/${currentUserId}`;
                    console.log(`📡 Subscribing to: ${topic}`);
                    client.subscribe(topic, handleMessage);
                }

                if (onConnect) onConnect(frame);
            },

            onDisconnect: (frame) => {
                console.log('🔌 STOMP disconnected');
                isConnectedRef.current = false;
                if (onDisconnect) onDisconnect(frame);
            },

            onStompError: (frame) => {
                const errorMessage = frame.headers?.['message'] || 'Unknown STOMP error';
                console.error('❌ STOMP error:', errorMessage);
                if (onError) onError(new Error(errorMessage));
            },

            onWebSocketError: (event) => {
                console.error('❌ WebSocket connection error');
                isConnectedRef.current = false;
                if (onError) onError(event);
            },

            debug: (str) => {
                // Uncomment để debug
                // if (__DEV__) console.log('🔍 STOMP:', str);
            }
        });

        return client;
    }, [handleMessage, onConnect, onDisconnect, onError]);

    const connect = useCallback(() => {
        if (!userIdRef.current) {
            console.log('⚠️ Cannot connect WebSocket: No userId');
            return;
        }

        if (clientRef.current?.active) {
            clientRef.current.deactivate();
        }

        const client = createClient();
        if (client) {
            console.log('🔌 Activating STOMP client...');
            client.activate();
            clientRef.current = client;
        }
    }, [createClient]);

    const disconnect = useCallback(() => {
        if (clientRef.current) {
            console.log('🔌 Disconnecting WebSocket...');
            clientRef.current.deactivate();
            clientRef.current = null;
        }
        isConnectedRef.current = false;
    }, []);

    // AppState handling
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (
                appStateRef.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                console.log('📱 App returned to foreground');
                if (!isConnectedRef.current && userIdRef.current) {
                    connect();
                }
            }
            appStateRef.current = nextAppState;
        });

        return () => subscription?.remove();
    }, [connect]);

    // Connect effect
    useEffect(() => {
        if (!userId) {
            disconnect();
            return;
        }

        const timer = setTimeout(connect, 1000);

        return () => {
            clearTimeout(timer);
            disconnect();
        };
    }, [userId, connect, disconnect]);

    return {
        isConnected: isConnectedRef.current,
        connect,
        disconnect
    };
};

export default useFileWebSocket;