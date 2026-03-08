# PLAN: Jarvis External Integrations & UI "Elite" Enhancements

## 📋 Project Context
- **Project**: Jarvis (Next.js, Gemini API, Voice/Chat focus).
- **Core Stacks**: Next.js 15+, Tailwind CSS, Gemini 1.5/2.0 Pro, Google GenAI SDK.
- **Objective**: Add external integrations (News, Web Search, Productivity) and ultra-premium UI components (HUD, Metrics, 3D).

---

## 🏗️ Technical Architecture

### 1. External Integrations (Backend/API)
- **Tool Discovery Architecture**: Expand `memoryTools` in `src/app/api/chat/route.ts` to include new function declarations.
- **Provider Layer**: Create services in `src/lib/providers/` for:
    - `Google Search/Tavily`: Web search tool.
    - `Spotify/Media`: Webhook or API client for media control.
    - `GMail/Calendar`: OAuth-based productivity toolset.
- **Security**: Implement proper OAuth token management in `src/lib/auth.ts`.

### 2. UI/UX "Elite" Enhancements (Frontend)
- **Telemetry HUD**: Create high-performance React components using Visx or Framer Motion for real-time metrics.
- **3D Core (Three.js)**: Implement a central "core" orb in `src/components/3d/JarvisCore.tsx` that pulsates based on VAD (Voice Activity Detection) or API status.
- **Widget Grid**: Responsive dashboard layout in `src/app/dashboard/page.tsx` using CSS Grid and glassmorphism.

---

## 📅 Roadmap (Phased Implementation)

### Phase 1: Foundation (Current)
- [ ] Setup `docs/PLAN.md` (Approved)
- [ ] Create `src/lib/providers/` directory structure.
- [ ] Install necessary dependencies (`three`, `@react-three/fiber`, `tavily-sdk` or similar).

### Phase 2: Core Integrations (Backend Specialist)
- [ ] Implement `web_search` tool.
- [ ] Implement `google_calendar_briefing` tool.
- [ ] Secure testing of API keys.

### Phase 3: Visual Polish (Frontend Specialist)
- [ ] Integrate `JarvisCore` 3D component.
- [ ] Build `SystemMetrics` HUD widget.
- [ ] Animation sync (Link voice input to visual ripples).

### Phase 4: Verification (Test Engineer)
- [ ] Unit tests for integration logic.
- [ ] Playwright E2E for UI interactions.
- [ ] Final Security Audit.

---

## 🛠️ Verification Criteria
1. **Functional**: Jarvis can answer "What are my meetings for today?" and find current news.
2. **Visual**: Interface maintains 60fps even with 3D and Particle fields.
3. **Security**: No sensitive keys exposed, OAuth flows are session-secure.

---

## 🤖 Orchestration Tasks for Phase 2
- **frontend-specialist**: Build the 3D core and HUD widgets.
- **backend-specialist**: Implement Search and Calendar tools.
- **test-engineer**: Write verification tests for the new features.
