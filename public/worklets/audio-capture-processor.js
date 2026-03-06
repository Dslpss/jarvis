class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.bufferSize = 0;
    // Accumulate ~2048 samples before sending (~42ms at 48kHz)
    this.targetSize = 2048;
  }

  process(inputs) {
    const input = inputs[0];
    if (input && input[0] && input[0].length > 0) {
      this.buffer.push(new Float32Array(input[0]));
      this.bufferSize += input[0].length;

      if (this.bufferSize >= this.targetSize) {
        const merged = new Float32Array(this.bufferSize);
        let offset = 0;
        for (const chunk of this.buffer) {
          merged.set(chunk, offset);
          offset += chunk.length;
        }
        this.port.postMessage(merged);
        this.buffer = [];
        this.bufferSize = 0;
      }
    }
    return true;
  }
}

registerProcessor("audio-capture-processor", AudioCaptureProcessor);
