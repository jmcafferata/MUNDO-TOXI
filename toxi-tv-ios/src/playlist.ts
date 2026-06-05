// Misma epoch que tv.html y la app Android: 2026-01-01T00:00:00Z
const EPOCH_SEC = 1767225600;

export interface TvItem {
  id: string;
  duration: number;
  title: string;
}

export interface TvSlot {
  index: number;
  offsetMs: number;
  item: TvItem;
}

interface ScheduleEntry {
  dayOfWeek: number; // 0=Lun, 1=Mar, 2=Mié, 3=Jue, 4=Vie, 5=Sáb, 6=Dom (hora ART)
  startMin: number;  // minutos desde medianoche
  item: TvItem;
}

// ── Ítems del schedule ────────────────────────────────────────────────────────
const litVR:        TvItem = { id: 'N5ISPSMoo502IHjTdvQt02GeR7xgJUiCFTlxrBLLIhpcg',  duration: 2580.9,       title: 'Literatura y Realidad Virtual — Ana Arzoumanian' };
const pyMaster:     TvItem = { id: 'RSWU4WdVz3eD3yoZalubHKBGZMfB00Z00PJgK7KVp6zN00', duration: 5803.5,       title: 'Masterclass de Python — Nicolás Martorell' };
const odrI:         TvItem = { id: 'UiK7a7RjMI2LkEnxUEthecrAk4chE00OPr7ic1Tn9lG4',   duration: 376.250878,   title: 'Otro Día en la Red' };
const odr0:         TvItem = { id: 'QUElHo8r5HtNqfh02XfGKm85jUJ01iTGbkyn2D4BeYNZI',  duration: 189.148256,   title: 'Otro Día en la Red 0' };
const misionOdelar: TvItem = { id: 'd1Mu65Kcey02gQtRDtcV00U01U01JYwn9dZettLfFmErz3E', duration: 587.0448,    title: 'Misión: ODELaR' };
const aguatierra:   TvItem = { id: 'p75vcYJRLEjPMJo011Z1JOERMO5E013B02KCxYN5DR1Dg8',  duration: 604.687422,   title: 'Proyecto Aguatierra — Santuario del Maipo' };
const mersMT:       TvItem = { id: 'KqSlF5LSKjW028548zaZ5c7aPQNARdgA9pbuTGrL800r8',   duration: 616.782844,   title: 'MERS — María Teresa 2025' };
const moniPadre:    TvItem = { id: 'YSqI5Wj9dGRwjMh005Xs6a4Q4IPTdmAQJYa4WU1dH12w',   duration: 2489.820678,  title: 'Moni y Yisus — Padre Tomás Méndez' };
const hotelO:       TvItem = { id: 'iytKgjz1JJhz3Kl01WLcTCFZ9DTVClWf00kn71ACPW1AU',   duration: 339.548,      title: 'Hotel Oriente' };
const hotelODS:     TvItem = { id: 'iVB2ZU00L1WZDQJpqXrIAMg02Cmq4l6C2kKnP02sNP01CQM', duration: 687.228,    title: 'Hotel Oriente — Detrás de Escena' };
const iaSilberg:    TvItem = { id: '86NmIj818900IFXfcwEhIyZO3TkP7lYd6NOfqOP8ZSCQ',   duration: 6958.04,      title: 'IA, Abogacía y Modernización Judicial — Ian Silberberg' };
const peronismos:   TvItem = { id: 'qM33QmuwmXJsibPHXJMbFh02V9gT2s7HDEO00v9VB7mHY',  duration: 4983.850522,  title: 'TOXI Seminars — Peronismos' };
const storytelling: TvItem = { id: 'agfEm3toRbicITlQJbJ4ppPrv700kzCrHmFczRDhmcf8',   duration: 5693.633333,  title: 'Storytelling y Transgresión — Gael P. Rossi' };
const odrIII:       TvItem = { id: 'K6p6zWxcLOtRXb02eWcic00RYQG8SwDxE014o9007ZTBwm8', duration: 588.629711,  title: 'Otro Día en la Red III' };
const odrDetective: TvItem = { id: 'IHikcrMnpK00Dxsyb7xKpi1qpju01I00JmCpNXXrhg1WZg',  duration: 163.081,     title: 'Detective Noir' };
const odelar:       TvItem = { id: 'Q3kMlL901ouKhER0101Nzija5Y1025jWBV4ORBXTruuFEyM', duration: 455.538422,   title: 'Odelar' };
const volveOdelar:  TvItem = { id: 'HRr2KXg2X800YNuos9Aj2LmZe8XIqHvTMgFrGKc7v7wQ',   duration: 189.898042,   title: 'Volvé a ODELAR' };
const mersToxi:     TvItem = { id: 'CbBSyr5FvC7I00PpxpKNJBW1ibyLuT6Lr52uyeZHHyBg',   duration: 2457.566667,  title: 'MERS — Exposición en TOXI Media' };
const moniRose:     TvItem = { id: 'h5NFgWueG4nldZesITFtEYpnU01CyExDQ02FZ3tSBrp5w',   duration: 1167.467467,  title: 'Moni y Yisus — Rose Cafferata' };
const masAlla:      TvItem = { id: 'wj0015QgHhNxFVU01iXuF8z5hvJ7TUnd02UfwqHa447Whs',  duration: 2898.3,       title: 'Más Allá del Más Allá — MONIYISUS' };
const verCoger:     TvItem = { id: 'RUULhR2QDMRZT01YDXggu7WPKI01nzGyzvK1RPwGY3GyQ',   duration: 498.499,      title: 'Ver para Coger' };

