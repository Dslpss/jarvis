const WebSocket = require("ws");
const wsUrl = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=" + process.env.GEMINI_API_KEY;

const ws = new WebSocket(wsUrl);

ws.on('open', () => {
    ws.send(JSON.stringify({
        setup: {
            model: "models/gemini-2.5-flash-native-audio-preview-12-2025",
            generationConfig: { responseModalities: ["AUDIO"] },
            tools: [{
                functionDeclarations: [{
                    name: "show_code",
                    parameters: { type: "OBJECT", properties: { code: { type: "STRING" } } }
                }]
            }]
        }
    }));
    
    setTimeout(() => {
        ws.send(JSON.stringify({
            clientContent: {
                turns: [{ role: "user", parts: [{ text: "Use show_code" }] }],
                turnComplete: true
            }
        }));
    }, 1000);
});

ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.toolCall) {
        console.log("Got toolCall:", JSON.stringify(msg.toolCall));
        ws.send(JSON.stringify({
            toolResponse: {
                functionResponses: msg.toolCall.functionCalls.map(fc => ({
                    id: fc.id,
                    response: { result: "success" }
                }))
            }
        }));
        console.log("Sent toolResponse");
    }
});
ws.on('close', (c, r) => { console.log("Close:", c, r.toString()); process.exit(0); });
