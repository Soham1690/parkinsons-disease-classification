import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "overview", label: "Overview" },
  { id: "workspace", label: "Workspace" },
  { id: "insights", label: "Insights" },
  { id: "faq", label: "FAQ" },
];

const FEATURE_META = {
  "MDVP:Fo(Hz)": {
    label: "Fundamental frequency",
    note: "Average vocal fold vibration frequency.",
    group: "Frequency measures",
  },
  "MDVP:Fhi(Hz)": {
    label: "Maximum frequency",
    note: "Upper frequency range of the recorded voice sample.",
    group: "Frequency measures",
  },
  "MDVP:Flo(Hz)": {
    label: "Minimum frequency",
    note: "Lower frequency range of the recorded voice sample.",
    group: "Frequency measures",
  },
  "MDVP:Jitter(%)": {
    label: "Jitter percentage",
    note: "Cycle-to-cycle variation in pitch period.",
    group: "Jitter and pitch stability",
  },
  "MDVP:Jitter(Abs)": {
    label: "Absolute jitter",
    note: "Absolute perturbation in pitch period.",
    group: "Jitter and pitch stability",
  },
  "MDVP:RAP": {
    label: "Relative average perturbation",
    note: "Short-term pitch perturbation metric.",
    group: "Jitter and pitch stability",
  },
  "MDVP:PPQ": {
    label: "Pitch perturbation quotient",
    note: "Pitch instability across adjacent cycles.",
    group: "Jitter and pitch stability",
  },
  "Jitter:DDP": {
    label: "Difference of differences of periods",
    note: "Derived pitch perturbation feature.",
    group: "Jitter and pitch stability",
  },
  "MDVP:Shimmer": {
    label: "Shimmer",
    note: "Cycle-to-cycle amplitude variation.",
    group: "Shimmer and amplitude stability",
  },
  "MDVP:Shimmer(dB)": {
    label: "Shimmer in dB",
    note: "Amplitude instability in decibel scale.",
    group: "Shimmer and amplitude stability",
  },
  "Shimmer:APQ3": {
    label: "APQ3",
    note: "Short-window amplitude perturbation quotient.",
    group: "Shimmer and amplitude stability",
  },
  "Shimmer:APQ5": {
    label: "APQ5",
    note: "Five-point amplitude perturbation quotient.",
    group: "Shimmer and amplitude stability",
  },
  "MDVP:APQ": {
    label: "APQ",
    note: "Longer-window amplitude perturbation quotient.",
    group: "Shimmer and amplitude stability",
  },
  "Shimmer:DDA": {
    label: "DDA",
    note: "Difference of differences of amplitudes.",
    group: "Shimmer and amplitude stability",
  },
  NHR: {
    label: "Noise-to-harmonics ratio",
    note: "Higher values may indicate noisier phonation.",
    group: "Noise and harmonicity",
  },
  HNR: {
    label: "Harmonics-to-noise ratio",
    note: "Higher values may indicate stronger harmonic voice quality.",
    group: "Noise and harmonicity",
  },
  RPDE: {
    label: "Recurrence period density entropy",
    note: "Nonlinear measure of vocal irregularity.",
    group: "Nonlinear dynamics",
  },
  DFA: {
    label: "Detrended fluctuation analysis",
    note: "Scaling measure of signal variability.",
    group: "Nonlinear dynamics",
  },
  spread1: {
    label: "Spread 1",
    note: "Nonlinear spread-derived vocal feature.",
    group: "Nonlinear dynamics",
  },
  spread2: {
    label: "Spread 2",
    note: "Secondary nonlinear spread feature.",
    group: "Nonlinear dynamics",
  },
  D2: {
    label: "Correlation dimension D2",
    note: "Complexity estimate of the voice signal.",
    group: "Nonlinear dynamics",
  },
  PPE: {
    label: "Pitch period entropy",
    note: "Entropy-based measure of pitch irregularity.",
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
    "Pitch and frequency-related descriptors derived from the recorded voice sample.",
  "Jitter and pitch stability":
    "Measures that reflect short-term instability in vocal fold timing and pitch period variation.",
  "Shimmer and amplitude stability":
    "Measures that describe amplitude fluctuation and cycle-to-cycle voice intensity instability.",
  "Noise and harmonicity":
    "Measures that describe breathiness, noise content, and harmonic signal structure.",
  "Nonlinear dynamics":
    "Advanced voice-signal descriptors capturing irregularity, entropy, and nonlinear complexity.",
  "Other features": "Additional model inputs.",
};

function getFeatureMeta(feature) {
  return (
    FEATURE_META[feature] || {
      label: feature,
      note: "Model input feature.",
      group: "Other features",
    }
  );
}

function formatPercent(value) {
  return `${(Number(value) * 100).toFixed(1)}%`;
}

function formatNumeric(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  if (Math.abs(num) >= 100) return num.toFixed(3);
  if (Math.abs(num) >= 1) return num.toFixed(4);
  return num.toFixed(5);
}

function getConfidenceLevel(confidence) {
  if (confidence >= 0.85) return "High";
  if (confidence >= 0.65) return "Moderate";
  return "Cautious";
}

function buildRiskNarrative(probability) {
  if (probability >= 0.8) {
    return "The model detects a strong Parkinsonian voice-pattern signal in this sample. This suggests the acoustic profile is closer to records labeled as Parkinson's within the training data.";
  }
  if (probability >= 0.6) {
    return "The model detects a moderate Parkinsonian voice-pattern signal. The screening output leans toward a Parkinsonian pattern, but it should still be interpreted cautiously.";
  }
  if (probability >= 0.4) {
    return "The model output is relatively balanced between the two classes. This indicates a lower separation margin, so the estimate should be treated with caution.";
  }
  if (probability >= 0.2) {
    return "The model detects a comparatively lower Parkinsonian voice-pattern signal. The acoustic profile is leaning more toward the healthy-labelled pattern in the training data.";
  }
  return "The model detects a low Parkinsonian voice-pattern signal. The sample is strongly aligned with the healthy-labelled pattern in the training data.";
}

function HeroVisualization({ summary }) {
  const accuracy = summary
    ? formatPercent(summary.deployed_model.accuracy)
    : "--";
  const features = summary ? summary.features.length : "--";

  return (
    <div className="hero-visual-stack">
      <div className="hero-monitor glass-panel">
        <div className="monitor-topline">
          <span className="monitor-chip">Live screening interface</span>
          <span className="monitor-chip neutral">Voice biomarker workflow</span>
        </div>

        <div className="monitor-grid">
          <div className="monitor-card accent-card">
            <div className="monitor-label">Model accuracy</div>
            <div className="monitor-value">{accuracy}</div>
            <div className="monitor-subtext">
              Ensemble classifier on held-out dataset split
            </div>
          </div>

          <div className="monitor-card">
            <div className="monitor-label">Biomarker inputs</div>
            <div className="monitor-value">{features}</div>
            <div className="monitor-subtext">
              Frequency, jitter, shimmer, noise, and nonlinear dynamics
            </div>
          </div>
        </div>

        <div className="wave-card">
          <div className="wave-head">
            <span>Voice signal profile</span>
            <span className="wave-badge">Screening mode</span>
          </div>
          <svg viewBox="0 0 640 180" className="wave-svg" aria-hidden="true">
            <defs>
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7dd3fc" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <path
              d="M0 90
                 C30 35, 60 20, 90 90
                 S150 160, 180 90
                 S240 20, 270 90
                 S330 160, 360 90
                 S420 20, 450 90
                 S510 160, 540 90
                 S600 25, 640 90"
              fill="none"
              stroke="url(#waveGradient)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M0 100
                 C40 130, 70 145, 100 100
                 S160 55, 190 100
                 S250 145, 280 100
                 S340 55, 370 100
                 S430 145, 460 100
                 S520 55, 550 100
                 S610 145, 640 100"
              fill="none"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <div className="hero-side-panels">
        <div className="mini-analytic-card glass-panel">
          <span className="mini-label">Clinical framing</span>
          <h4>Voice-based screening estimate</h4>
          <p>
            Designed to present biomedical speech features in a more usable,
            recruiter-friendly, and medically relevant interface.
          </p>
        </div>

        <div className="mini-analytic-card glass-panel">
          <span className="mini-label">Project value</span>
          <h4>Portfolio-ready product experience</h4>
          <p>
            Reworks a notebook-first ML project into a polished frontend that
            feels closer to a healthcare technology application.
          </p>
        </div>
      </div>
    </div>
  );
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
        <div>
          <h4>{groupName}</h4>
          <p>{description}</p>
        </div>
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
                placeholder={`Enter ${meta.label.toLowerCase()}`}
                onChange={(event) => onInputChange(feature, event.target.value)}
              />
              <span className="field-card-note">
                {meta.note} <em>{feature}</em>
              </span>
            </label>
          );
        })}
      </div>
    </details>
  );
}

