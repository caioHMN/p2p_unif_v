// js/sdpHandler.js

// Função auxiliar para coletar candidatos por um tempo
async function gatherIceCandidates(peerConnection, timeout = 1000) {
    const candidates = [];
    return new Promise(resolve => {
        const timer = setTimeout(() => {
            peerConnection.onicecandidate = null; // Para de coletar após o timeout
            resolve(candidates);
        }, timeout);

        peerConnection.onicecandidate = ({ candidate }) => {
            if (candidate) {
                candidates.push(candidate.toJSON());
            } else { // null candidate signals end of gathering
                clearTimeout(timer);
                peerConnection.onicecandidate = null; // Para de coletar
                resolve(candidates);
            }
        };

        // Se o estado de coleta já for "complete", resolve imediatamente
        if (peerConnection.iceGatheringState === 'complete') {
            clearTimeout(timer);
            resolve(candidates);
        }
    });
}

export async function generateOffer(peerConnection) {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    // Coletar candidatos por um tempo definido
    const iceCandidates = await gatherIceCandidates(peerConnection, 3000); // Aumentado para 3 segundos

    const fullOffer = {
        sdp: peerConnection.localDescription.sdp,
        type: peerConnection.localDescription.type,
        iceCandidates: iceCandidates
    };
    return fullOffer;
}

export async function generateAnswer(peerConnection, receivedOfferJson) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription({
        type: 'offer',
        sdp: receivedOfferJson.sdp
    }));

    // Adicionar candidatos da oferta recebida, se existirem
    if (receivedOfferJson.iceCandidates && Array.isArray(receivedOfferJson.iceCandidates)) {
        for (const candidateJson of receivedOfferJson.iceCandidates) {
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidateJson));
                console.log('Candidato da oferta adicionado:', candidateJson);
            } catch (e) {
                console.warn('Erro ao adicionar candidato da oferta:', e);
            }
        }
    }

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Coletar candidatos para a resposta
    const iceCandidatesAnswer = await gatherIceCandidates(peerConnection, 3000); // Aumentado para 3 segundos

    const fullAnswer = {
        sdp: peerConnection.localDescription.sdp,
        type: peerConnection.localDescription.type,
        iceCandidates: iceCandidatesAnswer
    };
    return fullAnswer;
}

export async function setRemoteDescription(peerConnection, sdpDataJson) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription({
        type: sdpDataJson.type,
        sdp: sdpDataJson.sdp
    }));

    // Adicionar candidatos recebidos no SDP final
    if (sdpDataJson.iceCandidates && Array.isArray(sdpDataJson.iceCandidates)) {
        for (const candidateJson of sdpDataJson.iceCandidates) {
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidateJson));
                console.log('Candidato da descrição remota adicionado:', candidateJson);
            } catch (e) {
                console.warn('Erro ao adicionar candidato da descrição remota:', e);
            }
        }
    }
}

export async function renegotiateOffer(peerConnection) {
    const offer = await peerConnection.createOffer({ iceRestart: true });
    await peerConnection.setLocalDescription(offer);

    // Coletar candidatos para a nova oferta de reconexão
    const iceCandidates = await gatherIceCandidates(peerConnection, 3000);

    const fullReconnectOffer = {
        sdp: peerConnection.localDescription.sdp,
        type: peerConnection.localDescription.type,
        iceCandidates: iceCandidates
    };
    return fullReconnectOffer;
}