// ── Horario semanal ───────────────────────────────────────────────────────────
const WEEKLY_SCHEDULE: ScheduleEntry[] = [
  // ── JUEVES (dow=3) ────────────────────────────────────────────────
  { dayOfWeek: 3, startMin: 17*60,      item: litVR },
  { dayOfWeek: 3, startMin: 18*60,      item: pyMaster },
  { dayOfWeek: 3, startMin: 20*60,      item: odrI },
  { dayOfWeek: 3, startMin: 20*60+15,   item: odr0 },
  { dayOfWeek: 3, startMin: 20*60+30,   item: misionOdelar },
  { dayOfWeek: 3, startMin: 20*60+45,   item: odr0 },
  { dayOfWeek: 3, startMin: 21*60,      item: aguatierra },
  { dayOfWeek: 3, startMin: 21*60+15,   item: mersMT },
  { dayOfWeek: 3, startMin: 21*60+30,   item: aguatierra },
  { dayOfWeek: 3, startMin: 21*60+45,   item: mersMT },
  { dayOfWeek: 3, startMin: 22*60,      item: moniPadre },
  { dayOfWeek: 3, startMin: 23*60,      item: hotelO },
  { dayOfWeek: 3, startMin: 23*60+15,   item: hotelODS },

  // ── VIERNES (dow=4) ───────────────────────────────────────────────
  { dayOfWeek: 4, startMin: 11*60,      item: iaSilberg },
  { dayOfWeek: 4, startMin: 13*60,      item: peronismos },
  { dayOfWeek: 4, startMin: 15*60,      item: storytelling },
  { dayOfWeek: 4, startMin: 17*60,      item: litVR },
  { dayOfWeek: 4, startMin: 18*60,      item: pyMaster },
  { dayOfWeek: 4, startMin: 20*60,      item: odr0 },
  { dayOfWeek: 4, startMin: 20*60+15,   item: odrIII },
  { dayOfWeek: 4, startMin: 20*60+30,   item: misionOdelar },
  { dayOfWeek: 4, startMin: 20*60+45,   item: odrI },
  { dayOfWeek: 4, startMin: 21*60,      item: mersToxi },
  { dayOfWeek: 4, startMin: 21*60+45,   item: aguatierra },
  { dayOfWeek: 4, startMin: 22*60,      item: moniRose },
  { dayOfWeek: 4, startMin: 22*60+30,   item: moniRose },
  { dayOfWeek: 4, startMin: 23*60,      item: odrDetective },

  // ── SÁBADO (dow=5) ────────────────────────────────────────────────
  { dayOfWeek: 5, startMin: 11*60,      item: iaSilberg },
  { dayOfWeek: 5, startMin: 13*60,      item: peronismos },
  { dayOfWeek: 5, startMin: 15*60,      item: storytelling },
  { dayOfWeek: 5, startMin: 17*60,      item: litVR },
  { dayOfWeek: 5, startMin: 18*60,      item: pyMaster },
  { dayOfWeek: 5, startMin: 20*60,      item: odrIII },
  { dayOfWeek: 5, startMin: 20*60+15,   item: odelar },
  { dayOfWeek: 5, startMin: 20*60+30,   item: misionOdelar },
  { dayOfWeek: 5, startMin: 20*60+45,   item: odrIII },
  { dayOfWeek: 5, startMin: 21*60,      item: aguatierra },
  { dayOfWeek: 5, startMin: 21*60+15,   item: mersMT },
  { dayOfWeek: 5, startMin: 21*60+30,   item: aguatierra },
  { dayOfWeek: 5, startMin: 21*60+45,   item: mersMT },
  { dayOfWeek: 5, startMin: 22*60,      item: masAlla },
  { dayOfWeek: 5, startMin: 23*60,      item: verCoger },

  // ── DOMINGO (dow=6) ───────────────────────────────────────────────
  { dayOfWeek: 6, startMin: 11*60,      item: iaSilberg },
  { dayOfWeek: 6, startMin: 13*60,      item: peronismos },
  { dayOfWeek: 6, startMin: 15*60,      item: storytelling },
  { dayOfWeek: 6, startMin: 17*60,      item: litVR },
  { dayOfWeek: 6, startMin: 18*60,      item: pyMaster },
  { dayOfWeek: 6, startMin: 20*60,      item: odelar },
  { dayOfWeek: 6, startMin: 20*60+15,   item: volveOdelar },
  { dayOfWeek: 6, startMin: 20*60+30,   item: misionOdelar },
  { dayOfWeek: 6, startMin: 20*60+45,   item: odrI },
  { dayOfWeek: 6, startMin: 21*60,      item: mersToxi },
  { dayOfWeek: 6, startMin: 21*60+45,   item: aguatierra },
  { dayOfWeek: 6, startMin: 22*60,      item: moniPadre },
];

