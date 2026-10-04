// ─────────────────────────────────────────────────────────────────────────────
// main.ts — Application entry point. Must remain extremely small.
// Responsibility: create App, initialize, start. Nothing else.
// Source of truth: ARCHITECTURE.md §6
// ─────────────────────────────────────────────────────────────────────────────

import './styles/main.css';
import { App } from './app/App.js';

const app = new App();
app.initialize();
app.start();
