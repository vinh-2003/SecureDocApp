// src/hooks/useFileWebSocket.js
import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { toast } from 'react-toastify';

export const useFileWebSocket = (userId, onFileUpdate) => {
    const clientRef = useRef(null);

    useEffect(() => {
        if (!userId) return;

        // Cấu hình STOMP Client
        const client = new Client({
            // Đường dẫn kết nối (dùng SockJS wrapper)
            webSocketFactory: () => new SockJS('http://localhost:8888/ws'),
            
            // Khi kết nối thành công
            onConnect: () => {
                console.log('Connected to WebSocket!');

                // Đăng ký nhận tin tại topic riêng của user này
                client.subscribe(`/topic/files/${userId}`, (message) => {
                    if (message.body) {
                        const payload = JSON.parse(message.body);
                        
                        // Gọi callback để Dashboard xử lý (cập nhật state)
                        onFileUpdate(payload);

                        // Hiện thông báo đẹp
                        if (payload.status === 'AVAILABLE') {
                            toast.success(`Tệp "${payload.fileName}" đã sẵn sàng!`);
                        } else if (payload.status === 'FAILED') {
                            toast.error(`Xử lý thất bại: "${payload.fileName}"`);
                        }
                    }
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
            },
        });

        client.activate();
        clientRef.current = client;

        // Cleanup khi unmount
        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, [userId, onFileUpdate]);
};