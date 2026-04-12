import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

const FEATURE_META = {
  "MDVP:Fo(Hz)": {
    label: "Fundamental frequency",
    note: "Average vocal fold vibration frequency",
    group: "Frequency measures",
  },
  "MDVP:Fhi(Hz)": {
    label: "Maximum frequency",
    note: "Upper frequency range of the recorded voice sample",
    group: "Frequency measures",
  },
  "MDVP:Flo(Hz)": {
    label: "Minimum frequency",
    note: "Lower frequency range of the recorded voice sample",
    group: "Frequency measures",
  },
  "MDVP:Jitter(%)": {
    label: "Jitter percentage",
    note: "Cycle-to-cycle variation in pitch period",
    group: "Jitter and pitch stability",
  },
  "MDVP:Jitter(Abs)": {
    label: "Absolute jitter",
    note: "Absolute perturbation in pitch period",
    group: "Jitter and pitch stability",
  },
  "MDVP:RAP": {
    label: "Relative average perturbation",
    note: "Short-term pitch perturbation metric",
    group: "Jitter and pitch stability",
  },
  "MDVP:PPQ": {
    label: "Pitch perturbation quotient",
    note: "Pitch instability across adjacent cycles",
    group: "Jitter and pitch stability",
  },
  "Jitter:DDP": {
    label: "Difference of differences of periods",
    note: "Derived pitch perturbation feature",
    group: "Jitter and pitch stability",
  },
  "MDVP:Shimmer": {
    label: "Shimmer",
    note: "Cycle-to-cycle amplitude variation",
    group: "Shimmer and amplitude stability",
  },
  "MDVP:Shimmer(dB)": {
    label: "Shimmer in dB",
    note: "Amplitude instability in decibel scale",
    group: "Shimmer and amplitude stability",
  },
  "Shimmer:APQ3": {
    label: "APQ3",
    note: "Short-window amplitude perturbation quotient",
    group: "Shimmer and amplitude stability",
  },
  "Shimmer:APQ5": {
    label: "APQ5",
    note: "Five-point amplitude perturbation quotient",
    group: "Shimmer and amplitude stability",
  },
  "MDVP:APQ": {
    label: "APQ",
    note: "Longer-window amplitude perturbation quotient",
    group: "Shimmer and amplitude stability",
  },
  "Shimmer:DDA": {
    label: "DDA",
    note: "Difference of differences of amplitudes",
    group: "Shimmer and amplitude stability",
  },
  NHR: {
    label: "Noise-to-harmonics ratio",
    note: "Higher values may indicate noisier phonation",
    group: "Noise and harmonicity",
  },
  HNR: {
    label: "Harmonics-to-noise ratio",
    note: "Higher values may indicate stronger harmonic voice quality",
    group: "Noise and harmonicity",
  },
  RPDE: {
    label: "Recurrence period density entropy",
    note: "Nonlinear measure of vocal irregularity",
    group: "Nonlinear dynamics",
  },
  DFA: {
    label: "Detrended fluctuation analysis",
    note: "Scaling measure of signal variability",
    group: "Nonlinear dynamics",
  },
  spread1: {
    label: "Spread 1",
    note: "Nonlinear spread-derived vocal feature",
    group: "Nonlinear dynamics",
  },
  spread2: {
    label: "Spread 2",
    note: "Secondary nonlinear spread feature",
    group: "Nonlinear dynamics",
  },
  D2: {
    label: "Correlation dimension D2",
    note: "Complexity estimate of the voice signal",
    group: "Nonlinear dynamics",
  },
  PPE: {
    label: "Pitch period entropy",
    note: "Entropy-based measure of pitch irregularity",
    group: "Nonlinear dynamics",
  },
};

const GROUP_ORDER = [
  "Frequency measures",
  "Jitter and pitch stability",
  "Shimmer and amplitude stability",
  "Noise and harmonicity",
  "Nonlinear dynamics",
  "Other features",
];

const GROUP_DESCRIPTIONS = {
  "Frequency measures":
    "Core descriptors related to baseline vocal pitch and frequency spread.",
  "Jitter and pitch stability":
    "Short-term perturbation features associated with irregular timing of vocal fold vibration.",
  "Shimmer and amplitude stability":
    "Amplitude-based measures describing short-term instability in signal intensity.",
  "Noise and harmonicity":
    "Measures describing breathiness, harmonic structure, and noise burden in phonation.",
  "Nonlinear dynamics":
    "Advanced signal features used to capture complexity and irregularity in speech patterns.",
  "Other features": "Additional biomarker inputs used by the screening model.",
};

