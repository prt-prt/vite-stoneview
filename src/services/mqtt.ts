import mqtt, { MqttClient } from 'mqtt';
import { toast } from 'react-hot-toast';

export const DEFAULT_MQTT_CONFIG = {
    brokerUrl: 'ws://127.0.0.1:8888',
    topic: 'esp32-cams',
    clientId: 'stoneview',
};

// Interface for MQTT configuration
export interface MqttConfig {
    brokerUrl: string;
    topic: string;
    clientId: string;
}

// Class to handle MQTT connections
class MqttService {
    private client: MqttClient | null = null;
    private config: MqttConfig = DEFAULT_MQTT_CONFIG;
    private messageHandlers: ((topic: string, message: Buffer) => void)[] = [];
    private connectionStatus: 'disconnected' | 'connected' = 'disconnected';

    connect(config: Partial<MqttConfig> = {}) {
        this.config = { ...this.config, ...config };

        if (this.client) {
            this.disconnect();
        }

        try {
            console.log('[MQTT] Attempting to connect to broker:', this.config.brokerUrl, 'with clientId:', this.config.clientId);
            this.client = mqtt.connect(this.config.brokerUrl, {
                clientId: this.config.clientId,
                protocolVersion: 4,
                clean: true,
                keepalive: 60,
                connectTimeout: 10000,
                reconnectPeriod: 4000, // Enable automatic reconnection every 4 seconds
            });

            this.client.on('connect', () => {
                this.connectionStatus = 'connected';
                console.log('[MQTT] Connected to broker:', this.config.brokerUrl);
                toast.success('Connected to MQTT broker');
                this.subscribe();
            });

            this.client.on('error', (error) => {
                console.error('[MQTT] Connection error:', error);
                toast.error('MQTT connection error');
            });

            this.client.on('message', (topic, message) => {
                console.log('[MQTT] Message received:', topic, message.toString());
                this.messageHandlers.forEach(handler => handler(topic, message));
            });

            this.client.on('close', () => {
                this.connectionStatus = 'disconnected';
                console.warn('[MQTT] Disconnected from broker');
                toast.error('Disconnected from MQTT broker');
            });

        } catch (error) {
            console.error('[MQTT] Exception during connection:', error);
            toast.error('Failed to connect to MQTT');
        }

        return this;
    }

    subscribe(topic: string = this.config.topic) {
        if (!this.client?.connected) {
            console.warn('[MQTT] Cannot subscribe: client not connected');
            return;
        }

        this.client.subscribe(topic, (err) => {
            if (err) {
                console.error('[MQTT] Subscription error:', err);
            } else {
                console.log(`[MQTT] Subscribed to topic: ${topic}`);
            }
        });

        return this;
    }

    publish(topic: string, message: string) {
        if (!this.client?.connected) {
            console.warn('[MQTT] Cannot publish: client not connected');
            return false;
        }

        try {
            console.log(`[MQTT] Publishing to ${topic}:`, message);
            this.client.publish(topic, message);
            return true;
        } catch (error) {
            console.error('[MQTT] Error publishing message:', error);
            return false;
        }
    }

    disconnect() {
        if (this.client) {
            console.log('[MQTT] Disconnecting from broker');
            this.client.end();
            this.client = null;
            this.connectionStatus = 'disconnected';
        }
        return this;
    }

    onMessage(handler: (topic: string, message: Buffer) => void) {
        this.messageHandlers.push(handler);
        return this;
    }

    getConnectionStatus() {
        return this.connectionStatus;
    }
}

// Export a singleton instance
export const mqttService = new MqttService();

// Utility function to extract IP address from a message
export function extractIpFromMessage(message: Buffer): string | null {
    try {
        const messageString = message.toString();
        const ipPattern = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
        const match = messageString.match(ipPattern);
        return match ? match[0] : null;
    } catch (error) {
        console.error('Error extracting IP from message:', error);
        return null;
    }
} 