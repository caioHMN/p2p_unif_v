// js/dataChannelManager.js

let _dataChannel = null; // Instância privada

export function createDataChannel(peerConnection, label, onOpenCallback, onMessageCallback, onCloseCallback, onErrorCallback) {
    _dataChannel = peerConnection.createDataChannel(label);
    _dataChannel.onopen = onOpenCallback;
    _dataChannel.onmessage = onMessageCallback;
    _dataChannel.onclose = onCloseCallback;
    _dataChannel.onerror = onErrorCallback;
    return _dataChannel;
}

export function setupReceivedDataChannel(channel, onOpenCallback, onMessageCallback, onCloseCallback, onErrorCallback) {
    _dataChannel = channel; // Armazena a referência para o canal recebido
    _dataChannel.onopen = onOpenCallback;
    _dataChannel.onmessage = onMessageCallback;
    _dataChannel.onclose = onCloseCallback;
    _dataChannel.onerror = onErrorCallback;
    return _dataChannel;
}

export function sendDataChannelMessage(dataChannelInstance, message) {
    if (dataChannelInstance && dataChannelInstance.readyState === 'open') {
        dataChannelInstance.send(message);
        return true;
    }
    console.warn('Data Channel not open for sending message.');
    return false;
}

export function getDataChannelInstance() {
    return _dataChannel;
}