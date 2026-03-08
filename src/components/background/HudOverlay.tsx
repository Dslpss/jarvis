import { ArmorPlates } from '../ui/ArmorPlates';
import { TacticalReticle } from '../ui/TacticalReticle';
import { ArmorDiagnostics } from '../layout/ArmorDiagnostics';
import { SystemMetrics } from '../hud/SystemMetrics';
import Jarvis3DScene from '../3d/Jarvis3DScene';

export function HudOverlay() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* 3D Core Layer */}
      <Jarvis3DScene />
      {/* Corner brackets */}
      <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-[#00d4ff]/20" />
      <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-[#00d4ff]/20" />
      <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-[#00d4ff]/20" />
      <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-[#00d4ff]/20" />

      {/* Scan line */}
      <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d4ff]/40 to-transparent animate-[scanline_8s_linear_infinite]" />

      {/* Vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />

      {/* Edge glow lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d4ff]/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d4ff]/10 to-transparent" />

      {/* IRON MAN ARMOR ELEMENTS */}
      <ArmorPlates />
      <ArmorDiagnostics />
      <TacticalReticle />

      {/* New Features */}
      <div className="absolute top-24 left-6 hidden md:block">
        <SystemMetrics />
      </div>
    </div>
  );
}
