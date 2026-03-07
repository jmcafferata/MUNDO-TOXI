// TOXI Media — Catálogo de contenidos en Mux
// Fuente de verdad para tv.html y grillas de contenidos.
//
//   id       → Mux Playback ID (on-demand)
//   duration → Duración en segundos
//   title    → Título de pantalla
//   slug     → Para URLs futuras
//   type     → film | short | series | live | event | other
//   year     → Año de producción
//   onTV     → true = incluido en la playlist del canal

export const CONTENT = [

  // ── CURADOS: en el canal ───────────────────────────────────
  { id: 'iytKgjz1JJhz3Kl01WLcTCFZ9DTVClWf00kn71ACPW1AU', duration: 339.548, title: 'Hotel Oriente', slug: 'hotel-oriente', type: 'film', year: 2025, onTV: true },
  { id: 'iVB2ZU00L1WZDQJpqXrIAMg02Cmq4l6C2kKnP02sNP01CQM', duration: 687.228, title: 'Hotel Oriente — Detrás de Escena', slug: 'hotel-oriente-bts', type: 'short', year: 2025, onTV: true },
  { id: 'IHikcrMnpK00Dxsyb7xKpi1qpju01I00JmCpNXXrhg1WZg', duration: 163.081, title: 'Detective Noir', slug: 'detective-noir', type: 'short', year: 2025, onTV: true },
  { id: 'RUULhR2QDMRZT01YDXggu7WPKI01nzGyzvK1RPwGY3GyQ', duration: 498.499, title: 'Ver para Coger', slug: 'ver-para-coger', type: 'film', year: 2025, onTV: true },
  { id: 'Mqf9GhKKFmd01IH28ITZ00KT4oGLxmr6gvqbNQjGIv301Y', duration: 5563.892, title: 'We Will Rock You', slug: 'we-will-rock-you', type: 'event', year: 2025, onTV: true },

  // ── CATÁLOGO: pendientes de clasificar ────────────────────
  { id: 'cUI9VC3LTXXxk62iQ902Gd84AJVhg3Gd8lhFczPBuqrI', duration: 79.533333, title: '(ICU) Think about v1', slug: '', type: 'other', year: null, onTV: true },
  { id: 'B02Qs6Wm3TGMjxm5EZKRowHdNTUPb020048AMJa45YDXVM', duration: 1060.893178, title: '17 Minutos con Cata', slug: '', type: 'other', year: null, onTV: true },
  { id: 'IjUQQvDDhAOMHHS57ORIVl9f01vvb5425FmzPIdF5LRI', duration: 73.633333, title: 'A Game of Drones _ Early Access Trailer', slug: '', type: 'other', year: null, onTV: true },
  { id: 'A14ToM2G9Mmi101NejPlGtAjj8oNGWnyIt302xeWw3oHw', duration: 605.146211, title: 'After You\'re Gone - Fancy Dogs™', slug: '', type: 'other', year: null, onTV: true },
  { id: 'CbBSyr5FvC7I00PpxpKNJBW1ibyLuT6Lr52uyeZHHyBg', duration: 2457.566667, title: 'Alfredo Cafferata en TOXI Media', slug: '', type: 'other', year: null, onTV: true },
  { id: 'z02O01aMd02YkbeUb01syS400owVLRZ4oOJ6m463hcQ7FseQ', duration: 956.08, title: 'BAFICI Nights con Fabrizio Sanguinetti', slug: '', type: 'other', year: null, onTV: true },
  { id: 'SKB56hnQQV6Tame5VKea02w8E01Ijm7iyHUY5dZXYHKmU', duration: 1270.811211, title: 'Bebop Big Band _ 7 Abril 2025 _ Bebop Club', slug: '', type: 'other', year: null, onTV: true },
  { id: 'KrzHBlHcZCL71mIfCoPKiCMs2iBQMAq8vbhXr701OtQg', duration: 17.966667, title: 'Carola Gil le informa a Carlos Pagni la existencia de Pizza & Pagni', slug: '', type: 'other', year: null, onTV: true },
  { id: 'm8ehCQajSn5f8LVTIdGUNlAePZ7iARoXJHCFjOCmkxE', duration: 30.196844, title: 'Charlas interactivas _ Xplora Academy', slug: '', type: 'other', year: null, onTV: true },
  { id: 'FZAP5bJ2O5L16da7Ls1YdSGIiGEZfqTf02dR46z8tfk00', duration: 588.254344, title: 'Cuento de la selva', slug: '', type: 'other', year: null, onTV: true },
  { id: 'KqSlF5LSKjW028548zaZ5c7aPQNARdgA9pbuTGrL800r8', duration: 616.782844, title: 'Desarrollos regenerativos _ Novedades María Teresa', slug: '', type: 'other', year: null, onTV: true },
  { id: 'Lsb01QL2dVq63701jEQ01d2DgIo4T2ZzNnRSGNIYeCpX4s', duration: 17.267256, title: 'Detrás de las risas - Teaser', slug: '', type: 'other', year: null, onTV: true },
  { id: 'PDLQLpJTnqba3Rn6HBdwb6SJwDR5Tmtm02WZH6jNzsFY', duration: 2619.033089, title: 'El maravilloso mundo de TOXI', slug: '', type: 'other', year: null, onTV: true },
  { id: 'z3jU3rp9rTOr95501nz025OP2q9FIz89cwPHO7kyT7Lb8', duration: 63.866667, title: 'Galaxy adventure 2', slug: '', type: 'other', year: null, onTV: true },
  { id: '2yiwT02f7uhnx6yX01qo4b52iffRv8CSVqyMBsYNR02zLY', duration: 1333.457133, title: 'IDA - Claire Fatale & Julian Camps - Live perfo', slug: '', type: 'other', year: null, onTV: true },
  { id: '86NmIj818900IFXfcwEhIyZO3TkP7lYd6NOfqOP8ZSCQ', duration: 6958.04, title: 'Inteligencia Artificial, Abogacía y el Desafío de la Modernización Judicial, con IAN SILBERBERG', slug: '', type: 'other', year: null, onTV: true },
  { id: '8zmmEvU01roD01y1JxwUY5LWW3OcO61YiGw6UWqpxsyoY', duration: 196.321133, title: 'It´s a Jungle Out There', slug: '', type: 'other', year: null, onTV: true },
  { id: 'l3s1Blhidm1trZYlmnOOwH02AzXzPdBo4QNpviWlibF8', duration: 957.247967, title: 'LO QUE SE AVECINA _ Piloto', slug: '', type: 'other', year: null, onTV: true },
  { id: 'NMymlct00uz1BJMqcJUjcdfSbXGXfoaYuq3bDg702WQlY', duration: 556.389178, title: 'La Biblioteca Café - Viernes 30 de agosto', slug: '', type: 'other', year: null, onTV: true },
  { id: 'xNpGxSdaSkdi8bqzGoQzAo3laBVRgec8t3T827yrT8M', duration: 206.748211, title: 'La irracional', slug: '', type: 'other', year: null, onTV: true },
  { id: 'StpQCayHgfczOfy8q9D2UctIoZDrnNTu02ULCQQQr9fA', duration: 108.483378, title: 'Las formas del laberinto _ Trailer', slug: '', type: 'other', year: null, onTV: true },
  { id: 'q2oWATOAQGdVl3AdhoyAmZ8Zwk6BhJkne02Pk31bwHg4', duration: 42.0003, title: 'Las siestas de Sol', slug: '', type: 'other', year: null, onTV: true },
  { id: 'vNMBQmE2Q6YaxmESqvh2yYZsqfjtpnu9kJp7QKFvRgs', duration: 243.952044, title: 'Lectura en francés _ Juana la Loca', slug: '', type: 'other', year: null, onTV: true },
  { id: '02gDf9x8Z01J8ISIKrlC9DMItd02UI029ikQ1T29Sca02z1U', duration: 53.094711, title: 'MONIYISUS - Trailer', slug: '', type: 'other', year: null, onTV: true },
  { id: 'GHZVMKXJaoMnrUxUfVhSVn300gxnFxCSJKK01k3rOKmks', duration: 34.701344, title: 'Maxi Mancuso Quintet - Difusión', slug: '', type: 'other', year: null, onTV: true },
  { id: 'DE01AR1H01dk7JY9q8RsBP7jk122hRQaxKkMJRxirNQWM', duration: 151.860044, title: 'Mentoría de comunicación, locución y doblaje con Demi Roch', slug: '', type: 'other', year: null, onTV: true },
  { id: '02lxmxwxBURGEtO4XtvXro024Zl8yOCUsf6AzfGEkiuSU', duration: 1868.408211, title: 'Mesa torcida piloto', slug: '', type: 'other', year: null, onTV: true },
  { id: 'd1Mu65Kcey02gQtRDtcV00U01U01JYwn9dZettLfFmErz3E', duration: 587.0448, title: 'Misión_ ODELAR', slug: '', type: 'other', year: null, onTV: true },
  { id: 'E3b021s023Mdu65576vdhrby5yciv8SrPeFdy96LZOOas', duration: 2575.533333, title: 'Moni y Yisus entrevistan a Maxi Mancuso en TOXI _ MONIYISUS #1', slug: '', type: 'other', year: null, onTV: true },
  { id: 'h5NFgWueG4nldZesITFtEYpnU01CyExDQ02FZ3tSBrp5w', duration: 1167.467467, title: 'Moni y Yisus entrevistan a Rose Cafferata (fan de Ariana Grande) en TOXI _ MONIYISUS #2', slug: '', type: 'other', year: null, onTV: true },
  { id: 'YSqI5Wj9dGRwjMh005Xs6a4Q4IPTdmAQJYa4WU1dH12w', duration: 2489.820678, title: 'Moni y Yisus entrevistan al Padre Tomás Méndez _ MONIYISUS #4', slug: '', type: 'other', year: null, onTV: true },
  { id: '9pXQ7MUiVlTklMCQdQVdbxoMn85YIC3jObLtzBFN801o', duration: 137.220422, title: 'Muerte y miedo en las calles _ OTRO DÍA EN LA RED', slug: '', type: 'other', year: null, onTV: true },
  { id: 'oT00wnOnz00iFEzyaOmue00bXx2HOnyX01dII6t4UlGRM7A', duration: 181.764922, title: 'Ni Jorges y Borges_ Odelar 6!', slug: '', type: 'other', year: null, onTV: true },
  { id: 'Q3kMlL901ouKhER0101Nzija5Y1025jWBV4ORBXTruuFEyM', duration: 455.538422, title: 'ODELaR _ Otro día en la red IV', slug: '', type: 'other', year: null, onTV: true },
  { id: 'UiK7a7RjMI2LkEnxUEthecrAk4chE00OPr7ic1Tn9lG4', duration: 376.250878, title: 'Otro día en la red _ Capítulo 1', slug: '', type: 'other', year: null, onTV: true },
  { id: '1z01wgDyw3WEGJZXc00qZsWXXqo3hIfCQHMWK8mGsKX01Y', duration: 635.384756, title: 'PROTOTIPAZOS _ Piloto La Impact', slug: '', type: 'other', year: null, onTV: true },
  { id: 'ec1emgWV3VZVz4G0200wUSiUrV5y4j8jlyjgC8JXn1rFs', duration: 272.939344, title: 'Palta and the Gang - Luna Park - 9 de mayo de 2024', slug: '', type: 'other', year: null, onTV: true },
  { id: 'X7YJlq50211xQS2d9Vi01aD3QY8QKx8nJOC2hWD1ELc5k', duration: 224.140589, title: 'Para qué sirve todo esto', slug: '', type: 'other', year: null, onTV: true },
  { id: 'HPsNUFZfR8NY6Tq2qv02NToxV8noBJ8BAGDE59OCD01Kc', duration: 217.133589, title: 'Pierrot le bolou', slug: '', type: 'other', year: null, onTV: true },
  { id: 'dJKlr23ualq86KvwfVoMx02g755YL02p6pQQ8dyfghEsc', duration: 19.9783, title: 'Prez - Trailer HD', slug: '', type: 'other', year: null, onTV: true },
  { id: 'R1EGXfq1DUGMrFblrMMGuppU02fQf01i1LGENQY9m46Ls', duration: 224.1823, title: 'RAKU 楽焼', slug: '', type: 'other', year: null, onTV: true },
  { id: 'XDIDz4TQ34vozsemiHeyuzMi6OuqQR7oAB1HHaVCIOA', duration: 166.541378, title: 'REEL 1 HORIZ - V3', slug: '', type: 'other', year: null, onTV: true },
  { id: '2EFUXtMAx4u7QFmnXYC01P00cgpa4z02QqKVgSAkcuqYpg', duration: 101.551467, title: 'REEL 3 AD HORIZONTAL', slug: '', type: 'other', year: null, onTV: true },
  { id: 'k5WwHsdgrHNOzSdhUDGjjRVsK02u00WPQgQKhgYUYDtbk', duration: 104.020589, title: 'REINICIA Copy 02', slug: '', type: 'other', year: null, onTV: true },
  { id: 'fID5sJbpqtFK01iIllxmwkTE5FvJnI3J7icA3Qjo009gU', duration: 412.328589, title: 'Recoleta bajo la lluvia - Discover BA con Luz', slug: '', type: 'other', year: null, onTV: true },
  { id: 'p75vcYJRLEjPMJo011Z1JOERMO5E013B02KCxYN5DR1Dg8', duration: 604.687422, title: 'Santuario del Maipo _ Proyecto de Infiltración & Agricultura Sintrópica – Aguatierra', slug: '', type: 'other', year: null, onTV: true },
  { id: 'A7KK900TZvE7DOahDzDEncIz02GbxxJz8IJo01DCaVbOvE', duration: 241.241011, title: 'Sábado a la noche', slug: '', type: 'other', year: null, onTV: true },
  { id: 'qM33QmuwmXJsibPHXJMbFh02V9gT2s7HDEO00v9VB7mHY', duration: 4983.850522, title: 'TOXI Seminars Vol. II_ Peronismos (Fabrizio Sanguinetti)', slug: '', type: 'other', year: null, onTV: true },
  { id: 'wj0015QgHhNxFVU01iXuF8z5hvJ7TUnd02UfwqHa447Whs', duration: 2898.3, title: 'TOXI_ Más allá del más allá _ MONIYISUS #4', slug: '', type: 'other', year: null, onTV: true },
  { id: '00kmeFWt6viiA02WHx9P01PnsY1RolhnyufiNhf5na7VsE', duration: 4863.358511, title: 'The Greatest Showman obra completa EDLP', slug: '', type: 'other', year: null, onTV: true },
  { id: 'CAG692TzvxtvAQEoR01byCm01xKJUp6GqyJalgQ0200Z6n00', duration: 92.251, title: 'Trailer-Las-catadoras-del-fuhrer', slug: '', type: 'other', year: null, onTV: true },
  { id: 'mlTTKbkPDdOTvu963D1p00vz8pihOYpo2iefwZowJP6M', duration: 241.958333, title: 'Viaje - Fermin Tz', slug: '', type: 'other', year: null, onTV: true },
  { id: '00W5eEfLg02tB7S2Vy5tEQfHYdsiaxSy9Lj4esbdbsOUI', duration: 2868.448922, title: 'Xplora Night Live _ Martes, 8 de abril de 2025 _ Crudo (1)', slug: '', type: 'other', year: null, onTV: true },
  { id: '7KfrMVUZL2bANgKGsxeWjCnrOTK1DRuUOe9701UO7424', duration: 2868.448922, title: 'Xplora Night Live _ Martes, 8 de abril de 2025 _ Crudo', slug: '', type: 'other', year: null, onTV: true },
  { id: 'cseBPfceuHCbWY3D2OF7WMtQ7DmaYhSdR4ekSOD7QT4', duration: 161.027533, title: 'Yuyo Noé recorre la obra Las formas del laberinto de Dolores Casares', slug: '', type: 'other', year: null, onTV: true },
  { id: 'yyJADkna02dmJtNdyUoHDOYQMcjsxKcjf63O00w01mm1ZI', duration: 149.6495, title: 'fiesta en la cocina_final v2', slug: '', type: 'other', year: null, onTV: true },
  { id: '00VG6EL1oC4eI96PVQXeobbdZ6GBNwrmUAexIDdiMpTc', duration: 160.326833, title: 'hipo hip hop final', slug: '', type: 'other', year: null, onTV: true },
  { id: 'QUElHo8r5HtNqfh02XfGKm85jUJ01iTGbkyn2D4BeYNZI', duration: 189.148256, title: 'juanse y los pibes', slug: '', type: 'other', year: null, onTV: true },
  { id: 'K6p6zWxcLOtRXb02eWcic00RYQG8SwDxE014o9007ZTBwm8', duration: 588.629711, title: 'nota afuera', slug: '', type: 'other', year: null, onTV: true },
  { id: '2M1OrsTy02LXxW9WxTqMgUxyCiKPzsjjPkor7ZCL9CfE', duration: 230.480256, title: 'viaje a la luna ', slug: '', type: 'other', year: null, onTV: true },
  { id: 'jRBL9g01D6l9rIIL419200N4ZOQyA0202n9P02lI02eBof02IY', duration: 80.830756, title: '¿Qué es Mamarracho_', slug: '', type: 'other', year: null, onTV: true },
];

/** Solo los videos marcados onTV: true, en orden para la playlist del canal */
export const TV_PLAYLIST = CONTENT.filter(v => v.onTV && v.title);