function App() {
  const [summary, setSummary] = useState(null);
  const [sample, setSample] = useState(null);
  const [datasetName, setDatasetName] = useState("dataset1");
  const [rowIndex, setRowIndex] = useState(0);
  const [manualValues, setManualValues] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [apiState, setApiState] = useState({
    text: "Connecting...",
    tone: "",
  });
  const [loading, setLoading] = useState({
    summary: false,
    sample: false,
    samplePrediction: false,
    manualPrediction: false,
    copySample: false,
  });

  const features = summary?.features || [];

  const groupedFeatures = useMemo(() => {
    const grouped = {};

    features.forEach((feature) => {
      const meta = getFeatureMeta(feature);
      const group = meta.group || "Other features";
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(feature);
    });

    return GROUP_ORDER.filter((group) => grouped[group]).map((group) => ({
      name: group,
      description: GROUP_DESCRIPTIONS[group] || "Grouped model inputs.",
      features: grouped[group],
    }));
  }, [features]);

  const maxRow = useMemo(() => {
    if (!summary) return 0;
    return Math.max(0, summary.datasets[datasetName].rows - 1);
  }, [summary, datasetName]);

  const modelMetrics = useMemo(() => {
    if (!summary) return [];
    return [
      ["Accuracy", formatPercent(summary.deployed_model.accuracy)],
      ["Precision", formatPercent(summary.deployed_model.precision)],
      ["Recall", formatPercent(summary.deployed_model.recall)],
      ["F1 score", formatPercent(summary.deployed_model.f1)],
      ["ROC AUC", formatPercent(summary.deployed_model.roc_auc)],
      [
        "Confusion matrix",
        `${summary.deployed_model.confusion_matrix[0].join(", ")} · ${summary.deployed_model.confusion_matrix[1].join(", ")}`,
      ],
    ];
  }, [summary]);

  async function api(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.detail || "API request failed");
    }

    return response.json();
  }

  async function loadSummary() {
    setLoading((prev) => ({ ...prev, summary: true }));
    try {
      const data = await api("/api/summary");
      setSummary(data);
      setApiState({
        text: "API connected",
        tone: "online",
      });
    } catch (error) {
      console.error(error);
      setApiState({
        text: "Backend offline",
        tone: "offline",
      });
    } finally {
      setLoading((prev) => ({ ...prev, summary: false }));
    }
  }

  async function loadSample(targetDataset = datasetName, targetRow = rowIndex) {
    setLoading((prev) => ({ ...prev, sample: true }));
    try {
      const data = await api(
        `/api/sample?dataset_name=${encodeURIComponent(
          targetDataset
        )}&row_index=${targetRow}`
      );
      setSample(data);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading((prev) => ({ ...prev, sample: false }));
    }
  }

  async function runSamplePrediction() {
    setLoading((prev) => ({ ...prev, samplePrediction: true }));
    try {
      const result = await api("/api/predict/sample", {
        method: "POST",
        body: JSON.stringify({
          dataset_name: datasetName,
          row_index: Number(rowIndex),
        }),
      });

      setPrediction({
        ...result,
        modeLabel: "sample-based screening",
      });
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading((prev) => ({ ...prev, samplePrediction: false }));
    }
  }

  async function runManualPrediction() {
    try {
      const payload = {};
      for (const feature of features) {
        const value = manualValues[feature];
        if (value === undefined || value === "") {
          throw new Error(`Missing value for ${getFeatureMeta(feature).label}`);
        }
        payload[feature] = Number(value);
      }

      setLoading((prev) => ({ ...prev, manualPrediction: true }));

      const result = await api("/api/predict/manual", {
        method: "POST",
        body: JSON.stringify({ features: payload }),
      });

      setPrediction({
        ...result,
        modeLabel: "manual biomedical input",
      });
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading((prev) => ({ ...prev, manualPrediction: false }));
    }
  }

  function copyLoadedSampleToForm() {
    if (!sample) return;
    setLoading((prev) => ({ ...prev, copySample: true }));
    setManualValues(sample.features);
    setTimeout(() => {
      setLoading((prev) => ({ ...prev, copySample: false }));
    }, 250);
  }

  function updateManualValue(feature, value) {
    setManualValues((prev) => ({
      ...prev,
      [feature]: value,
    }));
  }

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    if (summary) {
      loadSample(datasetName, rowIndex);
    }
  }, [summary, datasetName, rowIndex]);

  const riskProbability = prediction
    ? Number(prediction.parkinsons_probability)
    : 0;
  const healthyProbability = prediction
    ? Number(prediction.healthy_probability)
    : 0;
  const confidence = Math.max(riskProbability, healthyProbability);
  const predictionTone =
    prediction?.prediction === 1 ? "risk" : prediction ? "success" : "";

  return (
    <div className="app-root">
      <div className="background-glow glow-a" />
      <div className="background-glow glow-b" />
      <div className="background-grid" />

      <div className="page-shell">
        <header className="topbar">
          <a className="brand-lockup" href="#home">
            <span className="brand-badge">PVSE</span>
            <div>
              <strong>Parkinson's Voice Screening Explorer</strong>
              <span>Medical-style ML frontend</span>
            </div>
          </a>

          <nav className="topnav">
            {NAV_ITEMS.map((item) => (
              <a key={item.id} href={`#${item.id}`}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className={`topbar-status ${apiState.tone || ""}`}>
            <span className="status-dot" />
            {apiState.text}
          </div>
        </header>

        <main>
          <section className="hero-section" id="home">
            <div className="hero-copy-panel">
              <div className="hero-kicker">Clinical machine learning interface</div>
              <h1>
                A more professional way to present your Parkinson's voice ML
                project
              </h1>
              <p className="hero-description">
                This frontend turns a notebook-first project into a much more
                credible medical-tech experience. It presents biomedical voice
                biomarkers, screening outputs, model confidence, and clinical
                caveats in a way that feels polished, clear, and easier for
                users to understand.
              </p>

              <div className="hero-badge-row">
                <span className="hero-badge">FastAPI-connected</span>
                <span className="hero-badge">React + Vite frontend</span>
                <span className="hero-badge">
                  Guided biomarker interpretation
                </span>
              </div>

              <div className="hero-actions">
                <a href="#workspace" className="cta-button primary">
                  Open screening workspace
                </a>
                <a href="#overview" className="cta-button secondary">
                  Explore platform overview
                </a>
              </div>

              <div className="hero-warning">
                Educational demonstration only. This application is not intended
                to diagnose Parkinson's disease or replace clinical assessment.
              </div>
            </div>

            <HeroVisualization summary={summary} />
          </section>

          <section className="content-section" id="overview">
            <div className="section-header">
              <span className="section-kicker">Platform overview</span>
              <h2>Built for clarity, credibility, and stronger presentation</h2>
              <p>
                The interface is designed to feel closer to a real digital
                health product while keeping the machine learning workflow easy
                to understand for visitors, faculty, recruiters, and clients.
              </p>
            </div>

            <div className="capability-grid">
              <article className="capability-card">
                <div className="capability-icon">01</div>
                <h3>Medical-style language</h3>
                <p>
                  Uses terms like voice biomarkers, Parkinsonian signal,
                  screening output, harmonicity, and nonlinear dynamics instead
                  of random generic portfolio text.
                </p>
              </article>

              <article className="capability-card">
                <div className="capability-icon">02</div>
                <h3>Clear user workflow</h3>
                <p>
                  Visitors can begin with a real record from the dataset, then
                  move to a more advanced manual biomarker analysis workflow.
                </p>
              </article>

              <article className="capability-card">
                <div className="capability-icon">03</div>
                <h3>Stronger result interpretation</h3>
                <p>
                  Results are shown with confidence, explanation, structured
                  output labels, and probability bars rather than raw numbers
                  alone.
                </p>
              </article>

              <article className="capability-card warning">
                <div className="capability-icon">04</div>
                <h3>Responsible framing</h3>
                <p>
                  The interface clearly communicates that the model is an
                  educational screening demonstration, not a diagnostic system.
                </p>
              </article>
            </div>
          </section>

          <section className="content-section" id="workspace">
            <div className="section-header split">
              <div>
                <span className="section-kicker">Screening workspace</span>
                <h2>Run an interactive voice-based screening estimate</h2>
                <p>
                  Start with a sample already stored in the dataset or enter the
                  full acoustic feature profile manually.
                </p>
              </div>

              <div className={`section-status ${apiState.tone || ""}`}>
                {apiState.text}
              </div>
            </div>

            <div className="workspace-grid">
              <article className="workspace-card">
                <div className="workspace-card-head">
                  <div>
                    <h3>Sample-based screening</h3>
                    <p>
                      Load a stored voice record and run the model on that
                      sample to preview screening output instantly.
                    </p>
                  </div>
                </div>

                <div className="field-stack">
                  <label className="input-field">
                    <span>Dataset source</span>
                    <select
                      value={datasetName}
                      onChange={(event) => {
                        setDatasetName(event.target.value);
                        setRowIndex(0);
                      }}
                    >
                      <option value="dataset1">
                        Dataset 1 · original records
                      </option>
                      <option value="dataset2">
                        Dataset 2 · comparison records
                      </option>
                    </select>
                  </label>

                  <label className="input-field">
                    <span>Selected record</span>
                    <input
                      type="range"
                      min="0"
                      max={maxRow}
                      value={rowIndex}
                      onChange={(event) =>
                        setRowIndex(Number(event.target.value))
                      }
                    />
                    <small>
                      Record {rowIndex} of {maxRow}
                    </small>
                  </label>
                </div>

                <div className="button-row">
                  <button
                    className="action-button secondary"
                    onClick={() => loadSample(datasetName, rowIndex)}
                    disabled={loading.sample}
                  >
                    {loading.sample ? "Loading record..." : "Load record"}
                  </button>

                  <button
                    className="action-button primary"
                    onClick={runSamplePrediction}
                    disabled={loading.samplePrediction}
                  >
                    {loading.samplePrediction
                      ? "Running screening..."
                      : "Run screening"}
                  </button>
                </div>

                <div className="sample-preview-shell">
                  {sample ? (
                    <>
                      <div className="sample-preview-head">
                        <div>
                          <span className="sample-note">Loaded voice sample</span>
                          <strong>{sample.name}</strong>
                        </div>

                        <span
                          className={`sample-label ${
                            sample.actual_status === 1 ? "risk" : "success"
                          }`}
                        >
                          Dataset label:{" "}
                          {sample.actual_status === 1 ? "Parkinson's" : "Healthy"}
                        </span>
                      </div>

                      <div className="sample-grid">
                        {Object.entries(sample.features)
                          .slice(0, 8)
                          .map(([feature, value]) => (
                            <div key={feature} className="data-chip">
                              <span>{getFeatureMeta(feature).label}</span>
                              <strong>{formatNumeric(value)}</strong>
                            </div>
                          ))}
                      </div>
                    </>
                  ) : (
                    <div className="empty-state">
                      No sample has been loaded yet.
                    </div>
                  )}
                </div>
              </article>

              <article className="workspace-card">
                <div className="workspace-card-head">
                  <div>
                    <h3>Manual biomedical input</h3>
                    <p>
                      Copy the currently loaded sample or enter biomarker values
                      manually to test a custom voice feature profile.
                    </p>
                  </div>
                </div>

                <div className="button-row compact">
                  <button
                    className="action-button secondary"
                    onClick={copyLoadedSampleToForm}
                    disabled={loading.copySample}
                  >
                    {loading.copySample ? "Copying..." : "Copy loaded sample"}
                  </button>

                  <button
                    className="action-button primary"
                    onClick={runManualPrediction}
                    disabled={loading.manualPrediction}
                  >
                    {loading.manualPrediction
                      ? "Analyzing..."
                      : "Analyze manual input"}
                  </button>
                </div>

                <div className="group-stack">
                  {groupedFeatures.map((group, index) => (
                    <FeatureGroup
                      key={group.name}
                      groupName={group.name}
                      description={group.description}
                      features={group.features}
                      manualValues={manualValues}
                      onInputChange={updateManualValue}
                      defaultOpen={index < 2}
                    />
                  ))}
                </div>
              </article>
            </div>

            {prediction && (
              <article className={`result-panel ${predictionTone}`}>
                <div className="result-panel-top">
                  <div>
                    <span className="section-kicker">Screening output</span>
                    <h3>
                      {prediction.prediction === 1
                        ? "Elevated Parkinsonian voice-pattern signal"
                        : "Lower Parkinsonian voice-pattern signal"}
                    </h3>
                    <p className="result-summary">
                      {buildRiskNarrative(riskProbability)} This result was
                      produced using {prediction.modeLabel}.
                    </p>
                  </div>

                  <div className="confidence-card">
                    <span>Confidence</span>
                    <strong>{formatPercent(confidence)}</strong>
                    <small>{getConfidenceLevel(confidence)} confidence</small>
                  </div>
                </div>

                <div className="probability-grid">
                  <div className="probability-card">
                    <div className="probability-head">
                      <span>Parkinsonian signal probability</span>
                      <strong>{formatPercent(riskProbability)}</strong>
                    </div>
                    <div className="progress-track">
                      <span
                        className="progress-fill"
                        style={{ width: `${riskProbability * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="probability-card">
                    <div className="probability-head">
                      <span>Healthy-pattern probability</span>
                      <strong>{formatPercent(healthyProbability)}</strong>
                    </div>
                    <div className="progress-track">
                      <span
                        className="progress-fill"
                        style={{ width: `${healthyProbability * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="metric-grid">
                  <div className="metric-pill">
                    <span>Interpretation</span>
                    <strong>
                      {prediction.prediction === 1
                        ? "Higher-risk screening output"
                        : "Lower-risk screening output"}
                    </strong>
                  </div>

                  <div className="metric-pill">
                    <span>Mode used</span>
                    <strong>{prediction.modeLabel}</strong>
                  </div>

                  {typeof prediction.actual_status === "number" && (
                    <div className="metric-pill">
                      <span>Dataset label</span>
                      <strong>
                        {prediction.actual_status === 1 ? "Parkinson's" : "Healthy"}
                      </strong>
                    </div>
                  )}

                  {prediction.name && (
                    <div className="metric-pill">
                      <span>Voice sample</span>
                      <strong>{prediction.name}</strong>
                    </div>
                  )}
                </div>
              </article>
            )}
          </section>

          <section className="content-section" id="insights">
            <div className="section-header">
              <span className="section-kicker">Model insights</span>
              <h2>Performance summary and feature contribution view</h2>
              <p>
                A cleaner interpretation layer showing the deployed model's
                main metrics and the most influential voice features.
              </p>
            </div>

            <div className="insight-grid">
              <article className="insight-card">
                <div className="insight-card-head">
                  <h3>Performance metrics</h3>
                  <p>Summary from the deployed ensemble model used by the interface.</p>
                </div>

                <div className="metric-list">
                  {modelMetrics.map(([name, value]) => (
                    <div className="metric-row" key={name}>
                      <span>{name}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </article>

              <article className="insight-card">
                <div className="insight-card-head">
                  <h3>Top contributing features</h3>
                  <p>
                    Acoustic features that had the highest relative importance
                    within the deployed classifier.
                  </p>
                </div>

                <div className="metric-list">
                  {summary?.deployed_model.top_features.map((item) => (
                    <div className="metric-row" key={item.name}>
                      <span>{getFeatureMeta(item.name).label}</span>
                      <strong>{(item.importance * 100).toFixed(2)}%</strong>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <div className="interpretation-grid">
              <article className="interpretation-card">
                <span className="interpretation-index">A</span>
                <h4>How to read the output</h4>
                <p>
                  A higher Parkinsonian probability means the voice feature
                  profile more closely resembles records labeled as Parkinson's
                  in the training data.
                </p>
              </article>

              <article className="interpretation-card">
                <span className="interpretation-index">B</span>
                <h4>Why confidence matters</h4>
                <p>
                  Confidence gives a quick sense of how strongly the model
                  leans toward one class. Lower confidence means more overlap
                  between the two predicted classes.
                </p>
              </article>

              <article className="interpretation-card">
                <span className="interpretation-index">C</span>
                <h4>Why this looks better in a portfolio</h4>
                <p>
                  It shows not just the model, but also your ability to present
                  results clearly, responsibly, and in a product-oriented way.
                </p>
              </article>
            </div>
          </section>

          <section className="content-section" id="faq">
            <div className="section-header">
              <span className="section-kicker">Frequently asked questions</span>
              <h2>Key points users may want to understand quickly</h2>
              <p>
                These answers help explain the screening demo without drowning
                users in raw technical language.
              </p>
            </div>

            <div className="faq-stack">
              <details className="faq-item" open>
                <summary>Is this a medical diagnosis tool?</summary>
                <p>
                  No. This is an educational machine learning demonstration.
                  It estimates whether a voice feature profile is closer to
                  records labeled as Parkinson's in the training data, but it is
                  not a substitute for clinical diagnosis.
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
                  It demonstrates model integration, frontend design, API usage,
                  medical-domain framing, and user-friendly presentation — not
                  just notebook experimentation.
                </p>
              </details>
            </div>
          </section>

          <section className="content-section compact">
            <div className="portfolio-panel">
              <div>
                <span className="section-kicker">Portfolio summary</span>
                <h2>Project copy for your main portfolio</h2>
                <p>
                  Parkinson's Voice Screening Explorer is a medical-style machine
                  learning frontend that estimates Parkinsonian voice-pattern
                  risk using biomedical speech features and an ensemble
                  classifier served through FastAPI.
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
                    Premium UI · guided workflow · live predictions · model
                    insights
                  </strong>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="site-footer">
          <div>
            <strong>Parkinson's Voice Screening Explorer</strong>
            <span>Professional medical-style ML frontend experience</span>
          </div>
          <p>
            Built as a portfolio-grade presentation layer for a voice-based
            Parkinson's screening demonstration.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;