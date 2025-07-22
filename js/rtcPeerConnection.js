// js/rtcPeerConnection.js

let _peerConnection = null; // Instância privada

const iceServers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export function createPeerConnection(onIceCandidateCallback, onConnectionStateChangeCallback, onDataChannelCallback) {
    _peerConnection = new RTCPeerConnection(iceServers);

    _peerConnection.onicecandidate = ({ candidate }) => {
        onIceCandidateCallback({ candidate }); // Chama o callback passado
    };

    _peerConnection.onconnectionstatechange = () => {
        onConnectionStateChangeCallback(); // Chama o callback passado
    };

    _peerConnection.oniceconnectionstatechange = () => {
        console.log('Estado ICE:', _peerConnection.iceConnectionState);
    };

    _peerConnection.ondatachannel = ({ channel }) => {
        onDataChannelCallback({ channel }); // Chama o callback passado
    };

    return _peerConnection;
}

export function getPeerConnectionInstance() {
    return _peerConnection;
}

export function closePeerConnection() {
    if (_peerConnection) {
        _peerConnection.close();
        _peerConnection = null;
        console.log('PeerConnection fechada.');
    }
}