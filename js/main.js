// js/main.js
import * as uiManager from './uiManager.js';
import * as rtcPeerConnection from './rtcPeerConnection.js';
import * as dataChannelManager from './dataChannelManager.js';
import * as sdpHandler from './sdpHandler.js';

let peerConnection;
let dataChannel;
let elements; // Para armazenar as referências dos elementos do DOM

document.addEventListener('DOMContentLoaded', () => {
    elements = uiManager.getElements();

    // Callbacks para o rtcPeerConnection.js
    const onIceCandidate = ({ candidate }) => {
        if (candidate) {
            console.log('Novo ICE candidate:', candidate.toJSON());
        }
    };

    const onConnectionStateChange = () => {
        const state = peerConnection.connectionState;
        uiManager.updateStatus(`Estado da Conexão: ${state}`);
        if (state === 'disconnected' || state === 'failed') {
            console.warn('Conexão WebRTC desconectada ou falhou. Considere reconectar.');
        }
    };

    const onDataChannel = ({ channel }) => {
        dataChannel = channel; // Armazena a referência para o canal recebido
        dataChannelManager.setupReceivedDataChannel(
            dataChannel,
            () => uiManager.appendChatMessage('<strong>[Chat Conectado]</strong>'),
            (e) => {
                uiManager.appendChatMessage('Amigo', e.data);
                uiManager.scrollChatToBottom();
            },
            () => uiManager.appendChatMessage('<strong>[Chat Desconectado]</strong>'),
            (err) => console.error('Data Channel error:', err)
        );
    };

    // --- Listeners para os botões ---

    // 1. Gerar Oferta
    uiManager.on('generateOfferBtn', 'click', async () => {
        uiManager.updateStatus('Gerando Oferta...');
        peerConnection = rtcPeerConnection.createPeerConnection(
            onIceCandidate,
            onConnectionStateChange,
            onDataChannel
        );
        dataChannel = dataChannelManager.createDataChannel(
            peerConnection,
            "chat",
            () => uiManager.appendChatMessage('<strong>[Chat Conectado]</strong>'),
            (e) => {
                uiManager.appendChatMessage('Amigo', e.data);
                uiManager.scrollChatToBottom();
            },
            () => uiManager.appendChatMessage('<strong>[Chat Desconectado]</strong>'),
            (err) => console.error('Data Channel error:', err)
        );

        const offer = await sdpHandler.generateOffer(peerConnection);
        uiManager.setSdpUnifiedText(JSON.stringify(offer, null, 2)); // Adiciona formatação para JSON
        uiManager.updateStatus('Oferta gerada! Copie ou Salve o conteúdo e envie para seu amigo.');
    });

    // 2. Gerar Resposta
    uiManager.on('generateAnswerBtn', 'click', async () => {
        uiManager.updateStatus('Gerando Resposta...');
        const sdpContent = uiManager.getSdpUnifiedText();
        if (!sdpContent) {
            uiManager.updateStatus('Erro: Cole ou Carregue a oferta do Peer A no campo acima antes de gerar a resposta.');
            return;
        }

        let receivedOfferJson;
        try {
            receivedOfferJson = JSON.parse(sdpContent);
            if (receivedOfferJson.type !== 'offer') {
                uiManager.updateStatus('Erro: O conteúdo colado/carregado não é uma oferta válida.');
                return;
            }
        } catch (e) {
            uiManager.updateStatus('Erro: Conteúdo inválido. Certifique-se de que é um JSON de oferta válido.');
            console.error('Erro ao fazer parse da oferta recebida:', e);
            return;
        }

        peerConnection = rtcPeerConnection.createPeerConnection(
            onIceCandidate,
            onConnectionStateChange,
            onDataChannel
        );

        const answer = await sdpHandler.generateAnswer(peerConnection, receivedOfferJson);
        uiManager.setSdpUnifiedText(JSON.stringify(answer, null, 2)); // Adiciona formatação para JSON
        uiManager.updateStatus('Resposta gerada! Copie ou Salve o conteúdo e envie de volta para seu amigo.');
    });

    // 3. Copiar Conteúdo
    uiManager.on('copySdpBtn', 'click', () => {
        const contentToCopy = uiManager.getSdpUnifiedText();
        if (contentToCopy) {
            navigator.clipboard.writeText(contentToCopy)
                .then(() => alert('Conteúdo copiado para a área de transferência!'))
                .catch(err => console.error('Erro ao copiar:', err));
        } else {
            uiManager.updateStatus('Nenhum conteúdo para copiar.');
        }
    });

    // 4. Salvar SDP
    uiManager.on('saveSdpBtn', 'click', () => {
        const sdpContent = uiManager.getSdpUnifiedText();
        if (!sdpContent) {
            uiManager.updateStatus('Nenhum SDP para salvar.');
            return;
        }

        try {
            // Tenta parsear para verificar se é um JSON válido antes de salvar
            const parsedSdp = JSON.parse(sdpContent);
            const fileName = `${parsedSdp.type || 'sdp'}_${Date.now()}.json`; // Nome do arquivo baseado no tipo (offer/answer)
            const blob = new Blob([sdpContent], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            uiManager.updateStatus(`SDP salvo como ${fileName}`);
        } catch (e) {
            uiManager.updateStatus('Erro ao salvar: O conteúdo não é um JSON válido.');
            console.error('Erro ao salvar SDP:', e);
        }
    });

    // 5. Conectar
    uiManager.on('connectBtn', 'click', async () => {
        uiManager.updateStatus('Finalizando Conexão...');
        const sdpContent = uiManager.getSdpUnifiedText();
        if (!sdpContent) {
            uiManager.updateStatus('Erro: Cole ou Carregue a resposta/oferta de reconexão no campo acima antes de conectar.');
            return;
        }

        let finalSdpJson;
        try {
            finalSdpJson = JSON.parse(sdpContent);
            if (finalSdpJson.type !== 'answer' && finalSdpJson.type !== 'offer') {
                uiManager.updateStatus('Erro: O conteúdo não é uma resposta ou oferta de reconexão válida.');
                return;
            }
        } catch (e) {
            uiManager.updateStatus('Erro: Conteúdo inválido. Certifique-se de que é um JSON válido.');
            console.error('Erro ao fazer parse do SDP final:', e);
            return;
        }

        if (!peerConnection) {
            uiManager.updateStatus('Erro: Gere a oferta primeiro ou receba uma oferta de reconexão!');
            return;
        }

        await sdpHandler.setRemoteDescription(peerConnection, finalSdpJson);
        uiManager.updateStatus('Conectando...');
        console.log('SDP remoto configurado. Tentando conectar...');
    });

    // 6. Carregar SDP (Lógica)
    uiManager.on('loadSdpBtn', 'click', () => {
        // Clicar no botão 'Carregar SDP' aciona o input de arquivo oculto
        elements.loadSdpFile.click();
    });

    elements.loadSdpFile.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            uiManager.updateStatus('Nenhum arquivo selecionado.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const fileContent = e.target.result;
            try {
                // Tenta parsear para garantir que é um JSON válido antes de exibir
                JSON.parse(fileContent);
                uiManager.setSdpUnifiedText(fileContent);
                uiManager.updateStatus(`Arquivo "${file.name}" carregado com sucesso.`);
            } catch (jsonError) {
                uiManager.updateStatus('Erro ao carregar: O arquivo não contém um JSON válido.');
                console.error('Erro ao parsear arquivo SDP:', jsonError);
            }
        };
        reader.onerror = (e) => {
            uiManager.updateStatus('Erro ao ler o arquivo.');
            console.error('Erro FileReader:', e);
        };
        reader.readAsText(file);
    });

    // Lidar com envio de mensagem de chat
    uiManager.on('sendChat', 'click', () => {
        const message = uiManager.getChatInputValue();
        if (dataChannel && dataChannel.readyState === 'open') {
            dataChannelManager.sendDataChannelMessage(dataChannel, message);
            uiManager.appendChatMessage('Eu', message);
            uiManager.clearChatInput();
            uiManager.scrollChatToBottom();
        } else {
            uiManager.updateStatus('Chat não conectado. Tente novamente.');
            console.warn('Data Channel not open for sending message.');
        }
    });

    // Lidar com Enter no input do chat
    elements.chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            elements.sendChatBtn.click();
        }
    });

    // Botão de Reconexão
    uiManager.on('reconnectBtn', 'click', async () => {
        if (!peerConnection ||
            (peerConnection.connectionState !== 'disconnected' &&
             peerConnection.connectionState !== 'failed' &&
             peerConnection.connectionState !== 'closed')) {
            console.log('Reconexão não necessária ou PeerConnection não inicializada.');
            uiManager.updateStatus('Reconexão não necessária ou PeerConnection não inicializada.');
            return;
        }

        uiManager.updateStatus('Tentando reconectar (iceRestart)...');
        try {
            const reconnectOffer = await sdpHandler.renegotiateOffer(peerConnection);
            uiManager.setSdpUnifiedText(JSON.stringify(reconnectOffer, null, 2));
            uiManager.updateStatus('Nova SDP de reconexão gerada! Salve ou copie e envie ao outro peer.');
        } catch (err) {
            console.error('Erro na reconexão:', err);
            uiManager.updateStatus('Falha na tentativa de reconexão.');
        }
    });
});