const styles = `
:root {
  color-scheme: dark;
  --bg-0: #030816;
  --bg-1: #071120;
  --bg-2: #0a1628;
  --panel: rgba(9, 18, 32, 0.78);
  --panel-2: rgba(10, 22, 38, 0.88);
  --panel-soft: rgba(255,255,255,0.03);
  --line: rgba(146, 182, 255, 0.14);
  --line-strong: rgba(146, 182, 255, 0.26);
  --text: #eaf3ff;
  --text-soft: #d9e7fb;
  --muted: #95a8c8;
  --muted-2: #7284a0;
  --blue: #79b8ff;
  --cyan: #72e5ff;
  --violet: #9e8bff;
  --rose: #ff99b4;
  --green: #7bf1bf;
  --danger: #ff8b99;
  --shadow: 0 28px 90px rgba(0, 0, 0, 0.42);
  --shadow-soft: 0 18px 44px rgba(0, 0, 0, 0.22);
  --radius-xl: 32px;
  --radius-lg: 24px;
  --radius-md: 18px;
  --max: 1440px;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background:
    radial-gradient(circle at 10% 16%, rgba(114, 229, 255, 0.12), transparent 26%),
    radial-gradient(circle at 88% 12%, rgba(158, 139, 255, 0.12), transparent 28%),
    radial-gradient(circle at 78% 82%, rgba(121, 184, 255, 0.10), transparent 24%),
    linear-gradient(180deg, #030816 0%, #06101d 36%, #081322 100%);
  color: var(--text);
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input,
select {
  font: inherit;
}

button {
  cursor: pointer;
  border: 0;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.app-shell {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.bg-grid,
.bg-orb,
.bg-orb-two,
.bg-orb-three {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.bg-grid {
  opacity: 0.13;
  background-image:
    linear-gradient(rgba(121, 184, 255, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(121, 184, 255, 0.055) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: linear-gradient(to bottom, rgba(255,255,255,0.48), transparent 92%);
}

.bg-orb,
.bg-orb-two,
.bg-orb-three {
  filter: blur(100px);
  opacity: 0.38;
}

.bg-orb {
  width: 560px;
  height: 560px;
  top: -60px;
  left: -130px;
  background: radial-gradient(circle, rgba(114,229,255,0.46) 0%, rgba(114,229,255,0.0) 64%);
  animation: driftA 18s ease-in-out infinite;
}

.bg-orb-two {
  width: 640px;
  height: 640px;
  right: -170px;
  top: 40px;
  background: radial-gradient(circle, rgba(158,139,255,0.42) 0%, rgba(158,139,255,0.0) 62%);
  animation: driftB 24s ease-in-out infinite;
}

.bg-orb-three {
  width: 420px;
  height: 420px;
  left: 28%;
  bottom: -100px;
  background: radial-gradient(circle, rgba(255,153,180,0.22) 0%, rgba(255,153,180,0.0) 66%);
  animation: driftC 26s ease-in-out infinite;
}

@keyframes driftA {
  0%, 100% { transform: translate3d(0,0,0) scale(1); }
  50% { transform: translate3d(75px, 38px, 0) scale(1.08); }
}

@keyframes driftB {
  0%, 100% { transform: translate3d(0,0,0) scale(1); }
  50% { transform: translate3d(-90px, 82px, 0) scale(1.1); }
}

@keyframes driftC {
  0%, 100% { transform: translate3d(0,0,0) scale(1); }
  50% { transform: translate3d(46px, -44px, 0) scale(1.06); }
}

@keyframes floatY {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-9px); }
}

@keyframes pulseSoft {
  0%, 100% { box-shadow: 0 0 0 0 rgba(114,229,255,0.08); }
  50% { box-shadow: 0 0 0 10px rgba(114,229,255,0); }
}

@keyframes shine {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(120%); }
}

.container {
  position: relative;
  z-index: 2;
  width: min(calc(100% - 34px), var(--max));
  margin: 0 auto;
}

.topbar {
  position: sticky;
  top: 16px;
  z-index: 40;
  margin: 18px auto 14px;
  padding: 14px 18px;
  border-radius: 999px;
  border: 1px solid rgba(146,182,255,0.12);
  background: rgba(4, 13, 24, 0.64);
  backdrop-filter: blur(22px);
  box-shadow: 0 16px 44px rgba(0,0,0,0.24);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.brand-mark {
  width: 56px;
  height: 56px;
  border-radius: 20px;
  display: grid;
  place-items: center;
  font-size: 20px;
  font-weight: 900;
  color: #071221;
  background: linear-gradient(135deg, var(--cyan), var(--violet));
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.34), 0 14px 36px rgba(114,229,255,0.22);
}

.brand-copy h1 {
  margin: 0;
  font-size: 1.04rem;
  line-height: 1.16;
  letter-spacing: -0.03em;
}

.brand-copy p {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 0.92rem;
}

.nav {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.nav a {
  color: var(--muted);
  font-weight: 600;
  font-size: 0.95rem;
  padding: 10px 14px;
  border-radius: 999px;
  transition: 180ms ease;
}

.nav a:hover {
  color: var(--text);
  background: rgba(121, 184, 255, 0.08);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  border-radius: 999px;
  border: 1px solid rgba(146,182,255,0.16);
  background: rgba(255,255,255,0.03);
  font-weight: 700;
  white-space: nowrap;
}

.status-pill::before {
  content: "";
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #c9d4e6;
}

.status-pill.online::before {
  background: var(--green);
  box-shadow: 0 0 0 8px rgba(123,241,191,0.08);
}

.status-pill.offline::before {
  background: var(--danger);
  box-shadow: 0 0 0 8px rgba(255,139,153,0.08);
}

.panel,
.workspace-card,
.info-card,
.faq-item,
.portfolio-panel,
.sample-card,
.empty-card,
.group-card,
.prediction-wrap,
.insight-card,
.overview-card,
.protocol-card,
.utility-card,
.command-card {
  border-radius: var(--radius-lg);
  border: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(9,18,32,0.86), rgba(9,18,32,0.68));
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(20px);
}

.hero {
  display: grid;
  grid-template-columns: 1.02fr 0.98fr;
  gap: 24px;
  padding: 28px 0 24px;
  align-items: stretch;
}

.panel {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow);
}

.panel::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(115deg, transparent 18%, rgba(255,255,255,0.08) 50%, transparent 82%);
  opacity: 0.16;
  transform: translateX(-120%);
  animation: shine 8s linear infinite;
  pointer-events: none;
}

.hero-copy {
  padding: 50px;
}

.kicker {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 999px;
  color: #dcf6ff;
  background: rgba(114,229,255,0.08);
  border: 1px solid rgba(114,229,255,0.22);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.hero-trust-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 18px 0 8px;
}

.hero-trust-row span {
  padding: 9px 12px;
  border-radius: 999px;
  border: 1px solid rgba(146,182,255,0.14);
  background: rgba(255,255,255,0.03);
  color: #dce9ff;
  font-size: 0.82rem;
  font-weight: 700;
}

.hero-copy h2 {
  margin: 20px 0 14px;
  max-width: 11ch;
  font-size: clamp(3rem, 6vw, 5.9rem);
  line-height: 0.95;
  letter-spacing: -0.065em;
}

.hero-copy .lead {
  margin: 0;
  max-width: 720px;
  color: #bfd0ea;
  font-size: 1.08rem;
  line-height: 1.82;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 28px;
}

.btn {
  padding: 14px 18px;
  border-radius: 16px;
  font-weight: 800;
  letter-spacing: -0.02em;
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.btn:hover {
  transform: translateY(-2px);
}

.btn.primary {
  background: linear-gradient(135deg, var(--blue), var(--violet));
  color: #07111f;
  box-shadow: 0 14px 34px rgba(121,184,255,0.22);
}

.btn.secondary {
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--line-strong);
  color: var(--text);
}

.hero-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 30px;
}

.hero-metric {
  padding: 18px;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02));
  border: 1px solid rgba(146,182,255,0.12);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
}

.hero-metric span {
  display: block;
  color: var(--muted);
  font-size: 0.84rem;
  margin-bottom: 8px;
}

.hero-metric strong {
  display: block;
  font-size: 1.2rem;
  letter-spacing: -0.03em;
}

.note {
  margin-top: 18px;
  color: var(--muted);
  line-height: 1.76;
  font-size: 0.92rem;
}

.hero-side {
  padding: 26px;
  display: grid;
  gap: 16px;
}

.command-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
}

.command-kicker {
  color: #d9f4ff;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.command-head h3 {
  margin: 0;
  font-size: 1.48rem;
  letter-spacing: -0.04em;
}

.live-chip {
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(146,182,255,0.16);
  background: rgba(255,255,255,0.03);
  font-weight: 700;
  white-space: nowrap;
}

.live-chip.online {
  color: #dcfff1;
  background: rgba(123,241,191,0.08);
  border-color: rgba(123,241,191,0.2);
}

.live-chip.offline {
  color: #ffd8df;
  background: rgba(255,139,153,0.08);
  border-color: rgba(255,139,153,0.2);
}

.command-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.command-card {
  min-height: 140px;
  padding: 18px;
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.command-card:hover,
.info-card:hover,
.overview-card:hover,
.protocol-card:hover,
.utility-card:hover,
.insight-card:hover {
  transform: translateY(-4px);
  border-color: rgba(146,182,255,0.22);
  box-shadow: 0 20px 44px rgba(0,0,0,0.22);
}

.command-card.accent {
  background: linear-gradient(180deg, rgba(121,184,255,0.16), rgba(158,139,255,0.08));
}

.command-card span {
  display: block;
  color: var(--muted);
  font-size: 0.84rem;
  margin-bottom: 8px;
}

.command-card strong {
  display: block;
  font-size: 1.46rem;
  letter-spacing: -0.04em;
  margin-bottom: 8px;
}

.command-card p {
  margin: 0;
  color: #bfd0ea;
  line-height: 1.72;
}

.signal-panel {
  padding: 18px;
  border-radius: 24px;
  border: 1px solid rgba(146,182,255,0.12);
  background: rgba(255,255,255,0.03);
}

.signal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.signal-head span:first-child {
  font-weight: 700;
  color: var(--text-soft);
}

.wave-badge {
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(114,229,255,0.08);
  border: 1px solid rgba(114,229,255,0.18);
  color: #d6faff;
  font-weight: 700;
  font-size: 0.82rem;
  animation: pulseSoft 2.8s ease-in-out infinite;
}

.wave-box {
  height: 150px;
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)),
    radial-gradient(circle at 15% 15%, rgba(114,229,255,0.06), transparent 34%);
}

.wave {
  position: absolute;
  inset-inline: -10%;
  height: 100%;
  opacity: 0.82;
}

.wave svg {
  width: 120%;
  height: 100%;
}

.wave.one { animation: floatY 5s ease-in-out infinite; }
.wave.two { animation: floatY 6.5s ease-in-out infinite reverse; opacity: 0.56; }
.wave.three { animation: floatY 8s ease-in-out infinite; opacity: 0.34; }

section.block {
  padding: 24px 0;
}

.section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.section-head h3 {
  margin: 10px 0 8px;
  font-size: clamp(1.75rem, 3vw, 2.6rem);
  letter-spacing: -0.045em;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #d9f4ff;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.section-copy {
  max-width: 780px;
  color: var(--muted);
  line-height: 1.82;
  margin: 0;
}

.overview-grid {
  display: grid;
  grid-template-columns: 1.08fr 0.92fr;
  gap: 16px;
}

.overview-stack {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.overview-card {
  padding: 22px;
}

.overview-card .num {
  display: inline-grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  margin-bottom: 14px;
  font-weight: 800;
  color: #091321;
  background: linear-gradient(135deg, var(--cyan), var(--violet));
}

.overview-card h4 {
  margin: 0 0 10px;
  font-size: 1.08rem;
}

.overview-card p {
  margin: 0;
  color: var(--muted);
  line-height: 1.8;
}

.protocol-card {
  padding: 24px;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.protocol-card h4 {
  margin: 0;
  font-size: 1.2rem;
  letter-spacing: -0.03em;
}

.protocol-card p {
  margin: 0;
  color: var(--muted);
  line-height: 1.8;
}

.protocol-list {
  display: grid;
  gap: 12px;
}

.protocol-item {
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(146,182,255,0.1);
}

.protocol-item span {
  display: block;
  font-size: 0.82rem;
  color: var(--muted);
  margin-bottom: 6px;
}

.protocol-item strong {
  display: block;
  font-size: 0.98rem;
}

.workspace-shell {
  display: grid;
  grid-template-columns: 420px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.workspace-left {
  position: sticky;
  top: 112px;
  display: grid;
  gap: 16px;
  align-self: start;
}

.workspace-right {
  display: grid;
  gap: 16px;
}

.workspace-card {
  padding: 22px;
}

.card-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.card-head h4 {
  margin: 0 0 8px;
  font-size: 1.15rem;
}

.card-head p {
  margin: 0;
  color: var(--muted);
  line-height: 1.76;
}

.helper-badge {
  padding: 9px 12px;
  border-radius: 999px;
  border: 1px solid rgba(146,182,255,0.16);
  background: rgba(255,255,255,0.03);
  color: #dce7f8;
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
}

.field-stack {
  display: grid;
  gap: 14px;
}

.field-block {
  display: grid;
  gap: 8px;
}

.field-label {
  font-size: 0.92rem;
  font-weight: 700;
}

.field-note {
  color: var(--muted);
  font-size: 0.84rem;
  line-height: 1.55;
}

.input,
.select,
.range {
  width: 100%;
}

.input,
.select {
  padding: 13px 14px;
  border-radius: 14px;
  border: 1px solid rgba(146,182,255,0.16);
  background: rgba(255,255,255,0.03);
  color: var(--text);
  outline: none;
  transition: 180ms ease;
}

.input:focus,
.select:focus {
  border-color: rgba(114,229,255,0.42);
  box-shadow: 0 0 0 3px rgba(114,229,255,0.08);
}

.range {
  accent-color: #87bfff;
}

.row-label {
  color: var(--muted);
  font-size: 0.88rem;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
}

.sample-wrap {
  margin-top: 18px;
  display: grid;
  gap: 12px;
}

.sample-card,
.empty-card {
  padding: 18px;
}

.sample-top {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.sample-top .title {
  font-size: 1.06rem;
  font-weight: 800;
}

.sample-top .sub {
  color: var(--muted);
  font-size: 0.86rem;
  margin-top: 4px;
}

.badge {
  padding: 9px 12px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 800;
}

.badge.risk {
  background: rgba(255,139,153,0.1);
  border: 1px solid rgba(255,139,153,0.18);
  color: #ffd8df;
}

.badge.ok {
  background: rgba(123,241,191,0.1);
  border: 1px solid rgba(123,241,191,0.18);
  color: #d9fff0;
}

.sample-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.sample-metric {
  padding: 14px;
  border-radius: 16px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(146,182,255,0.1);
}

.sample-metric span {
  display: block;
  color: var(--muted);
  font-size: 0.82rem;
  margin-bottom: 8px;
}

.sample-metric strong {
  font-size: 1rem;
}

.utility-card {
  padding: 20px;
}

.utility-card h4 {
  margin: 0 0 10px;
  font-size: 1.04rem;
}

.utility-card p {
  margin: 0 0 14px;
  color: var(--muted);
  line-height: 1.8;
}

.utility-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.utility-pill {
  padding: 14px;
  border-radius: 16px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(146,182,255,0.1);
}

.utility-pill span {
  display: block;
  color: var(--muted);
  font-size: 0.78rem;
  margin-bottom: 6px;
}

.utility-pill strong {
  display: block;
  font-size: 0.96rem;
}

.manual-shell {
  padding: 22px;
}

.manual-groups {
  display: grid;
  gap: 14px;
}

.feature-group {
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid rgba(146,182,255,0.12);
  background: rgba(255,255,255,0.02);
}

.feature-group summary {
  list-style: none;
  cursor: pointer;
  padding: 18px 20px;
  position: relative;
}

.feature-group summary::-webkit-details-marker {
  display: none;
}

.feature-group summary::after {
  content: "+";
  position: absolute;
  top: 18px;
  right: 20px;
  color: var(--muted);
  font-size: 1.15rem;
  font-weight: 800;
}

.feature-group[open] summary::after {
  content: "–";
}

.feature-group-summary h4 {
  margin: 0 0 6px;
  font-size: 1rem;
}

.feature-group-summary p {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
  font-size: 0.9rem;
  max-width: calc(100% - 80px);
}

.feature-group-count {
  display: inline-block;
  margin-top: 10px;
  color: #dce7f8;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(146,182,255,0.1);
}

.feature-group-grid {
  padding: 0 18px 18px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.field-card {
  display: grid;
  gap: 8px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(146,182,255,0.08);
}

.field-card-label {
  font-size: 0.9rem;
  font-weight: 700;
}

.field-card input {
  width: 100%;
  padding: 13px 14px;
  border-radius: 14px;
  border: 1px solid rgba(146,182,255,0.16);
  background: rgba(255,255,255,0.03);
  color: var(--text);
  outline: none;
}

.field-card input:focus {
  border-color: rgba(114,229,255,0.42);
  box-shadow: 0 0 0 3px rgba(114,229,255,0.08);
}

.field-card-note {
  color: var(--muted);
  font-size: 0.8rem;
  line-height: 1.6;
}

.prediction-wrap {
  padding: 22px;
}

.prediction-wrap.risk {
  border-color: rgba(255,139,153,0.2);
  box-shadow: 0 18px 44px rgba(255,139,153,0.08);
}

.prediction-wrap.ok {
  border-color: rgba(123,241,191,0.18);
  box-shadow: 0 18px 44px rgba(123,241,191,0.08);
}

.prediction-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
}

.prediction-head h4 {
  margin: 8px 0 10px;
  font-size: 1.4rem;
  letter-spacing: -0.03em;
}

.prediction-head p {
  margin: 0;
  color: var(--muted);
  line-height: 1.8;
  max-width: 780px;
}

.confidence {
  min-width: 155px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(146,182,255,0.12);
  text-align: center;
}

.confidence span {
  display: block;
  color: var(--muted);
  font-size: 0.82rem;
  margin-bottom: 8px;
}

.confidence strong {
  font-size: 1.72rem;
}

.bar-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.bar-card {
  padding: 16px;
  border-radius: 18px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(146,182,255,0.12);
}

.bar-card .top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.track {
  width: 100%;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255,255,255,0.06);
}

.fill {
  height: 100%;
  border-radius: inherit;
}

.fill.risk {
  background: linear-gradient(90deg, #ff99b4, #ff7d93);
}

.fill.ok {
  background: linear-gradient(90deg, #7bf1bf, #72e5ff);
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.result-item {
  padding: 14px;
  border-radius: 16px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(146,182,255,0.1);
}

.result-item span {
  display: block;
  color: var(--muted);
  font-size: 0.82rem;
  margin-bottom: 8px;
}

.insight-grid {
  display: grid;
  grid-template-columns: 0.98fr 1.02fr;
  gap: 16px;
}

.insight-card {
  padding: 22px;
}

.insight-card h4 {
  margin: 0 0 14px;
  font-size: 1.08rem;
}

.metric-list,
.feature-list {
  display: grid;
  gap: 12px;
}

.metric-row,
.feature-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(146,182,255,0.1);
}

.metric-row span,
.feature-row span {
  color: #dce7f8;
}

.metric-row strong,
.feature-row strong {
  white-space: nowrap;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.info-card {
  padding: 22px;
}

.info-card h4 {
  margin: 0 0 10px;
  font-size: 1.06rem;
}

.info-card p {
  margin: 0;
  color: var(--muted);
  line-height: 1.8;
}

.faq-grid {
  display: grid;
  gap: 14px;
}

.faq-item {
  padding: 0;
  overflow: hidden;
}

.faq-item summary {
  list-style: none;
  cursor: pointer;
  padding: 18px 20px;
  font-weight: 700;
  position: relative;
}

.faq-item summary::-webkit-details-marker {
  display: none;
}

.faq-item summary::after {
  content: "+";
  position: absolute;
  right: 20px;
  top: 16px;
  color: var(--muted);
  font-size: 1.1rem;
  font-weight: 800;
}

.faq-item[open] summary::after {
  content: "–";
}

.faq-item p {
  margin: 0;
  padding: 0 20px 18px;
  color: var(--muted);
  line-height: 1.8;
}

.portfolio-panel {
  padding: 24px;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 18px;
}

.portfolio-panel h4 {
  margin: 10px 0 10px;
  font-size: 1.34rem;
  letter-spacing: -0.03em;
}

.portfolio-panel p {
  margin: 0;
  color: var(--muted);
  line-height: 1.82;
}

.portfolio-meta {
  display: grid;
  gap: 14px;
}

.portfolio-chip {
  padding: 18px;
  border-radius: 18px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(146,182,255,0.1);
}

.portfolio-chip span {
  display: block;
  color: var(--muted);
  font-size: 0.82rem;
  margin-bottom: 8px;
}

.footer-note {
  padding: 26px 0 42px;
  color: var(--muted);
  font-size: 0.92rem;
  line-height: 1.8;
  text-align: center;
}

.loading-state,
.error-state {
  padding: 18px;
  border-radius: 18px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(146,182,255,0.12);
  color: var(--muted);
}

@media (max-width: 1220px) {
  .hero,
  .overview-grid,
  .workspace-shell,
  .insight-grid,
  .portfolio-panel {
    grid-template-columns: 1fr;
  }

  .workspace-left {
    position: static;
    top: auto;
  }

  .hero-strip,
  .command-grid,
  .overview-stack,
  .feature-group-grid,
  .bar-grid,
  .result-grid,
  .info-grid,
  .sample-grid,
  .utility-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 860px) {
  .topbar {
    border-radius: 28px;
    align-items: start;
    flex-direction: column;
  }

  .nav {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .hero-copy,
  .hero-side,
  .workspace-card,
  .manual-shell,
  .insight-card,
  .protocol-card,
  .portfolio-panel,
  .utility-card {
    padding: 20px;
  }

  .hero-copy h2 {
    max-width: 100%;
  }

  .hero-strip,
  .command-grid,
  .overview-stack,
  .feature-group-grid,
  .bar-grid,
  .result-grid,
  .info-grid,
  .sample-grid,
  .utility-grid {
    grid-template-columns: 1fr;
  }

  .prediction-head,
  .section-head,
  .card-head,
  .sample-top,
  .command-head,
  .signal-head {
    flex-direction: column;
    align-items: start;
  }

  .feature-group-summary p {
    max-width: 100%;
  }
}
`;

