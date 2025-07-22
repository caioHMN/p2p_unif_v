// js/uiManager.js

let elements = {}; // Objeto para armazenar as referências dos elementos

export function getElements() {
    elements = {
        statusDiv: document.getElementById('status'),
        sdpUnifiedText: document.getElementById('sdpUnifiedText'), // Campo unificado
        generateOfferBtn: document.getElementById('generateOfferBtn'),
        generateAnswerBtn: document.getElementById('generateAnswerBtn'),
        copySdpBtn: document.getElementById('copySdpBtn'),
        saveSdpBtn: document.getElementById('saveSdpBtn'), // Novo botão
        loadSdpBtn: document.getElementById('loadSdpBtn'),   // Novo botão
        loadSdpFile: document.getElementById('loadSdpFile'), // Novo input de arquivo
        connectBtn: document.getElementById('connectBtn'),
        chatMessages: document.getElementById('chatMessages'),
        chatInput: document.getElementById('chatInput'),
        sendChatBtn: document.getElementById('sendChat'),
        reconnectBtn: document.getElementById('reconnectBtn')
    };
    return elements;
}

export function updateStatus(message) {
    if (elements.statusDiv) {
        elements.statusDiv.textContent = `Estado da Conexão: ${message}`;
    }
}

export function setSdpUnifiedText(text) {
    if (elements.sdpUnifiedText) {
        elements.sdpUnifiedText.value = text;
    }
}

export function getSdpUnifiedText() {
    return elements.sdpUnifiedText ? elements.sdpUnifiedText.value : '';
}

export function appendChatMessage(sender, message) {
    if (elements.chatMessages) {
        elements.chatMessages.innerHTML += `<p><strong>${sender}:</strong> ${message}</p>`;
    }
}

export function clearChatInput() {
    if (elements.chatInput) {
        elements.chatInput.value = '';
    }
}

export function scrollChatToBottom() {
    if (elements.chatMessages) {
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }
}

export function getChatInputValue() {
    return elements.chatInput ? elements.chatInput.value : '';
}

// Função utilitária para adicionar listeners
export function on(elementId, eventType, handler) {
    const element = document.getElementById(elementId);
    if (element) {
        element.addEventListener(eventType, handler);
    } else {
        console.warn(`Element with ID '${elementId}' not found.`);
    }
}