// ── Playlist hardcodeada (fallback sin red) ───────────────────────────────────
export const HARDCODED_PLAYLIST: TvItem[] = [
  { id: 'iytKgjz1JJhz3Kl01WLcTCFZ9DTVClWf00kn71ACPW1AU',        duration: 339.548,      title: 'Hotel Oriente' },
  { id: 'iVB2ZU00L1WZDQJpqXrIAMg02Cmq4l6C2kKnP02sNP01CQM',     duration: 687.228,      title: 'Hotel Oriente — Detrás de Escena' },
  { id: 'IHikcrMnpK00Dxsyb7xKpi1qpju01I00JmCpNXXrhg1WZg',       duration: 163.081,      title: 'Detective Noir' },
  { id: 'RUULhR2QDMRZT01YDXggu7WPKI01nzGyzvK1RPwGY3GyQ',        duration: 498.499,      title: 'Ver para Coger' },
  { id: 'Mqf9GhKKFmd01IH28ITZ00KT4oGLxmr6gvqbNQjGIv301Y',       duration: 5563.892,     title: 'We Will Rock You' },
  { id: 'cUI9VC3LTXXxk62iQ902Gd84AJVhg3Gd8lhFczPBuqrI',         duration: 79.533333,    title: '(ICU) Think About' },
  { id: 'B02Qs6Wm3TGMjxm5EZKRowHdNTUPb020048AMJa45YDXVM',       duration: 1060.893178,  title: '17 Minutos con Cata' },
  { id: 'IjUQQvDDhAOMHHS57ORIVl9f01vvb5425FmzPIdF5LRI',         duration: 73.633333,    title: 'A Game of Drones — Early Access Trailer' },
  { id: 'A14ToM2G9Mmi101NejPlGtAjj8oNGWnyIt302xeWw3oHw',        duration: 605.146211,   title: 'After You\'re Gone — Fancy Dogs™' },
  { id: 'CbBSyr5FvC7I00PpxpKNJBW1ibyLuT6Lr52uyeZHHyBg',         duration: 2457.566667,  title: 'Alfredo Cafferata en TOXI Media' },
  { id: 'z02O01aMd02YkbeUb01syS400owVLRZ4oOJ6m463hcQ7FseQ',     duration: 956.08,       title: 'BAFICI Nights con Fabrizio Sanguinetti' },
  { id: 'SKB56hnQQV6Tame5VKea02w8E01Ijm7iyHUY5dZXYHKmU',        duration: 1270.811211,  title: 'Bebop Big Band — Bebop Club, 7 de Abril de 2025' },
  { id: 'KrzHBlHcZCL71mIfCoPKiCMs2iBQMAq8vbhXr701OtQg',         duration: 17.966667,    title: 'Carola Gil le informa a Carlos Pagni la existencia de Pizza & Pagni' },
  { id: 'm8ehCQajSn5f8LVTIdGUNlAePZ7iARoXJHCFjOCmkxE',          duration: 30.196844,    title: 'Charlas Interactivas — Xplora Academy' },
  { id: 'FZAP5bJ2O5L16da7Ls1YdSGIiGEZfqTf02dR46z8tfk00',        duration: 588.254344,   title: 'Cuento de la Selva' },
  { id: 'KqSlF5LSKjW028548zaZ5c7aPQNARdgA9pbuTGrL800r8',         duration: 616.782844,   title: 'Desarrollos Regenerativos — Novedades María Teresa' },
  { id: 'Lsb01QL2dVq63701jEQ01d2DgIo4T2ZzNnRSGNIYeCpX4s',       duration: 17.267256,    title: 'Detrás de las Risas — Teaser' },
  { id: 'PDLQLpJTnqba3Rn6HBdwb6SJwDR5Tmtm02WZH6jNzsFY',         duration: 2619.033089,  title: 'El Maravilloso Mundo de TOXI' },
  { id: 'z3jU3rp9rTOr95501nz025OP2q9FIz89cwPHO7kyT7Lb8',         duration: 63.866667,    title: 'Galaxy Adventure 2' },
  { id: '2yiwT02f7uhnx6yX01qo4b52iffRv8CSVqyMBsYNR02zLY',        duration: 1333.457133,  title: 'IDA — Claire Fatale & Julian Camps' },
  { id: '86NmIj818900IFXfcwEhIyZO3TkP7lYd6NOfqOP8ZSCQ',         duration: 6958.04,      title: 'Inteligencia Artificial, Abogacía y el Desafío de la Modernización Judicial — con Ian Silberberg' },
  { id: '8zmmEvU01roD01y1JxwUY5LWW3OcO61YiGw6UWqpxsyoY',        duration: 196.321133,   title: 'It\'s a Jungle Out There' },
  { id: 'l3s1Blhidm1trZYlmnOOwH02AzXzPdBo4QNpviWlibF8',         duration: 957.247967,   title: 'Lo Que Se Avecina — Piloto' },
  { id: 'NMymlct00uz1BJMqcJUjcdfSbXGXfoaYuq3bDg702WQlY',        duration: 556.389178,   title: 'La Biblioteca Café — Viernes 30 de Agosto' },
  { id: 'xNpGxSdaSkdi8bqzGoQzAo3laBVRgec8t3T827yrT8M',          duration: 206.748211,   title: 'La Irracional' },
  { id: 'StpQCayHgfczOfy8q9D2UctIoZDrnNTu02ULCQQQr9fA',         duration: 108.483378,   title: 'Las Formas del Laberinto — Tráiler' },
  { id: 'q2oWATOAQGdVl3AdhoyAmZ8Zwk6BhJkne02Pk31bwHg4',         duration: 42.0003,      title: 'Las Siestas de Sol' },
  { id: 'vNMBQmE2Q6YaxmESqvh2yYZsqfjtpnu9kJp7QKFvRgs',          duration: 243.952044,   title: 'Lectura en Francés — Juana la Loca' },
  { id: '02gDf9x8Z01J8ISIKrlC9DMItd02UI029ikQ1T29Sca02z1U',     duration: 53.094711,    title: 'MONIYISUS — Tráiler' },
  { id: 'GHZVMKXJaoMnrUxUfVhSVn300gxnFxCSJKK01k3rOKmks',        duration: 34.701344,    title: 'Maxi Mancuso Quintet — Difusión' },
  { id: 'DE01AR1H01dk7JY9q8RsBP7jk122hRQaxKkMJRxirNQWM',        duration: 151.860044,   title: 'Mentoría de Comunicación, Locución y Doblaje — Demi Roch' },
  { id: '02lxmxwxBURGEtO4XtvXro024Zl8yOCUsf6AzfGEkiuSU',        duration: 1868.408211,  title: 'Mesa Torcida — Piloto' },
  { id: 'd1Mu65Kcey02gQtRDtcV00U01U01JYwn9dZettLfFmErz3E',      duration: 587.0448,     title: 'Misión: Odelar' },
  { id: 'h5NFgWueG4nldZesITFtEYpnU01CyExDQ02FZ3tSBrp5w',        duration: 1167.467467,  title: 'Moni y Yisus entrevistan a Rose Cafferata — MONIYISUS #2' },
  { id: 'YSqI5Wj9dGRwjMh005Xs6a4Q4IPTdmAQJYa4WU1dH12w',        duration: 2489.820678,  title: 'Moni y Yisus entrevistan al Padre Tomás Méndez — MONIYISUS #4' },
  { id: '9pXQ7MUiVlTklMCQdQVdbxoMn85YIC3jObLtzBFN801o',         duration: 137.220422,   title: 'Muerte y Miedo en las Calles — Otro Día en la Red' },
  { id: 'oT00wnOnz00iFEzyaOmue00bXx2HOnyX01dII6t4UlGRM7A',      duration: 181.764922,   title: 'Ni Jorges ni Borges — Odelar #6' },
  { id: 'Q3kMlL901ouKhER0101Nzija5Y1025jWBV4ORBXTruuFEyM',      duration: 455.538422,   title: 'Odelar — Otro Día en la Red IV' },
  { id: 'UiK7a7RjMI2LkEnxUEthecrAk4chE00OPr7ic1Tn9lG4',         duration: 376.250878,   title: 'Otro Día en la Red — Capítulo 1' },
  { id: '1z01wgDyw3WEGJZXc00qZsWXXqo3hIfCQHMWK8mGsKX01Y',      duration: 635.384756,   title: 'Prototipazos — Piloto La Impact' },
  { id: 'ec1emgWV3VZVz4G0200wUSiUrV5y4j8jlyjgC8JXn1rFs',        duration: 272.939344,   title: 'Palta and the Gang — Luna Park, 9 de Mayo de 2024' },
  { id: 'X7YJlq50211xQS2d9Vi01aD3QY8QKx8nJOC2hWD1ELc5k',       duration: 224.140589,   title: 'Para Qué Sirve Todo Esto' },
  { id: 'HPsNUFZfR8NY6Tq2qv02NToxV8noBJ8BAGDE59OCD01Kc',        duration: 217.133589,   title: 'Pierrot le Bolou' },
  { id: 'dJKlr23ualq86KvwfVoMx02g755YL02p6pQQ8dyfghEsc',        duration: 19.9783,      title: 'Prez — Tráiler' },
  { id: 'R1EGXfq1DUGMrFblrMMGuppU02fQf01i1LGENQY9m46Ls',        duration: 224.1823,     title: 'RAKU 楽焼' },
  { id: 'XDIDz4TQ34vozsemiHeyuzMi6OuqQR7oAB1HHaVCIOA',          duration: 166.541378,   title: 'Hedonismo y Seducción' },
  { id: '2EFUXtMAx4u7QFmnXYC01P00cgpa4z02QqKVgSAkcuqYpg',       duration: 101.551467,   title: 'Hedonismo y Seducción' },
  { id: 'k5WwHsdgrHNOzSdhUDGjjRVsK02u00WPQgQKhgYUYDtbk',        duration: 104.020589,   title: 'Hedonismo y Seducción' },
  { id: 'fID5sJbpqtFK01iIllxmwkTE5FvJnI3J7icA3Qjo009gU',        duration: 412.328589,   title: 'Recoleta bajo la Lluvia — Discover BA con Luz' },
  { id: 'p75vcYJRLEjPMJo011Z1JOERMO5E013B02KCxYN5DR1Dg8',       duration: 604.687422,   title: 'Santuario del Maipo — Proyecto de Infiltración & Agricultura Sintrópica, Aguatierra' },
  { id: 'A7KK900TZvE7DOahDzDEncIz02GbxxJz8IJo01DCaVbOvE',        duration: 241.241011,   title: 'Sábado a la Noche' },
  { id: 'qM33QmuwmXJsibPHXJMbFh02V9gT2s7HDEO00v9VB7mHY',        duration: 4983.850522,  title: 'TOXI Seminars Vol. II — Peronismos (Fabrizio Sanguinetti)' },
  { id: 'wj0015QgHhNxFVU01iXuF8z5hvJ7TUnd02UfwqHa447Whs',       duration: 2898.3,       title: 'Más Allá del Más Allá — MONIYISUS #4' },
  { id: '00kmeFWt6viiA02WHx9P01PnsY1RolhnyufiNhf5na7VsE',        duration: 4863.358511,  title: 'The Greatest Showman — Obra Completa EDLP' },
  { id: 'CAG692TzvxtvAQEoR01byCm01xKJUp6GqyJalgQ0200Z6n00',      duration: 92.251,       title: 'Las Catadoras del Führer — Tráiler' },
  { id: 'mlTTKbkPDdOTvu963D1p00vz8pihOYpo2iefwZowJP6M',         duration: 241.958333,   title: 'Viaje — Fermín Tz' },
  { id: '7KfrMVUZL2bANgKGsxeWjCnrOTK1DRuUOe9701UO7424',         duration: 2868.448922,  title: 'Xplora Night Live' },
  { id: 'tUZ7gRedTD1q602xkadggUxC024cXAN7jxGhIfR73AbIE',       duration: 110.652211,   title: 'Las Formas del Laberinto - Palacio Libertad' },
  { id: 'cseBPfceuHCbWY3D2OF7WMtQ7DmaYhSdR4ekSOD7QT4',          duration: 161.027533,   title: 'Yuyo Noé recorre Las Formas del Laberinto de Dolores Casares' },
  { id: 'yyJADkna02dmJtNdyUoHDOYQMcjsxKcjf63O00w01mm1ZI',       duration: 149.6495,     title: 'Fiesta en la Cocina' },
  { id: '00VG6EL1oC4eI96PVQXeobbdZ6GBNwrmUAexIDdiMpTc',         duration: 160.326833,   title: 'Hipo Hip Hop' },
  { id: 'QUElHo8r5HtNqfh02XfGKm85jUJ01iTGbkyn2D4BeYNZI',        duration: 189.148256,   title: 'Otro Día en la Red 0' },
  { id: 'K6p6zWxcLOtRXb02eWcic00RYQG8SwDxE014o9007ZTBwm8',      duration: 588.629711,   title: 'Otro Día en la Red III' },
  { id: 'HRr2KXg2X800YNuos9Aj2LmZe8XIqHvTMgFrGKc7v7wQ',        duration: 189.898042,   title: 'Volvé a ODELAR — Otro Día en la Red' },
  { id: '2M1OrsTy02LXxW9WxTqMgUxyCiKPzsjjPkor7ZCL9CfE',         duration: 230.480256,   title: 'Viaje a la Luna' },
  { id: 'jRBL9g01D6l9rIIL419200N4ZOQyA0202n9P02lI02eBof02IY',   duration: 80.830756,    title: '¿Qué es Mamarracho?' },
  { id: 'agfEm3toRbicITlQJbJ4ppPrv700kzCrHmFczRDhmcf8',         duration: 5693.633333,  title: 'Storytelling y Transgresión — Gael P. Rossi' },
  { id: 'N5ISPSMoo502IHjTdvQt02GeR7xgJUiCFTlxrBLLIhpcg',        duration: 2580.9,       title: 'Literatura y Realidad Virtual — Ana Arzoumanian' },
  { id: 'RSWU4WdVz3eD3yoZalubHKBGZMfB00Z00PJgK7KVp6zN00',       duration: 5803.5,       title: 'Masterclass de Python — Nicolás Martorell' },
];

