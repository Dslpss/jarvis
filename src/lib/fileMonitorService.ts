import fs from "fs";
import path from "path";

const WATCH_FILES = [
  path.join(process.cwd(), ".env"),
  path.join(process.cwd(), "package.json"),
];

// In-memory cache for file modification times
let lastStats: Record<string, number> = {};

// Initialize stats to current state to avoid immediate triggering
try {
  for (const filePath of WATCH_FILES) {
    if (fs.existsSync(filePath)) {
      lastStats[filePath] = fs.statSync(filePath).mtimeMs;
    }
  }
} catch (e) {}

export const fileMonitorService = {
  checkChanges(): string[] {
    const changes: string[] = [];
    
    for (const filePath of WATCH_FILES) {
      try {
        if (!fs.existsSync(filePath)) continue;
        
        const stats = fs.statSync(filePath);
        const mtime = stats.mtimeMs;
        
        // If lastStats is empty or different, we have a change
        // (Initial run doesn't count as change because we initialized in outer scope)
        if (lastStats[filePath] !== undefined && lastStats[filePath] !== mtime) {
          changes.push(path.basename(filePath));
        }
        
        // Update cache
        lastStats[filePath] = mtime;
      } catch (err) {
        console.error(`[Monitor] Error checking ${filePath}:`, err);
      }
    }
    
    return changes;
  },
  
  getWatchList(): string[] {
    return WATCH_FILES.map(f => path.basename(f));
  }
};