function getFeatureMeta(name) {
  return (
    FEATURE_META[name] || {
      label: name,
      note: "Screening model input",
      group: "Other features",
    }
  );
}

function formatPercent(value) {
  return `${(Number(value) * 100).toFixed(1)}%`;
}

function formatValue(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  if (Math.abs(num) >= 100) return num.toFixed(2);
  if (Math.abs(num) >= 1) return num.toFixed(4);
  return num.toFixed(5);
}

function explainPrediction(probability) {
  if (probability >= 0.8) {
    return "The screening model identifies a strong Parkinsonian voice-pattern signal in the submitted biomarker profile.";
  }
  if (probability >= 0.6) {
    return "The screening model identifies a moderate Parkinsonian voice-pattern signal and suggests closer clinical review would be reasonable.";
  }
  if (probability >= 0.4) {
    return "The screening output is relatively balanced, so the estimate should be interpreted with caution and context.";
  }
  if (probability >= 0.2) {
    return "The submitted profile shows a comparatively lower Parkinsonian voice-pattern signal.";
  }
  return "The submitted profile shows a low Parkinsonian voice-pattern signal within this screening workflow.";
}

function FeatureGroup({
  groupName,
  description,
  features,
  manualValues,
  onInputChange,
  defaultOpen = false,
}) {
  return (
    <details className="feature-group" open={defaultOpen}>
      <summary className="feature-group-summary">
        <h4>{groupName}</h4>
        <p>{description}</p>
        <span className="feature-group-count">{features.length} fields</span>
      </summary>

      <div className="feature-group-grid">
        {features.map((feature) => {
          const meta = getFeatureMeta(feature);
          return (
            <label className="field-card" key={feature}>
              <span className="field-card-label">{meta.label}</span>
              <input
                type="number"
                step="any"
                value={manualValues[feature] ?? ""}
                onChange={(event) => onInputChange(feature, event.target.value)}
                placeholder={`Enter ${meta.label.toLowerCase()}`}
              />
              <span className="field-card-note">
                {meta.note} · {feature}
              </span>
            </label>
          );
        })}
      </div>
    </details>
  );
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || "Request failed");
  }

  return response.json();
}

