// ─────────────────────────────────────────────────────────────────────────────
// ThemeManager.ts — Reusable visual level themes & parallax background system.
// Renders distinct atmospheric backgrounds for Levels 1–10.
// Keeps gameplay readability high: dark backgrounds behind high-contrast platforms.
// Source of truth: ARCHITECTURE.md §54, PRD Phase 6 §6-7
// ─────────────────────────────────────────────────────────────────────────────

export interface LevelThemeConfig {
  id: number;
  name: string;
  skyGradientTop: string;
  skyGradientBottom: string;
  gridColor: string;
  midgroundColor: string;
  accentColor: string;
  dustParticleColor?: string;
  patternType: 'cavern' | 'spikes' | 'gears' | 'beams' | 'temple' | 'abyss' | 'clockwork' | 'lava' | 'crystal' | 'nightmare';
}

const LEVEL_THEMES: Record<number, LevelThemeConfig> = {
  1: {
    id: 1,
    name: 'Dungeon Entrance',
    skyGradientTop: '#0f0f23',
    skyGradientBottom: '#1a1a36',
    gridColor: 'rgba(60, 60, 100, 0.15)',
    midgroundColor: '#121226',
    accentColor: '#4a4a75',
    dustParticleColor: 'rgba(200, 200, 255, 0.2)',
    patternType: 'cavern',
  },
  2: {
    id: 2,
    name: 'Spike Pit Cavern',
    skyGradientTop: '#1a0b12',
    skyGradientBottom: '#2d1420',
    gridColor: 'rgba(120, 50, 70, 0.15)',
    midgroundColor: '#1a0d15',
    accentColor: '#7a2838',
    dustParticleColor: 'rgba(255, 150, 150, 0.2)',
    patternType: 'spikes',
  },
  3: {
    id: 3,
    name: 'Mechanical Ruins',
    skyGradientTop: '#111722',
    skyGradientBottom: '#1c2636',
    gridColor: 'rgba(50, 90, 120, 0.15)',
    midgroundColor: '#0e1520',
    accentColor: '#34495e',
    dustParticleColor: 'rgba(150, 200, 255, 0.2)',
    patternType: 'gears',
  },
  4: {
    id: 4,
    name: 'Collapsing Mines',
    skyGradientTop: '#24170d',
    skyGradientBottom: '#382515',
    gridColor: 'rgba(140, 90, 50, 0.15)',
    midgroundColor: '#1a1008',
    accentColor: '#7f5835',
    dustParticleColor: 'rgba(230, 180, 120, 0.25)',
    patternType: 'beams',
  },
  5: {
    id: 5,
    name: 'Deceptive Temple',
    skyGradientTop: '#0b1d16',
    skyGradientBottom: '#153327',
    gridColor: 'rgba(40, 120, 80, 0.15)',
    midgroundColor: '#091712',
    accentColor: '#1e533c',
    dustParticleColor: 'rgba(120, 230, 180, 0.2)',
    patternType: 'temple',
  },
  6: {
    id: 6,
    name: 'Dark Abyss',
    skyGradientTop: '#0d091a',
    skyGradientBottom: '#19122d',
    gridColor: 'rgba(100, 60, 140, 0.15)',
    midgroundColor: '#0b0717',
    accentColor: '#4a2b7a',
    dustParticleColor: 'rgba(180, 140, 255, 0.2)',
    patternType: 'abyss',
  },
  7: {
    id: 7,
    name: 'Clockwork Chamber',
    skyGradientTop: '#1c150c',
    skyGradientBottom: '#302416',
    gridColor: 'rgba(160, 110, 50, 0.15)',
    midgroundColor: '#140e08',
    accentColor: '#8a5d2b',
    dustParticleColor: 'rgba(240, 190, 100, 0.2)',
    patternType: 'clockwork',
  },
  8: {
    id: 8,
    name: 'Chaos Gauntlet',
    skyGradientTop: '#2b0a0a',
    skyGradientBottom: '#421212',
    gridColor: 'rgba(180, 40, 40, 0.2)',
    midgroundColor: '#1f0707',
    accentColor: '#962424',
    dustParticleColor: 'rgba(255, 100, 80, 0.3)',
    patternType: 'lava',
  },
  9: {
    id: 9,
    name: 'Sanctuary',
    skyGradientTop: '#071b26',
    skyGradientBottom: '#0e2f42',
    gridColor: 'rgba(40, 150, 180, 0.18)',
    midgroundColor: '#05131c',
    accentColor: '#175d82',
    dustParticleColor: 'rgba(100, 220, 255, 0.25)',
    patternType: 'crystal',
  },
  10: {
    id: 10,
    name: 'Final Nightmare Temple',
    skyGradientTop: '#1f0516',
    skyGradientBottom: '#380927',
    gridColor: 'rgba(180, 50, 120, 0.2)',
    midgroundColor: '#170410',
    accentColor: '#8c1f60',
    dustParticleColor: 'rgba(255, 120, 200, 0.3)',
    patternType: 'nightmare',
  },
};

