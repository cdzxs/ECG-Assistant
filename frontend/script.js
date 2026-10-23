const heartbeatInput = document.querySelector('#heartbeat');
const valueCount = document.querySelector('#value-count');
const sampleButton = document.querySelector('#sample-button');
const analyzeButton = document.querySelector('#analyze-button');
const statusMessage = document.querySelector('#status-message');
const results = document.querySelector('#results');

if (heartbeatInput) {
    // Small deterministic waveform to let visitors explore the interface.
    const sampleBeat = Array.from({ length: 200 }, (_, index) => {
        const phase = (index % 50) / 50;
        const wave = 0.08 * Math.sin(index * 0.28) + 0.025 * Math.sin(index * 0.72);
        const peak = Math.exp(-Math.pow((phase - 0.48) / 0.055, 2)) * 0.85;
        return (wave + peak).toFixed(4);
    });

    function parseValues(value) {
        const trimmed = value.trim();
        if (!trimmed) return [];
        return trimmed.split(/[\s,]+/).filter(Boolean);
    }

    function refreshCount() {
        const count = parseValues(heartbeatInput.value).length;
        valueCount.textContent = `${count} ${count === 1 ? 'value' : 'values'} entered`;
        valueCount.setAttribute('aria-live', 'polite');
    }

    function setStatus(message, type = '') {
        statusMessage.textContent = message;
        statusMessage.className = type;
    }

    heartbeatInput.addEventListener('input', () => {
        refreshCount();
        results.hidden = true;
        setStatus('');
    });

    sampleButton.addEventListener('click', () => {
        heartbeatInput.value = sampleBeat.join(', ');
        refreshCount();
        results.hidden = true;
        setStatus('Sample heartbeat loaded. Select Analyse heartbeat to continue.', 'success');
        heartbeatInput.focus();
    });

    analyzeButton.addEventListener('click', async () => {
        const rawValues = parseValues(heartbeatInput.value);
        results.hidden = true;

        if (rawValues.length !== 200) {
            setStatus(`Enter exactly 200 values to continue. You have entered ${rawValues.length}.`, 'error');
            heartbeatInput.focus();
            return;
        }

        const beat = rawValues.map(Number);
        if (beat.some(value => !Number.isFinite(value))) {
            setStatus('Every entry must be a valid number. Check the values and try again.', 'error');
            heartbeatInput.focus();
            return;
        }

        analyzeButton.disabled = true;
        analyzeButton.textContent = 'Connecting to model…';
        setStatus('Sending this segment to the local analysis service…');

        try {
            const response = await fetch('http://127.0.0.1:5000/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ beat })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'The analysis service could not process this segment.');

            document.querySelector('#prediction').textContent = data.prediction;
            document.querySelector('#confidence').textContent = `${(data.confidence * 100).toFixed(1)}%`;
            const probabilities = document.querySelector('#probabilities');
            probabilities.replaceChildren();
            Object.entries(data.probabilities || {}).forEach(([label, probability]) => {
                const percentage = Math.max(0, Math.min(100, Number(probability) * 100));
                const row = document.createElement('div');
                row.className = 'probability-row';
                const name = document.createElement('span');
                name.textContent = label;
                const track = document.createElement('div');
                track.className = 'probability-track';
                track.setAttribute('role', 'img');
                track.setAttribute('aria-label', `${label}: ${percentage.toFixed(1)} percent`);
                const fill = document.createElement('div');
                fill.className = 'probability-fill';
                fill.style.width = `${percentage}%`;
                track.append(fill);
                const score = document.createElement('span');
                score.textContent = `${percentage.toFixed(1)}%`;
                row.append(name, track, score);
                probabilities.append(row);
            });
            results.hidden = false;
            setStatus('Analysis complete. This result is for educational exploration only.', 'success');
        } catch (error) {
            setStatus(error instanceof TypeError
                ? 'Could not reach the local analysis service. Start the backend and try again.'
                : error.message, 'error');
        } finally {
            analyzeButton.disabled = false;
            analyzeButton.textContent = 'Analyse heartbeat';
        }
    });

    refreshCount();
}