export default function App() {
  const [summary, setSummary] = useState(null);
  const [datasetName, setDatasetName] = useState("dataset1");
  const [rowIndex, setRowIndex] = useState(0);
  const [sample, setSample] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [apiStatus, setApiStatus] = useState({
    label: "Connecting...",
    tone: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState({
    sample: false,
    predictSample: false,
    fill: false,
    predictManual: false,
  });
  const [manualValues, setManualValues] = useState({});

  const rowMax = summary?.datasets?.[datasetName]?.rows
    ? Math.max(0, summary.datasets[datasetName].rows - 1)
    : 0;

  const groupedFeatures = useMemo(() => {
    if (!summary?.features) return [];

    const grouped = {};
    for (const feature of summary.features) {
      const meta = getFeatureMeta(feature);
      const group = meta.group || "Other features";
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(feature);
    }

    return GROUP_ORDER.filter((group) => grouped[group]).map((group) => ({
      group,
      description: GROUP_DESCRIPTIONS[group] || "Grouped model inputs.",
      features: grouped[group],
    }));
  }, [summary]);

  useEffect(() => {
    const initialize = async () => {
      try {
        setError("");
        const [health, summaryData] = await Promise.all([
          api("/health"),
          api("/api/summary"),
        ]);

        if (health?.status === "ok") {
          setApiStatus({ label: "Backend online", tone: "online" });
        }

        setSummary(summaryData);

        const initialValues = {};
        (summaryData.features || []).forEach((feature) => {
          initialValues[feature] = "";
        });
        setManualValues(initialValues);

        const initialSample = await api(
          `/api/sample?dataset_name=dataset1&row_index=0`
        );
        setSample(initialSample);
      } catch (err) {
        setApiStatus({ label: "Backend offline", tone: "offline" });
        setError(err.message || "Unable to connect to the API.");
      }
    };

    initialize();
  }, []);

  const handleLoadSample = async () => {
    try {
      setBusy((prev) => ({ ...prev, sample: true }));
      setError("");
      const data = await api(
        `/api/sample?dataset_name=${encodeURIComponent(
          datasetName
        )}&row_index=${rowIndex}`
      );
      setSample(data);
    } catch (err) {
      setError(err.message || "Failed to load the selected record.");
    } finally {
      setBusy((prev) => ({ ...prev, sample: false }));
    }
  };

  const handlePredictSample = async () => {
    try {
      setBusy((prev) => ({ ...prev, predictSample: true }));
      setError("");
      const result = await api("/api/predict/sample", {
        method: "POST",
        body: JSON.stringify({
          dataset_name: datasetName,
          row_index: Number(rowIndex),
        }),
      });
      setPrediction({ ...result, mode: "Sample-based screening" });
    } catch (err) {
      setError(err.message || "Failed to run sample-based screening.");
    } finally {
      setBusy((prev) => ({ ...prev, predictSample: false }));
    }
  };

  const handleCopyFromSample = async () => {
    try {
      setBusy((prev) => ({ ...prev, fill: true }));
      setError("");

      let sourceSample = sample;
      if (!sourceSample) {
        sourceSample = await api(
          `/api/sample?dataset_name=${encodeURIComponent(
            datasetName
          )}&row_index=${rowIndex}`
        );
        setSample(sourceSample);
      }

      setManualValues((prev) => ({
        ...prev,
        ...sourceSample.features,
      }));
    } catch (err) {
      setError(err.message || "Failed to copy values from the sample.");
    } finally {
      setBusy((prev) => ({ ...prev, fill: false }));
    }
  };

  const handlePredictManual = async () => {
    try {
      setBusy((prev) => ({ ...prev, predictManual: true }));
      setError("");

      const features = {};
      for (const key of Object.keys(manualValues)) {
        if (manualValues[key] === "" || manualValues[key] === null) {
          throw new Error(`Missing value for ${getFeatureMeta(key).label}`);
        }
        features[key] = Number(manualValues[key]);
      }

      const result = await api("/api/predict/manual", {
        method: "POST",
        body: JSON.stringify({ features }),
      });

      setPrediction({ ...result, mode: "Manual biomarker analysis" });
    } catch (err) {
      setError(err.message || "Failed to run manual biomarker analysis.");
    } finally {
      setBusy((prev) => ({ ...prev, predictManual: false }));
    }
  };

  const topFeatures = summary?.deployed_model?.top_features || [];
  const model = summary?.deployed_model;

  const riskProbability = Number(prediction?.parkinsons_probability || 0);
  const healthyProbability = Number(prediction?.healthy_probability || 0);
  const confidence = Math.max(riskProbability, healthyProbability);
  const predictionTone = prediction?.prediction === 1 ? "risk" : "ok";

  return (
    <>
      <style>{styles}</style>

      <div className="app-shell">
        <div className="bg-grid" />
        <div className="bg-orb" />
        <div className="bg-orb-two" />
        <div className="bg-orb-three" />

        <div className="container">
          <header className="topbar">
            <div className="brand">
              <div className="brand-mark">PV</div>
              <div className="brand-copy">
                <h1>Parkinson’s Voice Biomarker Dashboard</h1>
                <p>Ultra-premium clinical screening interface</p>
              </div>
            </div>

            <nav className="nav">
              <a href="#overview">Overview</a>
              <a href="#workspace">Workspace</a>
              <a href="#insights">Insights</a>
              <a href="#faq">FAQ</a>
            </nav>

            <div className={`status-pill ${apiStatus.tone}`}>{apiStatus.label}</div>
          </header>

          <section className="hero">
            <div className="panel hero-copy">
              <div className="kicker">Clinical voice biomarker platform</div>

              <div className="hero-trust-row">
                <span>Neurology-oriented UX</span>
                <span>Probability-guided screening</span>
                <span>Live API connectivity</span>
              </div>

              <h2>
                Voice biomarker intelligence
                <br />
                for Parkinsonian screening
              </h2>

              <p className="lead">
                A refined clinical interface for reviewing acoustic biomarkers,
                navigating structured screening workflows, and presenting model
                output with the clarity of a serious health-technology product
                rather than a plain academic demo.
              </p>

              <div className="hero-actions">
                <a className="btn primary" href="#workspace">
                  Launch screening workspace
                </a>
                <a className="btn secondary" href="#insights">
                  Review model insights
                </a>
              </div>

              <div className="hero-strip">
                <div className="hero-metric">
                  <span>Validation accuracy</span>
                  <strong>{model ? formatPercent(model.accuracy) : "--"}</strong>
                </div>

                <div className="hero-metric">
                  <span>Biomarker variables</span>
                  <strong>{summary?.features?.length ?? "--"}</strong>
                </div>

                <div className="hero-metric">
                  <span>Interaction modes</span>
                  <strong>Sample + manual</strong>
                </div>
              </div>

              <div className="note">
                Educational demonstration only. This interface is not a
                diagnostic device and should not replace neurological
                examination, formal speech evaluation, or clinical judgment.
              </div>
            </div>

            <div className="panel hero-side">
              <div className="command-head">
                <div>
                  <div className="command-kicker">Screening command center</div>
                  <h3>Operational overview</h3>
                </div>

                <div className={`live-chip ${apiStatus.tone}`}>
                  {apiStatus.label}
                </div>
              </div>

              <div className="command-grid">
                <div className="command-card accent">
                  <span>Model status</span>
                  <strong>{model?.model_name || "Ensemble classifier"}</strong>
                  <p>Premium presentation layer with live backend scoring</p>
                </div>

                <div className="command-card">
                  <span>Acoustic domains</span>
                  <strong>5 groups</strong>
                  <p>Frequency, jitter, shimmer, noise, and nonlinear dynamics</p>
                </div>

                <div className="command-card">
                  <span>Primary output</span>
                  <strong>Risk probability</strong>
                  <p>Confidence-guided classification view for rapid interpretation</p>
                </div>

                <div className="command-card">
                  <span>Workflow mode</span>
                  <strong>Interactive</strong>
                  <p>Record inspection, manual biomarker entry, and live scoring</p>
                </div>
              </div>

              <div className="signal-panel">
                <div className="signal-head">
                  <span>Signal morphology preview</span>
                  <span className="wave-badge">Live waveform aesthetic</span>
                </div>

                <div className="wave-box">
                  <div className="wave one">
                    <svg viewBox="0 0 600 120" fill="none">
                      <path
                        d="M0 62C40 62 40 18 80 18C120 18 120 98 160 98C200 98 200 20 240 20C280 20 280 94 320 94C360 94 360 30 400 30C440 30 440 82 480 82C520 82 520 38 560 38C590 38 600 56 600 56"
                        stroke="url(#g1)"
                        strokeWidth="5"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="g1" x1="0" y1="0" x2="600" y2="0">
                          <stop stopColor="#72E5FF" />
                          <stop offset="1" stopColor="#9E8BFF" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  <div className="wave two">
                    <svg viewBox="0 0 600 120" fill="none">
                      <path
                        d="M0 70C35 70 45 34 80 34C125 34 125 102 170 102C205 102 210 42 252 42C295 42 300 96 342 96C385 96 386 18 430 18C472 18 478 88 522 88C560 88 566 54 600 54"
                        stroke="#79B8FF"
                        strokeWidth="4"
                        strokeLinecap="round"
                        opacity="0.75"
                      />
                    </svg>
                  </div>

                  <div className="wave three">
                    <svg viewBox="0 0 600 120" fill="none">
                      <path
                        d="M0 80C48 80 42 50 88 50C130 50 138 108 176 108C220 108 226 24 266 24C310 24 318 80 362 80C405 80 412 44 454 44C496 44 506 92 548 92C580 92 592 66 600 66"
                        stroke="#FF99B4"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        opacity="0.7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="block" id="overview">
            <div className="section-head">
              <div>
                <div className="eyebrow">Overview</div>
                <h3>Built to feel premium, clinical, and product-grade</h3>
                <p className="section-copy">
                  This interface frames the project like a polished health-tech
                  product: clear medical language, structured screening flow,
                  strong visual hierarchy, and careful interpretation.
                </p>
              </div>
            </div>

            <div className="overview-grid">
              <div className="overview-stack">
                <div className="overview-card">
                  <div className="num">01</div>
                  <h4>Clinical framing</h4>
                  <p>
                    Uses terminology like voice biomarkers, screening signal,
                    harmonicity, nonlinear dynamics, and model confidence.
                  </p>
                </div>

                <div className="overview-card">
                  <div className="num">02</div>
                  <h4>Guided workflow</h4>
                  <p>
                    Supports both record-based inspection and manual biomarker
                    entry in one smooth workspace.
                  </p>
                </div>

                <div className="overview-card">
                  <div className="num">03</div>
                  <h4>Interpretability</h4>
                  <p>
                    Results are shown with probability bars, context-rich wording,
                    and structured output cards.
                  </p>
                </div>

                <div className="overview-card">
                  <div className="num">04</div>
                  <h4>Presentation quality</h4>
                  <p>
                    Premium visual design, glass surfaces, motion accents, and
                    polished composition make the site portfolio-ready.
                  </p>
                </div>
              </div>

              <div className="protocol-card">
                <div className="eyebrow">Screening protocol</div>
                <h4>How the interface is intended to be used</h4>
                <p>
                  The workflow is designed to feel intuitive for reviewers,
                  faculty, recruiters, or clients who want to understand both
                  the prediction experience and the product presentation.
                </p>

                <div className="protocol-list">
                  <div className="protocol-item">
                    <span>Step 1</span>
                    <strong>Select a stored voice record or dataset source</strong>
                  </div>

                  <div className="protocol-item">
                    <span>Step 2</span>
                    <strong>Review the biomarker preview and acoustic values</strong>
                  </div>

                  <div className="protocol-item">
                    <span>Step 3</span>
                    <strong>Run the model or enter a manual biomarker profile</strong>
                  </div>

                  <div className="protocol-item">
                    <span>Step 4</span>
                    <strong>Interpret probability, confidence, and feature context</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="block" id="workspace">
            <div className="section-head">
              <div>
                <div className="eyebrow">Workspace</div>
                <h3>Run a voice-based screening estimate</h3>
                <p className="section-copy">
                  The left side now stays visible while you move through the
                  larger biomarker form, so the page feels intentional instead
                  of empty.
                </p>
              </div>
            </div>

            {error ? <div className="error-state">{error}</div> : null}

            <div className="workspace-shell">
              <div className="workspace-left">
                <div className="workspace-card">
                  <div className="card-head">
                    <div>
                      <h4>Sample-based screening</h4>
                      <p>
                        Select a dataset and record index, then load the preview
                        and generate a screening result.
                      </p>
                    </div>
                    <div className="helper-badge">Sticky review panel</div>
                  </div>

                  <div className="field-stack">
                    <div className="field-block">
                      <label className="field-label">Dataset source</label>
                      <select
                        className="select"
                        value={datasetName}
                        onChange={(e) => {
                          setDatasetName(e.target.value);
                          setRowIndex(0);
                        }}
                      >
                        <option value="dataset1">Dataset 1 · original records</option>
                        <option value="dataset2">Dataset 2 · comparison records</option>
                      </select>
                      <div className="field-note">
                        Select which stored speech record collection you want to inspect.
                      </div>
                    </div>

                    <div className="field-block">
                      <label className="field-label">Selected record</label>
                      <input
                        className="range"
                        type="range"
                        min="0"
                        max={rowMax}
                        value={rowIndex}
                        onChange={(e) => setRowIndex(Number(e.target.value))}
                      />
                      <div className="row-label">
                        Record {rowIndex} of {rowMax}
                      </div>
                    </div>
                  </div>

                  <div className="action-row">
                    <button
                      className="btn secondary"
                      onClick={handleLoadSample}
                      disabled={busy.sample}
                    >
                      {busy.sample ? "Loading..." : "Load record"}
                    </button>

                    <button
                      className="btn primary"
                      onClick={handlePredictSample}
                      disabled={busy.predictSample}
                    >
                      {busy.predictSample ? "Running..." : "Run screening"}
                    </button>
                  </div>

                  <div className="sample-wrap">
                    {sample ? (
                      <div className="sample-card">
                        <div className="sample-top">
                          <div>
                            <div className="title">{sample.name}</div>
                            <div className="sub">
                              Loaded voice sample preview with selected biomarker values.
                            </div>
                          </div>

                          <div
                            className={`badge ${
                              sample.actual_status === 1 ? "risk" : "ok"
                            }`}
                          >
                            {sample.actual_status === 1
                              ? "Dataset label: Parkinson's"
                              : "Dataset label: Healthy"}
                          </div>
                        </div>

                        <div className="sample-grid">
                          {Object.entries(sample.features)
                            .slice(0, 8)
                            .map(([feature, value]) => (
                              <div className="sample-metric" key={feature}>
                                <span>{getFeatureMeta(feature).label}</span>
                                <strong>{formatValue(value)}</strong>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <div className="empty-card">
                        {summary ? "No record loaded yet." : "Waiting for backend data..."}
                      </div>
                    )}
                  </div>
                </div>

                <div className="utility-card">
                  <h4>Clinical quick view</h4>
                  <p>
                    Supporting information stays visible while the biomarker form
                    extends downward on the right.
                  </p>

                  <div className="utility-grid">
                    <div className="utility-pill">
                      <span>Accuracy</span>
                      <strong>{model ? formatPercent(model.accuracy) : "--"}</strong>
                    </div>
                    <div className="utility-pill">
                      <span>Top features</span>
                      <strong>{topFeatures.length || "--"}</strong>
                    </div>
                    <div className="utility-pill">
                      <span>Inputs</span>
                      <strong>{summary?.features?.length ?? "--"}</strong>
                    </div>
                    <div className="utility-pill">
                      <span>Status</span>
                      <strong>{apiStatus.label}</strong>
                    </div>
                  </div>
                </div>

                <div className="utility-card">
                  <h4>Workflow guidance</h4>
                  <p>
                    Load a sample first, then copy those values into the manual
                    form to create faster custom test runs with less typing.
                  </p>

                  <div className="action-row" style={{ marginTop: 0 }}>
                    <button
                      className="btn secondary"
                      onClick={handleCopyFromSample}
                      disabled={busy.fill}
                    >
                      {busy.fill ? "Copying..." : "Copy loaded sample"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="workspace-right">
                <div className="manual-shell">
                  <div className="card-head">
                    <div>
                      <h4>Manual biomarker analysis</h4>
                      <p>
                        Enter or adjust the speech biomarker values manually for a
                        customized model run. Groups are collapsible now so the
                        interface feels cleaner and more premium.
                      </p>
                    </div>
                    <div className="helper-badge">Custom input mode</div>
                  </div>

                  <div className="action-row" style={{ marginTop: 0, marginBottom: 18 }}>
                    <button
                      className="btn primary"
                      onClick={handlePredictManual}
                      disabled={busy.predictManual}
                    >
                      {busy.predictManual ? "Analyzing..." : "Analyze manual input"}
                    </button>
                  </div>

                  {!summary ? (
                    <div className="loading-state">Loading biomarker structure...</div>
                  ) : (
                    <div className="manual-groups">
                      {groupedFeatures.map(({ group, description, features }, index) => (
                        <FeatureGroup
                          key={group}
                          groupName={group}
                          description={description}
                          features={features}
                          manualValues={manualValues}
                          onInputChange={(feature, value) =>
                            setManualValues((prev) => ({
                              ...prev,
                              [feature]: value,
                            }))
                          }
                          defaultOpen={index < 2}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {prediction ? (
                  <div className={`prediction-wrap ${predictionTone}`}>
                    <div className="prediction-head">
                      <div>
                        <div className="eyebrow">Screening output</div>
                        <h4>
                          {prediction.prediction === 1
                            ? "Elevated Parkinsonian voice-pattern signal"
                            : "Lower Parkinsonian voice-pattern signal"}
                        </h4>
                        <p>{explainPrediction(riskProbability)}</p>
                      </div>

                      <div className="confidence">
                        <span>Model confidence</span>
                        <strong>{formatPercent(confidence)}</strong>
                      </div>
                    </div>

                    <div className="bar-grid">
                      <div className="bar-card">
                        <div className="top">
                          <span>Parkinsonian signal probability</span>
                          <strong>{formatPercent(riskProbability)}</strong>
                        </div>
                        <div className="track">
                          <div
                            className="fill risk"
                            style={{ width: `${riskProbability * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="bar-card">
                        <div className="top">
                          <span>Healthy-pattern probability</span>
                          <strong>{formatPercent(healthyProbability)}</strong>
                        </div>
                        <div className="track">
                          <div
                            className="fill ok"
                            style={{ width: `${healthyProbability * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="result-grid">
                      <div className="result-item">
                        <span>Interpretation</span>
                        <strong>
                          {prediction.prediction === 1
                            ? "Higher-risk screening output"
                            : "Lower-risk screening output"}
                        </strong>
                      </div>

                      <div className="result-item">
                        <span>Mode used</span>
                        <strong>{prediction.mode}</strong>
                      </div>

                      <div className="result-item">
                        <span>Dataset label</span>
                        <strong>
                          {typeof prediction.actual_status === "number"
                            ? prediction.actual_status === 1
                              ? "Parkinson's"
                              : "Healthy"
                            : "Not provided"}
                        </strong>
                      </div>

                      <div className="result-item">
                        <span>Voice sample</span>
                        <strong>{prediction.name || "Manual input set"}</strong>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="block" id="insights">
            <div className="section-head">
              <div>
                <div className="eyebrow">Insights</div>
                <h3>Performance summary and influential biomarkers</h3>
                <p className="section-copy">
                  A compact clinical-style view of model performance and the
                  voice measures contributing most strongly to screening output.
                </p>
              </div>
            </div>

            <div className="insight-grid">
              <div className="insight-card">
                <h4>Performance metrics</h4>
                <div className="metric-list">
                  <div className="metric-row">
                    <span>Accuracy</span>
                    <strong>{model ? formatPercent(model.accuracy) : "--"}</strong>
                  </div>
                  <div className="metric-row">
                    <span>Precision</span>
                    <strong>{model ? formatPercent(model.precision) : "--"}</strong>
                  </div>
                  <div className="metric-row">
                    <span>Recall</span>
                    <strong>{model ? formatPercent(model.recall) : "--"}</strong>
                  </div>
                  <div className="metric-row">
                    <span>F1 score</span>
                    <strong>{model ? formatPercent(model.f1) : "--"}</strong>
                  </div>
                  <div className="metric-row">
                    <span>ROC AUC</span>
                    <strong>{model ? formatPercent(model.roc_auc) : "--"}</strong>
                  </div>
                  <div className="metric-row">
                    <span>Deployed model</span>
                    <strong>{model?.model_name || "Unavailable"}</strong>
                  </div>
                </div>
              </div>

              <div className="insight-card">
                <h4>Top contributing features</h4>
                <div className="feature-list">
                  {topFeatures.length ? (
                    topFeatures.map((item) => (
                      <div className="feature-row" key={item.name}>
                        <span>{getFeatureMeta(item.name).label}</span>
                        <strong>{(item.importance * 100).toFixed(2)}%</strong>
                      </div>
                    ))
                  ) : (
                    <div className="loading-state">
                      Feature importance will appear here when available.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="info-grid">
              <div className="info-card">
                <h4>How to read the output</h4>
                <p>
                  A higher Parkinsonian probability means the voice feature
                  profile more closely resembles records labeled as Parkinson’s
                  in the training data.
                </p>
              </div>

              <div className="info-card">
                <h4>Why confidence matters</h4>
                <p>
                  Confidence gives a quick signal of how strongly the model
                  leans toward one class. Lower confidence suggests more overlap
                  between possible outcomes.
                </p>
              </div>

              <div className="info-card">
                <h4>Why this feels stronger</h4>
                <p>
                  It shows not only the model itself, but your ability to frame
                  technical results as a polished product experience.
                </p>
              </div>
            </div>
          </section>

          <section className="block" id="faq">
            <div className="section-head">
              <div>
                <div className="eyebrow">FAQ</div>
                <h3>Key questions a reviewer may ask immediately</h3>
                <p className="section-copy">
                  These quick answers make the interface feel clearer and more
                  complete without overwhelming people in raw technical wording.
                </p>
              </div>
            </div>

            <div className="faq-grid">
              <details className="faq-item" open>
                <summary>Is this a medical diagnosis tool?</summary>
                <p>
                  No. This is an educational machine learning demonstration. It
                  estimates whether a voice feature profile is closer to records
                  labeled as Parkinson’s in the training data, but it is not a
                  substitute for clinical diagnosis.
                </p>
              </details>

              <details className="faq-item">
                <summary>What kind of inputs does the model use?</summary>
                <p>
                  The model uses biomedical speech features including frequency,
                  jitter, shimmer, noise-to-harmonics characteristics, and
                  nonlinear signal measures derived from recorded voice samples.
                </p>
              </details>

              <details className="faq-item">
                <summary>Why show both sample mode and manual mode?</summary>
                <p>
                  Sample mode helps visitors test real records quickly. Manual
                  mode shows deeper control and makes the application feel more
                  like a full product rather than a static demo.
                </p>
              </details>

              <details className="faq-item">
                <summary>Why is this useful in a portfolio?</summary>
                <p>
                  It demonstrates model integration, frontend design, API use,
                  medical-domain framing, and user-friendly presentation — not
                  just notebook experimentation.
                </p>
              </details>
            </div>
          </section>

          <section className="block">
            <div className="portfolio-panel">
              <div>
                <div className="eyebrow">Portfolio summary</div>
                <h4>Project copy for your main portfolio</h4>
                <p>
                  Parkinson’s Voice Biomarker Dashboard is an ultra-premium
                  clinical-style machine learning interface that estimates
                  Parkinsonian voice-pattern risk using biomedical speech
                  features and an ensemble classifier served through FastAPI.
                </p>
              </div>

              <div className="portfolio-meta">
                <div className="portfolio-chip">
                  <span>Stack</span>
                  <strong>React · Vite · CSS · FastAPI · scikit-learn</strong>
                </div>

                <div className="portfolio-chip">
                  <span>Highlights</span>
                  <strong>
                    Premium UI · sticky workspace · live predictions · model
                    insights
                  </strong>
                </div>
              </div>
            </div>
          </section>

          <div className="footer-note">
            Designed as a portfolio-grade clinical dashboard for a voice
            biomarker screening workflow. It presents machine learning results
            professionally without pretending to be a real diagnostic product.
          </div>
        </div>
      </div>
    </>
  );
}