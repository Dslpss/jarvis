import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  try {
    // Memory Metrics
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const usedMemPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);

    // CPU Metrics (Simple calculation using loadavg or cpus)
    // Note: os.loadavg() doesn't work on Windows (always returns [0, 0, 0])
    let cpuUsage = 0;
    const cpus = os.cpus();
    
    // Average CPU usage across all cores (this is a rough snapshot)
    const totalCpuTime = cpus.reduce((acc, cpu) => {
      const times = cpu.times;
      return acc + times.user + times.nice + times.sys + times.irq + times.idle;
    }, 0);
    
    const idleCpuTime = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
    cpuUsage = Math.round(100 - (idleCpuTime / totalCpuTime) * 100);

    // For better "Jarvis" feel, we'll keep the values within realistic ranges if they are too low
    // or add a tiny bit of random jitter for visual feedback
    const jitter = () => (Math.random() * 2 - 1).toFixed(1);

    return NextResponse.json({
      cpu: cpuUsage + parseFloat(jitter()),
      memory: usedMemPercent,
      uptime: os.uptime(),
      platform: os.platform(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch system metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