export class ThemeManager {
  /** Get level theme config (defaults to level 1 if not found). */
  static getTheme(levelId: number): LevelThemeConfig {
    return LEVEL_THEMES[levelId] || LEVEL_THEMES[1];
  }

  /**
   * Render multi-layer parallax background behind gameplay entities.
   */
  static renderBackground(
    ctx: CanvasRenderingContext2D,
    levelId: number,
    cameraX: number,
    _cameraY: number,
    levelWidth: number,
    levelHeight: number,
    viewW: number,
    viewH: number
  ): void {
    const theme = this.getTheme(levelId);

    // ── Layer 1: Sky Gradient (Fixed Viewport Space) ───────────────────────
    ctx.save();
    const sky = ctx.createLinearGradient(0, 0, 0, viewH);
    sky.addColorStop(0, theme.skyGradientTop);
    sky.addColorStop(1, theme.skyGradientBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, levelWidth, levelHeight);

    // World reference grid
    ctx.strokeStyle = theme.gridColor;
    ctx.lineWidth = 1;
    const grid = 128;
    for (let x = 0; x <= levelWidth; x += grid) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, levelHeight); ctx.stroke();
    }
    for (let y = 0; y <= levelHeight; y += grid) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(levelWidth, y); ctx.stroke();
    }

    // ── Layer 2: Midground Parallax Silhouettes (0.3x Parallax) ────────────
    const parallaxX = cameraX * 0.3;

    ctx.fillStyle = theme.midgroundColor;
    ctx.strokeStyle = theme.accentColor;
    ctx.lineWidth = 2;

    const patternStep = 320;
    const startIdx = Math.floor(parallaxX / patternStep);
    const endIdx   = Math.ceil((parallaxX + viewW + patternStep) / patternStep);

    for (let i = startIdx - 1; i <= endIdx + 1; i++) {
      const baseX = i * patternStep;
      const baseY = levelHeight - 140 + Math.sin(i * 1.5) * 20;

      switch (theme.patternType) {
        case 'cavern':
        case 'temple':
        case 'nightmare':
          // Pillar silhouettes
          ctx.fillRect(baseX + 40, baseY - 300, 50, 400);
          ctx.strokeRect(baseX + 40, baseY - 300, 50, 400);
          ctx.fillRect(baseX + 220, baseY - 240, 40, 340);
          break;

        case 'spikes':
        case 'lava':
          // Sharp jagged mountains / spike silhouettes
          ctx.beginPath();
          ctx.moveTo(baseX, levelHeight);
          ctx.lineTo(baseX + 80, baseY - 260);
          ctx.lineTo(baseX + 160, baseY - 120);
          ctx.lineTo(baseX + 240, baseY - 300);
          ctx.lineTo(baseX + 320, levelHeight);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;

        case 'gears':
        case 'clockwork':
          // Cogwheel / gear outlines
          ctx.beginPath();
          ctx.arc(baseX + 160, baseY - 150, 70, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          break;

        case 'beams':
          // Wooden support beams
          ctx.fillRect(baseX + 20, baseY - 350, 24, 450);
          ctx.fillRect(baseX + 200, baseY - 350, 24, 450);
          ctx.beginPath();
          ctx.moveTo(baseX + 20, baseY - 300);
          ctx.lineTo(baseX + 200, baseY - 100);
          ctx.stroke();
          break;

        case 'abyss':
        case 'crystal':
          // Floating monolith shapes
          ctx.beginPath();
          ctx.moveTo(baseX + 60, baseY - 180);
          ctx.lineTo(baseX + 120, baseY - 280);
          ctx.lineTo(baseX + 180, baseY - 180);
          ctx.lineTo(baseX + 120, baseY - 80);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
      }
    }

    // ── Layer 3: Atmospheric Ambient Particles ─────────────────────────────
    if (theme.dustParticleColor) {
      ctx.fillStyle = theme.dustParticleColor;
      const particleTime = performance.now() * 0.001;
      for (let p = 0; p < 25; p++) {
        const px = ((p * 137 + particleTime * 15) % levelWidth);
        const py = ((p * 93 + Math.sin(p + particleTime) * 20) % levelHeight);
        ctx.fillRect(Math.round(px), Math.round(py), 3, 3);
      }
    }

    ctx.restore();
  }
}
