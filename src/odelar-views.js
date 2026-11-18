const status = document.getElementById('odelar-views-status');
const summary = document.getElementById('odelar-views-total');
const rows = document.getElementById('odelar-views-rows');
const format = value => value.toLocaleString('es-AR');
const labels = { youtube: 'YouTube', instagram: 'Instagram', mux: 'Mux' };
const chart = document.getElementById('odelar-views-chart');
const SVG_NS = 'http://www.w3.org/2000/svg';
const series = [
    { key: 'total', label: 'Total', color: '#ffffff', width: 3 },
    { key: 'youtube', label: 'YouTube', color: '#ff4e45', width: 2 },
    { key: 'instagram', label: 'Instagram', color: '#e1306c', width: 2 },
    { key: 'mux', label: 'Mux', color: '#4aa3ff', width: 2 },
];

const svgEl = (name, attrs = {}, text) => {
    const el = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (text !== undefined) el.textContent = text;
    return el;
};

function renderChart(episodes) {
    const valueOf = (episode, key) => (key === 'total' ? episode.total : episode.views[key]);
    const max = Math.max(...episodes.flatMap(episode => series.map(s => valueOf(episode, s.key) ?? 0)));
    if (!max) return;
    const niceMax = Math.ceil(max / 500) * 500;
    const width = 900, height = 340, left = 56, right = 16, top = 16, bottom = 56;
    const x = index => left + (episodes.length === 1 ? 0 : index * (width - left - right) / (episodes.length - 1));
    const y = value => top + (1 - value / niceMax) * (height - top - bottom);

    const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': 'Vistas por capítulo de Otro día en la red, total y por plataforma' });
    for (let i = 0; i <= 5; i += 1) {
        const value = niceMax * i / 5;
        svg.append(
            svgEl('line', { x1: left, x2: width - right, y1: y(value), y2: y(value), stroke: '#303030' }),
            svgEl('text', { x: left - 8, y: y(value) + 4, 'text-anchor': 'end', fill: '#aaaaaa', 'font-size': 11 }, format(Math.round(value))),
        );
    }
    episodes.forEach((episode, index) => {
        svg.append(svgEl('text', {
            x: x(index), y: height - bottom + 16, 'text-anchor': 'end', fill: '#aaaaaa', 'font-size': 11,
            transform: `rotate(-45 ${x(index)} ${height - bottom + 16})`,
        }, episode.episode));
    });

    for (const s of series) {
        // A missing value breaks the line instead of drawing it as zero.
        let path = '';
        let previousMissing = true;
        episodes.forEach((episode, index) => {
            const value = valueOf(episode, s.key);
            if (value === null) { previousMissing = true; return; }
            path += `${previousMissing ? 'M' : 'L'}${x(index).toFixed(1)},${y(value).toFixed(1)} `;
            previousMissing = false;
        });
        if (path) svg.append(svgEl('path', { d: path.trim(), fill: 'none', stroke: s.color, 'stroke-width': s.width, 'stroke-linejoin': 'round' }));
        episodes.forEach((episode, index) => {
            const value = valueOf(episode, s.key);
            if (value === null) return;
            const point = svgEl('circle', { cx: x(index), cy: y(value), r: s.key === 'total' ? 3.5 : 2.5, fill: s.color });
            point.append(svgEl('title', {}, `${episode.episode} · ${episode.title} — ${s.label}: ${format(value)}`));
            svg.append(point);
        });
    }

    const legend = document.createElement('div');
    legend.className = 'chart-legend';
    for (const s of series) {
        const item = document.createElement('span');
        const swatch = document.createElement('i');
        swatch.style.background = s.color;
        item.append(swatch, s.label);
        legend.append(item);
    }
    chart.replaceChildren(svg, legend);
    chart.hidden = false;
}

async function loadViews() {
    try {
        const response = await fetch('/api/odelar-views');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data.episodes) || !data.sources) throw new Error('Respuesta inválida');

        const addUp = key => {
            const values = data.episodes.map(episode => episode[key]).filter(value => value !== null);
            return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
        };
        const totals = [['vistas', addUp('total')], ['likes', addUp('totalLikes')], ['comentarios', addUp('totalComments')]]
            .filter(([, value]) => value !== null);
        summary.textContent = totals.length
            ? totals.map(([name, value]) => `${format(value)} ${name}`).join(' · ')
            : 'Sin datos disponibles';
        const muxTimeframe = data.sources.mux?.timeframe;
        const muxNote = muxTimeframe
            ? `Mux: desde el ${new Date(muxTimeframe[0] * 1000).toLocaleDateString('es-AR', { timeZone: 'UTC' })} hasta el ${new Date(muxTimeframe[1] * 1000).toLocaleDateString('es-AR', { timeZone: 'UTC' })}, según la retención de la cuenta.`
            : 'Mux no está disponible.';
        const unavailable = Object.keys(labels).filter(source => !data.sources[source]?.available).map(source => labels[source]);
        status.textContent = `YouTube e Instagram: cifras acumuladas. Likes y comentarios solo existen en YouTube e Instagram (Mux no los registra). ${muxNote} Las sumas son parciales: no incluyen publicaciones sin vincular ni datos no disponibles.${unavailable.length ? ` Fuentes no disponibles: ${unavailable.join(', ')}.` : ''}`;

        renderChart(data.episodes);

        for (const episode of data.episodes) {
            const row = document.createElement('div');
            row.className = 'views-row';
            const info = document.createElement('div');
            const name = document.createElement('div');
            name.textContent = `${episode.episode} · ${episode.title}`;
            const detail = document.createElement('div');
            detail.className = 'views-detail';
            detail.textContent = Object.entries(labels).map(([source, label]) => {
                const value = episode.views[source];
                return `${label}: ${value === null ? (data.sources[source].available ? 'sin vincular o sin dato' : 'no disponible') : format(value)}`;
            }).join(' · ');
            const total = document.createElement('div');
            total.className = 'views-value';
            total.textContent = episode.total === null ? 'Sin datos' : `${format(episode.total)} vistas`;
            const engagement = document.createElement('div');
            engagement.className = 'views-detail';
            const part = (label, values) => `${label}: ${['youtube', 'instagram'].map(source => `${labels[source]} ${values[source] === null ? '—' : format(values[source])}`).join(' · ')}`;
            engagement.textContent = `${part('Likes', episode.likes)} | ${part('Comentarios', episode.comments)}${episode.instagramManual ? ' | Instagram: dato manual al 11/11/2026' : ''}`;
            info.append(name, detail, engagement);
            row.append(info, total);
            rows.append(row);
        }
    } catch (error) {
        console.error('No se pudieron cargar las vistas de Otro día en la red:', error);
        status.textContent = 'No se pudieron cargar las vistas. Intentá nuevamente más tarde.';
    }
}

loadViews();
