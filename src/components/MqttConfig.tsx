import { useState, useEffect } from 'react';
import { mqttService, DEFAULT_MQTT_CONFIG, MqttConfig as MqttConfigType } from '../services/mqtt';
import { toast } from 'react-hot-toast';

interface MqttConfigProps {
    onConnectionStatusChange: (status: string) => void;
}

export const MqttConfig = ({ onConnectionStatusChange }: MqttConfigProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [config, setConfig] = useState<MqttConfigType>(() => {
        const savedConfig = localStorage.getItem('mqttConfig');
        return savedConfig ? JSON.parse(savedConfig) : DEFAULT_MQTT_CONFIG;
    });
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');

    // Save config to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('mqttConfig', JSON.stringify(config));
    }, [config]);

    // Connect/disconnect effect
    useEffect(() => {
        // Status check interval
        const statusInterval = setInterval(() => {
            const status = mqttService.getConnectionStatus();
            setConnectionStatus(status);
            onConnectionStatusChange(status);
            setIsConnected(status === 'connected');
        }, 1000);

        return () => {
            clearInterval(statusInterval);
        };
    }, [onConnectionStatusChange]);

    const handleConnect = () => {
        if (isConnected) {
            mqttService.disconnect();
            setIsConnected(false);
            setConnectionStatus('disconnected');
        } else {
            // Update statusInterval to avoid delay in UI update
            setConnectionStatus('connecting');
            mqttService.connect(config);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isConnected) {
            toast.error('Disconnect first before changing settings');
            return;
        }
        setConfig(config);
        toast.success('MQTT settings saved');
    };

    return (
        <div className="mqtt-config">
            <div className="mqtt-header" onClick={() => setIsExpanded(!isExpanded)}>
                <h3>MQTT Configuration</h3>
                <div className={`mqtt-status ${connectionStatus}`}>{connectionStatus}</div>
                <button
                    type="button"
                    className={`mqtt-connect-btn ${isConnected ? 'connected' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleConnect();
                    }}
                >
                    {isConnected ? 'Disconnect' : 'Connect'}
                </button>
            </div>

            {isExpanded && (
                <form className="mqtt-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="brokerUrl">Broker URL</label>
                        <input
                            type="text"
                            id="brokerUrl"
                            name="brokerUrl"
                            value={config.brokerUrl}
                            onChange={handleInputChange}
                            placeholder="ws://127.0.0.1:8883"
                            disabled={isConnected}
                        />
                        <small className="form-hint">
                            In browser environments, WebSocket is required:
                            <br />
                            Format: ws://host:port (e.g., ws://127.0.0.1:8883)
                            <br />
                            Using port 8883 for WebSocket as configured in aedes-cli
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="topic">Topic</label>
                        <input
                            type="text"
                            id="topic"
                            name="topic"
                            value={config.topic}
                            onChange={handleInputChange}
                            placeholder="camera/ip"
                            disabled={isConnected}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="clientId">Client ID</label>
                        <input
                            type="text"
                            id="clientId"
                            name="clientId"
                            value={config.clientId}
                            onChange={handleInputChange}
                            placeholder="macbook"
                            disabled={isConnected}
                        />
                        <small className="form-hint">
                            Using a stable client ID that works with your broker
                        </small>
                    </div>

                    <button
                        type="submit"
                        className="mqtt-save-btn"
                        disabled={isConnected}
                    >
                        Save Settings
                    </button>
                </form>
            )}
        </div>
    );
};