// Playlist activa — se reemplaza por la remota al arrancar si hay red
let activePlaylist: TvItem[] = HARDCODED_PLAYLIST;

export function setRemotePlaylist(list: TvItem[]): void {
  activePlaylist = list;
}

// ── Helpers de tiempo ─────────────────────────────────────────────────────────

/**
 * Devuelve { dow, daySec } en hora ART (UTC-3, sin DST).
 * dow: 0=Lun, 1=Mar, 2=Mié, 3=Jue, 4=Vie, 5=Sáb, 6=Dom
 */
function getArtTime(): { dow: number; daySec: number } {
  const nowMs  = Date.now();
  const artMs  = nowMs - 3 * 60 * 60 * 1000; // ART = UTC-3
  const d      = new Date(artMs);
  const jsDay  = d.getUTCDay();               // 0=Dom … 6=Sáb
  const dow    = (jsDay + 6) % 7;             // → 0=Lun … 6=Dom
  const daySec = d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();
  return { dow, daySec };
}

/** Lógica epoch-based: posición en la playlist según el reloj universal. */
function getFlatSlot(playlist: TvItem[]): TvSlot {
  const totalDuration = playlist.reduce((acc, item) => acc + item.duration, 0);
  const nowSec  = Date.now() / 1000;
  const elapsed = ((nowSec - EPOCH_SEC) % totalDuration + totalDuration) % totalDuration;
  let acc = 0;
  for (let i = 0; i < playlist.length; i++) {
    acc += playlist[i].duration;
    if (elapsed < acc) {
      const offset = elapsed - (acc - playlist[i].duration);
      return { index: i, offsetMs: offset * 1000, item: playlist[i] };
    }
  }
  return { index: 0, offsetMs: 0, item: playlist[0] };
}

