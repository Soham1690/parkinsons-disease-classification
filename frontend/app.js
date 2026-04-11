const API_BASE = window.API_BASE || "http://127.0.0.1:8000";

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
  "NHR": {
    label: "Noise-to-harmonics ratio",
    note: "Higher values may indicate noisier phonation",
    group: "Noise and harmonicity",
  },
  "HNR": {
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
    "Core pitch-frequency descriptors from the recorded voice signal.",
  "Jitter and pitch stability":
    "Features related to short-term instability in vocal fold timing.",
  "Shimmer and amplitude stability":
    "Features related to short-term variation in signal amplitude.",
  "Noise and harmonicity":
    "Measures describing breathiness, noise content, and harmonic quality.",
  "Nonlinear dynamics":
    "Advanced descriptors of signal complexity and irregularity.",
  "Other features": "Additional model inputs.",
};

const state = {
  summary: null,
  sample: null,
};

const elements = {
  statGrid: document.getElementById("stat-grid"),
  apiStatus: document.getElementById("api-status"),
  datasetSelect: document.getElementById("dataset-select"),
  rowRange: document.getElementById("row-range"),
  rangeLabel: document.getElementById("range-label"),
  samplePreview: document.getElementById("sample-preview"),
  manualForm: document.getElementById("manual-form"),
  predictionOutput: document.getElementById("prediction-output"),
  metricList: document.getElementById("metric-list"),
  featureImportance: document.getElementById("feature-importance"),
  loadSample: document.getElementById("load-sample"),
  predictSample: document.getElementById("predict-sample"),
  fillFromSample: document.getElementById("fill-from-sample"),
  predictManual: document.getElementById("predict-manual"),
};

function getFeatureMeta(feature) {
  return FEATURE_META[feature] || {
    label: feature,
    note: "Model input feature",
    group: "Other features",
  };
}

function formatPercent(value) {
  return `${(Number(value) * 100).toFixed(1)}%`;
}

function formatValue(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  if (Math.abs(num) >= 100) return num.toFixed(3);
  if (Math.abs(num) >= 1) return num.toFixed(4);
  return num.toFixed(5);
}

function getConfidence(parkinsonsProbability, healthyProbability) {
  return Math.max(Number(parkinsonsProbability), Number(healthyProbability));
}

function explainPrediction(probability) {
  if (probability >= 0.8) {
    return "The model detects a strong Parkinsonian voice-pattern signal in this sample.";
  }
  if (probability >= 0.6) {
    return "The model detects a moderate Parkinsonian voice-pattern signal in this sample.";
  }
  if (probability >= 0.4) {
    return "The model output is relatively balanced, so this screening estimate should be interpreted cautiously.";
  }
  if (probability >= 0.2) {
    return "The model detects a comparatively lower Parkinsonian voice-pattern signal in this sample.";
  }
  return "The model detects a low Parkinsonian voice-pattern signal in this sample.";
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || "API request failed");
  }

  return response.json();
}

function setStatus(label, tone = "default") {
  elements.apiStatus.textContent = label;
  elements.apiStatus.className = "status-pill";

  if (tone === "online") {
    elements.apiStatus.classList.add("online");
  } else if (tone === "offline") {
    elements.apiStatus.classList.add("offline");
  }
}

function setButtonLoading(button, loading, text) {
  if (!button.dataset.originalText) {
    button.dataset.originalText = button.textContent;
  }

  button.disabled = loading;
  button.textContent = loading ? text : button.dataset.originalText;
  button.style.opacity = loading ? "0.82" : "1";
}

function buildStatCards(summary) {
  const cards = [
    {
      label: "Dataset 1",
      value: `${summary.datasets.dataset1.rows}`,
      subtext: "Original voice records",
    },
    {
      label: "Dataset 2",
      value: `${summary.datasets.dataset2.rows}`,
      subtext: "Comparison records",
    },
    {
      label: "Model accuracy",
      value: formatPercent(summary.deployed_model.accuracy),
      subtext: summary.deployed_model.model_name,
    },
    {
      label: "Input features",
      value: `${summary.features.length}`,
      subtext: "Biomedical voice biomarkers",
    },
  ];

  elements.statGrid.innerHTML = cards
    .map(
      (card) => `
        <article class="stat-card">
          <div class="label">${card.label}</div>
          <div class="value">${card.value}</div>
          <div class="subtext">${card.subtext}</div>
        </article>
      `
    )
    .join("");
}

function buildDatasetSelect(summary) {
  elements.datasetSelect.innerHTML = `
    <option value="dataset1">Dataset 1 · original records</option>
    <option value="dataset2">Dataset 2 · comparison records</option>
  `;
  updateRangeBounds(summary, "dataset1");
}

