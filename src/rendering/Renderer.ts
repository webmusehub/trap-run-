// ─────────────────────────────────────────────────────────────────────────────
// Renderer.ts — Canvas rendering foundation with theme manager & particle support.
// Source of truth: ARCHITECTURE.md §54-58, TRD.md §52-54, PRD Phase 6 §1, §6, §16
// ─────────────────────────────────────────────────────────────────────────────

import { GAME_CONFIG } from '../game/GameConfig.js';
import type { Entity } from '../entities/Entity.js';
import type { Player } from '../entities/Player.js';
import type { ParticleSystem } from '../systems/ParticleSystem.js';
import { ThemeManager } from './ThemeManager.js';
import { Timer } from '../utils/timer.js';

export class Renderer {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _ctx: CanvasRenderingContext2D;

  private _cameraX = 0;
  private _cameraY = 0;
  private _shakeX  = 0;
  private _shakeY  = 0;

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('[Renderer] Failed to get 2D context.');
    this._ctx = ctx;
    this._ctx.imageSmoothingEnabled = false;
  }

  get ctx(): CanvasRenderingContext2D { return this._ctx; }
  get canvas(): HTMLCanvasElement     { return this._canvas; }

  setCameraOffset(x: number, y: number): void {
    this._cameraX = x;
    this._cameraY = y;
  }

  setShakeOffset(x: number, y: number): void {
    this._shakeX = x;
    this._shakeY = y;
  }

  clear(): void {
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
  }

  beginWorldTransform(): void {
    this._ctx.save();
    const scaleX = this._canvas.width  / GAME_CONFIG.canvas.width;
    const scaleY = this._canvas.height / GAME_CONFIG.canvas.height;
    this._ctx.scale(scaleX, scaleY);
    this._ctx.translate(
      -this._cameraX + this._shakeX,
      -this._cameraY + this._shakeY,
    );
  }

  endWorldTransform(): void {
    this._ctx.restore();
  }

  renderEntities(entities: ReadonlyArray<Entity>): void {
    for (const entity of entities) {
      if (entity.active) entity.render(this._ctx);
    }
  }

  renderParticles(particles: ParticleSystem): void {
    particles.render(this._ctx);
  }

  /** Render thematic parallax background for the active level. */
  drawGameBackground(levelId: number, levelWidth: number, levelHeight: number): void {
    ThemeManager.renderBackground(
      this._ctx,
      levelId,
      this._cameraX,
      this._cameraY,
      levelWidth,
      levelHeight,
      GAME_CONFIG.canvas.width,
      GAME_CONFIG.canvas.height
    );
  }

  /** Render level intro banner overlay ("LEVEL X - NAME"). */
  drawLevelIntroOverlay(levelId: number, levelName: string, opacity: number): void {
    if (opacity <= 0) return;

    const ctx = this._ctx;
    ctx.save();
    ctx.globalAlpha = opacity;

    // Dark backdrop banner
    ctx.fillStyle = 'rgba(10, 10, 20, 0.85)';
    ctx.fillRect(0, this._canvas.height * 0.35, this._canvas.width, 140);

    ctx.fillStyle = '#e8c84a';
    ctx.font = 'bold 42px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`LEVEL ${levelId}`, this._canvas.width / 2, this._canvas.height * 0.35 + 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(levelName.toUpperCase(), this._canvas.width / 2, this._canvas.height * 0.35 + 95);

    ctx.restore();
  }

  drawDevOverlay(fps: number, stateName: string): void {
    const ctx    = this._ctx;
    const scaleX = this._canvas.width  / GAME_CONFIG.canvas.width;
    const scaleY = this._canvas.height / GAME_CONFIG.canvas.height;
    const scale  = Math.min(scaleX, scaleY);

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

    ctx.fillStyle = '#e8c84a';
    ctx.font = `bold ${Math.round(64 * scale)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('TRAP RUN', this._canvas.width / 2, this._canvas.height * 0.38);

    ctx.fillStyle = '#aaaacc';
    ctx.font = `${Math.round(22 * scale)}px monospace`;
    ctx.fillText('Phase 6 — Pixel Art Visual Polish', this._canvas.width / 2, this._canvas.height * 0.50);

    ctx.fillStyle = '#88ee88';
    ctx.font = `${Math.round(18 * scale)}px monospace`;
    ctx.fillText(`FPS: ${fps}`, this._canvas.width / 2, this._canvas.height * 0.60);

    ctx.fillStyle = '#88ccff';
    ctx.fillText(`State: ${stateName}`, this._canvas.width / 2, this._canvas.height * 0.66);

    ctx.restore();
  }

  drawPlayingHUD(
    _fps: number,
    stateName: string,
    player: Player | null,
    timeSeconds: number = 0,
  ): void {
    const ctx   = this._ctx;
    const scale = Math.min(
      this._canvas.width  / GAME_CONFIG.canvas.width,
      this._canvas.height / GAME_CONFIG.canvas.height,
    );

    ctx.save();
    ctx.font = `bold ${Math.round(15 * scale)}px monospace`;
    ctx.textAlign = 'left';

    const deaths = player ? player.deaths : 0;
    const timeFormatted = Timer.format(timeSeconds);

    if (stateName === 'PAUSED') {
      this._drawOverlayBanner('PAUSED', 'Press Escape to resume, or R to restart', '#e8c84a', scale);
    } else if (stateName === 'GAME_OVER') {
      this._drawOverlayBanner('GAME OVER', `Out of lives! Total Deaths: ${deaths}  |  Press R to Try Again`, '#ff4444', scale);
    } else if (stateName === 'LEVEL_COMPLETE') {
      this._drawOverlayBanner('LEVEL COMPLETE!', `Time: ${timeFormatted}  |  Deaths: ${deaths}  |  Press R to Replay`, '#44ff88', scale);
    }

    ctx.restore();
  }

  private _drawOverlayBanner(title: string, subtitle: string, color: string, scale: number): void {
    const ctx = this._ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.70)';
    ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

    ctx.fillStyle = color;
    ctx.font      = `bold ${Math.round(56 * scale)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(title, this._canvas.width / 2, this._canvas.height / 2 - Math.round(20 * scale));

    ctx.fillStyle = '#ffffff';
    ctx.font      = `${Math.round(18 * scale)}px monospace`;
    ctx.fillText(subtitle, this._canvas.width / 2, this._canvas.height / 2 + Math.round(40 * scale));
  }

  drawDevBackground(): void {
    const { width, height } = GAME_CONFIG.canvas;
    const ctx = this._ctx;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#2a2a4e';
    ctx.lineWidth = 1;
    const gridSize = 64;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
  }
}
