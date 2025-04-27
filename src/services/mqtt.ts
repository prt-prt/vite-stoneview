import mqtt, { MqttClient } from 'mqtt';
import { toast } from 'react-hot-toast';

// Default MQTT configuration matching the WebSocket port
export const DEFAULT_MQTT_CONFIG = {
    brokerUrl: 'ws://127.0.0.1:8883',
    topic: 'camera/ip',
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
    private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';

    connect(config: Partial<MqttConfig> = {}) {
        this.config = { ...this.config, ...config };

        if (this.client) {
            this.disconnect();
        }

        this.connectionStatus = 'connecting';
        toast.loading('Connecting to MQTT broker...', { id: 'mqtt-connection' });

        try {
            this.client = mqtt.connect(this.config.brokerUrl, {
                clientId: this.config.clientId,
                protocolVersion: 4, // MQTT 3.1.1
                clean: true,
                keepalive: 60,
                connectTimeout: 10000,
                reconnectPeriod: 4000,
            });


            this.client.on('connect', this.handleConnect);
            this.client.on('error', this.handleError);
            this.client.on('message', this.handleMessage);
            this.client.on('disconnect', this.handleDisconnect);
            this.client.on('offline', this.handleOffline);
            this.client.on('reconnect', this.handleReconnect);
        } catch (error) {
            this.connectionStatus = 'error';
            toast.error(`Failed to connect to MQTT: ${error}`, { id: 'mqtt-connection' });
            console.error('MQTT connection error:', error);
        }

        return this;
    }

    subscribe(topic: string = this.config.topic) {
        if (!this.client || !this.client.connected) {
            toast.error('Cannot subscribe: MQTT client not connected');
            return;
        }

        // Simplest subscription without QoS options
        this.client.subscribe(topic, (err) => {
            if (err) {
                toast.error(`Failed to subscribe to ${topic}: ${err.message}`);
                console.error('MQTT subscription error:', err);
            } else {
                toast.success(`Subscribed to ${topic}`, { duration: 2000 });
                console.log(`Subscribed to ${topic}`);
            }
        });

        return this;
    }

    publish(topic: string, message: string) {
        if (!this.client || !this.client.connected) {
            toast.error('Cannot publish: MQTT client not connected');
            return false;
        }

        try {
            this.client.publish(topic, message);
            return true;
        } catch (error) {
            console.error('Error publishing message:', error);
            return false;
        }
    }

    disconnect() {
        if (this.client) {
            this.client.end(true);
            this.client = null;
            this.connectionStatus = 'disconnected';
            toast.success('Disconnected from MQTT broker', { id: 'mqtt-connection' });
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

    private handleConnect = () => {
        this.connectionStatus = 'connected';
        toast.success('Connected to MQTT broker', { id: 'mqtt-connection' });
        console.log('Connected to MQTT broker');

        // Auto-subscribe to the default topic
        this.subscribe();
    };

    private handleError = (error: Error) => {
        this.connectionStatus = 'error';
        toast.error(`MQTT error: ${error.message}`, { id: 'mqtt-connection' });
        console.error('MQTT error:', error);
    };

    private handleDisconnect = () => {
        this.connectionStatus = 'disconnected';
        toast.error('Disconnected from MQTT broker', { id: 'mqtt-connection' });
        console.log('Disconnected from MQTT broker');
    };

    private handleOffline = () => {
        this.connectionStatus = 'disconnected';
        toast.error('MQTT client is offline', { id: 'mqtt-connection' });
        console.log('MQTT client is offline');
    };

    private handleReconnect = () => {
        this.connectionStatus = 'connecting';
        toast.loading('Reconnecting to MQTT broker...', { id: 'mqtt-connection' });
        console.log('Reconnecting to MQTT broker');
    };

    private handleMessage = (topic: string, message: Buffer) => {
        console.log(`Received message on ${topic}: ${message.toString()}`);
        toast.success(`New message: ${topic}`, { duration: 2000 });

        // Call all registered message handlers
        this.messageHandlers.forEach(handler => handler(topic, message));
    };
}

// Export a singleton instance
export const mqttService = new MqttService();

// Utility function to extract IP address from a message
export function extractIpFromMessage(message: Buffer): string | null {
    try {
        const messageString = message.toString();

        // Try to parse as JSON first
        try {
            const data = JSON.parse(messageString);
            if (data.ip) return data.ip;
        } catch (e) {
            // Not JSON, continue with regex
        }

        // Look for IP addresses using regex
        const ipPattern = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
        const match = messageString.match(ipPattern);

        if (match) {
            return match[0];
        }

        return null;
    } catch (error) {
        console.error('Error extracting IP from message:', error);
        return null;
    }
} 