function updateRangeBounds(summary, datasetName) {
  const dataset = summary.datasets[datasetName];
  elements.rowRange.max = Math.max(0, dataset.rows - 1);
  elements.rowRange.value = 0;
  elements.rangeLabel.textContent = `Record 0 of ${dataset.rows - 1}`;
}

function buildManualForm(features) {
  const grouped = {};

  features.forEach((feature) => {
    const meta = getFeatureMeta(feature);
    const group = meta.group || "Other features";

    if (!grouped[group]) {
      grouped[group] = [];
    }

    grouped[group].push(feature);
  });

  const orderedGroups = GROUP_ORDER.filter((group) => grouped[group]);

  elements.manualForm.innerHTML = orderedGroups
    .map((group) => {
      const description = GROUP_DESCRIPTIONS[group] || "Grouped model inputs.";

      return `
        <section class="group-card">
          <div class="group-header">
            <h4>${group}</h4>
            <div class="group-description">${description}</div>
          </div>

          <div class="group-input-grid">
            ${grouped[group]
              .map((feature) => {
                const meta = getFeatureMeta(feature);

                return `
                  <label class="field-block">
                    <span class="field-label">${meta.label}</span>
                    <input
                      type="number"
                      step="any"
                      name="${feature}"
                      placeholder="Enter ${meta.label.toLowerCase()}"
                    />
                    <span class="input-subnote">${meta.note} · ${feature}</span>
                  </label>
                `;
              })
              .join("")}
          </div>
        </section>
      `;
    })
    .join("");
}

function renderMetrics(summary) {
  const metrics = summary.deployed_model;

  const items = [
    ["Accuracy", formatPercent(metrics.accuracy)],
    ["Precision", formatPercent(metrics.precision)],
    ["Recall", formatPercent(metrics.recall)],
    ["F1 score", formatPercent(metrics.f1)],
    ["ROC AUC", formatPercent(metrics.roc_auc)],
    [
      "Confusion matrix",
      `${metrics.confusion_matrix[0].join(", ")} · ${metrics.confusion_matrix[1].join(", ")}`,
    ],
  ];

  elements.metricList.innerHTML = items
    .map(
      ([name, value]) => `
        <div class="metric-item">
          <span>${name}</span>
          <strong>${value}</strong>
        </div>
      `
    )
    .join("");

  elements.featureImportance.innerHTML = metrics.top_features
    .map((item) => {
      const meta = getFeatureMeta(item.name);

      return `
        <div class="importance-item">
          <span>${meta.label}</span>
          <strong>${(item.importance * 100).toFixed(2)}%</strong>
        </div>
      `;
    })
    .join("");
}

function renderSample(sample) {
  const previewFeatures = Object.entries(sample.features).slice(0, 8);
  const badgeClass = sample.actual_status === 1 ? "risk" : "success";
  const badgeText =
    sample.actual_status === 1
      ? "Dataset label: Parkinson's"
      : "Dataset label: Healthy";

  elements.samplePreview.innerHTML = `
    <div class="sample-header">
      <div class="sample-title">
        <span class="sample-note">Loaded voice sample</span>
        <strong>${sample.name}</strong>
      </div>
      <div class="sample-badge ${badgeClass}">${badgeText}</div>
    </div>

    <div class="sample-grid">
      ${previewFeatures
        .map(([feature, value]) => {
          const meta = getFeatureMeta(feature);

          return `
            <div class="sample-value-card">
              <span>${meta.label}</span>
              <strong>${formatValue(value)}</strong>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function fillManualForm(features) {
  Object.entries(features).forEach(([name, value]) => {
    const field = elements.manualForm.querySelector(
      `[name="${CSS.escape(name)}"]`
    );

    if (field) {
      field.value = value;
    }
  });
}

function renderPrediction(result, modeLabel) {
  const riskProbability = Number(result.parkinsons_probability);
  const healthyProbability = Number(result.healthy_probability);
  const confidence = getConfidence(riskProbability, healthyProbability);
  const predictionClass = result.prediction === 1 ? "risk" : "success";
  const title =
    result.prediction === 1
      ? "Elevated Parkinsonian voice-pattern signal"
      : "Lower Parkinsonian voice-pattern signal";

  elements.predictionOutput.className = `glass-card prediction-panel ${predictionClass}`;
  elements.predictionOutput.innerHTML = `
    <div class="prediction-top">
      <div class="prediction-title-group">
        <div class="section-tag">Screening output</div>
        <h3>${title}</h3>
        <div class="prediction-summary">
          ${explainPrediction(riskProbability)} This estimate was generated using
          ${modeLabel.toLowerCase()}.
        </div>
      </div>

      <div class="confidence-box">
        <span class="small">Model confidence</span>
        <span class="big">${formatPercent(confidence)}</span>
      </div>
    </div>

    <div class="probability-grid">
      <div class="probability-card">
        <div class="probability-header">
          <span>Parkinsonian signal probability</span>
          <strong>${formatPercent(riskProbability)}</strong>
        </div>
        <div class="progress-track">
          <span class="progress-fill" style="width: ${riskProbability * 100}%"></span>
        </div>
      </div>

      <div class="probability-card">
        <div class="probability-header">
          <span>Healthy-pattern probability</span>
          <strong>${formatPercent(healthyProbability)}</strong>
        </div>
        <div class="progress-track">
          <span class="progress-fill" style="width: ${healthyProbability * 100}%"></span>
        </div>
      </div>
    </div>

    <div class="metric-list">
      <div class="metric-item">
        <span>Interpretation</span>
        <strong>${result.prediction === 1 ? "Higher-risk screening output" : "Lower-risk screening output"}</strong>
      </div>
      <div class="metric-item">
        <span>Mode used</span>
        <strong>${modeLabel}</strong>
      </div>
      ${
        typeof result.actual_status === "number"
          ? `
            <div class="metric-item">
              <span>Dataset label</span>
              <strong>${result.actual_status === 1 ? "Parkinson's" : "Healthy"}</strong>
            </div>
          `
          : ""
      }
      ${
        result.name
          ? `
            <div class="metric-item">
              <span>Voice sample</span>
              <strong>${result.name}</strong>
            </div>
          `
          : ""
      }
    </div>
  `;

  elements.predictionOutput.classList.remove("hidden");
  elements.predictionOutput.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
  });
}

