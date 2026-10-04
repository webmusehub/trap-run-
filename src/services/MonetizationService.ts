// ─────────────────────────────────────────────────────────────────────────────
// MonetizationService.ts — Ad & Promotion Integration Layer.
// Provides clean non-intrusive ad placement containers and ready-state hooks.
// Source of truth: Master Release Candidate Prompt §27
// ─────────────────────────────────────────────────────────────────────────────

export type AdPlacement = 'main_menu' | 'level_select' | 'level_complete' | 'game_over' | 'victory';

export class MonetizationService {
  private static _instance: MonetizationService | null = null;
  private _providerConfigured = false;

  private constructor() {
    this._checkProvider();
  }

  public static getInstance(): MonetizationService {
    if (!MonetizationService._instance) {
      MonetizationService._instance = new MonetizationService();
    }
    return MonetizationService._instance;
  }

  private _checkProvider(): void {
    // Check if external ad SDK (e.g., Google AdSense / H5 Ads / Poki / CrazyGames) is present
    if (typeof window !== 'undefined' && ((window as any).adsbygoogle || (window as any).adProvider)) {
      this._providerConfigured = true;
    }
  }

  public isAdReady(): boolean {
    return this._providerConfigured;
  }

  /**
   * Mounts an ad placement container into target UI element if ad provider is configured.
   * If no provider is configured, mounts a lightweight clean placeholder structure (hidden by default).
   */
  public mountAdPlacement(placement: AdPlacement, container: HTMLElement): void {
    if (!container) return;

    // Ensure ad wrapper container exists
    let adContainer = container.querySelector(`.ad-container-${placement}`) as HTMLElement;
    if (!adContainer) {
      adContainer = document.createElement('div');
      adContainer.className = `ad-placement ad-container-${placement} ${this._providerConfigured ? 'ad-active' : 'ad-ready-placeholder'}`;
      adContainer.setAttribute('data-placement', placement);
      container.appendChild(adContainer);
    }

    if (this._providerConfigured) {
      try {
        // Trigger SDK fill request if present
        if (typeof (window as any).adProvider?.showBanner === 'function') {
          (window as any).adProvider.showBanner(placement, adContainer);
        }
      } catch (err) {
        console.warn(`[MonetizationService] Failed to request ad for ${placement}:`, err);
      }
    }
  }
}

export const monetizationService = MonetizationService.getInstance();