/**
 * Modo programado:
 *  1. Si ahora mismo cae dentro de un bloque del WEEKLY_SCHEDULE → reproducirlo
 *     con el seek al punto exacto del video.
 *  2. Si hay un "hueco" → relleno epoch-based sobre ítems no programados.
 */
function getScheduledSlot(): TvSlot {
  const { dow, daySec } = getArtTime();

  for (let i = 0; i < WEEKLY_SCHEDULE.length; i++) {
    const entry = WEEKLY_SCHEDULE[i];
    if (entry.dayOfWeek !== dow) continue;
    const startSec = entry.startMin * 60;
    const endSec   = startSec + entry.item.duration;
    if (daySec >= startSec && daySec < endSec) {
      const offsetSec = daySec - startSec;
      return { index: i, offsetMs: offsetSec * 1000, item: entry.item };
    }
  }

  // Hueco → relleno
  const schedIds   = new Set(WEEKLY_SCHEDULE.map(e => e.item.id));
  const fillerPool = activePlaylist.filter(item => !schedIds.has(item.id));
  if (fillerPool.length === 0) return getFlatSlot(activePlaylist);

  const slot = getFlatSlot(fillerPool);
  return { index: 10_000 + slot.index, offsetMs: slot.offsetMs, item: slot.item };
}

export function getCurrentSlot(): TvSlot {
  if (WEEKLY_SCHEDULE.length > 0) {
    return getScheduledSlot();
  }
  return getFlatSlot(activePlaylist);
}
