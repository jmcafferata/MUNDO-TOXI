const status = document.getElementById('odelar-views-status');
const summary = document.getElementById('odelar-views-total');
const rows = document.getElementById('odelar-views-rows');
const format = value => value.toLocaleString('es-AR');
const labels = { youtube: 'YouTube', instagram: 'Instagram', mux: 'Mux' };

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
