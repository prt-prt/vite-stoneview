// @ts-check
// Simple MQTT test client to simulate ESP32 camera modules broadcasting their IP addresses
// Run this script with Node.js: node src/mqtt-test.js
// Note: This is a CommonJS module (uses require)

const mqtt = require('mqtt');

// Using WebSocket configuration to match the browser client
const clientId = 'esp32_simulator';
const brokerUrl = 'ws://127.0.0.1:8883'; // Using WebSocket port

// Match working MQTTX settings
const client = mqtt.connect(brokerUrl, {
    clientId: clientId,
    protocolVersion: 3, // MQTT 3.1
    clean: true,
    keepalive: 60,
    connectTimeout: 10000,
    reconnectPeriod: 4000
});

// Camera IPs to simulate
const cameraIps = [
    '192.168.0.150',
    '192.168.0.151',
    '192.168.0.152'
];

client.on('connect', function () {
    console.log('Connected to MQTT broker with client ID:', clientId);

    // Publish one IP address every 5 seconds
    let index = 0;

    // Publish the first IP immediately
    publishCameraIp(cameraIps[index]);
    index = (index + 1) % cameraIps.length;

    // Schedule the rest
    const interval = setInterval(() => {
        publishCameraIp(cameraIps[index]);
        index = (index + 1) % cameraIps.length;

        // End after publishing all IPs
        if (index === 0) {
            clearInterval(interval);
            setTimeout(() => {
                client.end();
                console.log('Test completed. Disconnected from MQTT broker.');
            }, 1000);
        }
    }, 5000);
});

function publishCameraIp(ip) {
    // Format 1: Simple IP string - without any QoS or retain options
    client.publish('camera/ip', ip, (err) => {
        if (err) {
            console.error('Error publishing format 1:', err);
            return;
        }
        console.log(`Published: ${ip} to camera/ip`);
    });

    // Format 2: JSON format - without any QoS or retain options
    setTimeout(() => {
        const jsonMsg = JSON.stringify({ ip: ip, model: 'ESP32-CAM', uptime: Math.floor(Math.random() * 3600) });
        client.publish('camera/ip', jsonMsg, (err) => {
            if (err) {
                console.error('Error publishing format 2:', err);
                return;
            }
            console.log(`Published JSON: ${jsonMsg} to camera/ip`);
        });
    }, 1000);
}

client.on('error', (error) => {
    console.error('MQTT error:', error);
});

client.on('disconnect', () => {
    console.log('Disconnected from broker');
});

client.on('reconnect', () => {
    console.log('Attempting to reconnect to broker');
});

console.log('MQTT test client starting... connecting to', brokerUrl); 