async function loadSummary() {
  try {
    const summary = await api("/api/summary");
    state.summary = summary;

    buildStatCards(summary);
    buildDatasetSelect(summary);
    buildManualForm(summary.features);
    renderMetrics(summary);

    setStatus("API connected", "online");
  } catch (error) {
    setStatus("Backend offline", "offline");
    elements.samplePreview.innerHTML = `
      <div class="sample-empty">
        Start the FastAPI backend first. ${error.message}
      </div>
    `;
    throw error;
  }
}

async function loadSample() {
  const datasetName = elements.datasetSelect.value;
  const rowIndex = Number(elements.rowRange.value);

  const sample = await api(
    `/api/sample?dataset_name=${encodeURIComponent(datasetName)}&row_index=${rowIndex}`
  );

  state.sample = sample;
  renderSample(sample);
}

function collectManualForm() {
  const inputs = Array.from(elements.manualForm.querySelectorAll("input"));
  const features = {};

  for (const input of inputs) {
    if (input.value === "") {
      const meta = getFeatureMeta(input.name);
      throw new Error(`Missing value for ${meta.label}`);
    }

    features[input.name] = Number(input.value);
  }

  return features;
}

async function init() {
  await loadSummary();
  await loadSample();

  elements.datasetSelect.addEventListener("change", async () => {
    updateRangeBounds(state.summary, elements.datasetSelect.value);
    await loadSample();
  });

  elements.rowRange.addEventListener("input", () => {
    elements.rangeLabel.textContent = `Record ${elements.rowRange.value} of ${elements.rowRange.max}`;
  });

  elements.loadSample.addEventListener("click", async () => {
    try {
      setButtonLoading(elements.loadSample, true, "Loading...");
      await loadSample();
    } catch (error) {
      alert(error.message);
    } finally {
      setButtonLoading(elements.loadSample, false);
    }
  });

  elements.predictSample.addEventListener("click", async () => {
    try {
      setButtonLoading(elements.predictSample, true, "Running...");
      const payload = {
        dataset_name: elements.datasetSelect.value,
        row_index: Number(elements.rowRange.value),
      };

      const result = await api("/api/predict/sample", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      renderPrediction(result, "sample-based screening");
    } catch (error) {
      alert(error.message);
    } finally {
      setButtonLoading(elements.predictSample, false);
    }
  });

  elements.fillFromSample.addEventListener("click", async () => {
    try {
      setButtonLoading(elements.fillFromSample, true, "Copying...");
      if (!state.sample) {
        await loadSample();
      }
      fillManualForm(state.sample.features);
    } catch (error) {
      alert(error.message);
    } finally {
      setButtonLoading(elements.fillFromSample, false);
    }
  });

  elements.predictManual.addEventListener("click", async () => {
    try {
      setButtonLoading(elements.predictManual, true, "Analyzing...");
      const payload = { features: collectManualForm() };

      const result = await api("/api/predict/manual", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      renderPrediction(result, "manual biomarker analysis");
    } catch (error) {
      alert(error.message);
    } finally {
      setButtonLoading(elements.predictManual, false);
    }
  });
}

init().catch((error) => {
  console.error(error);
});