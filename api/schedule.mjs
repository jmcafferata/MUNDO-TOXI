// GET /api/schedule
// Horario semanal — dayOfWeek: 0=Lun, 1=Mar, 2=Mié, 3=Jue, 4=Vie, 5=Sáb, 6=Dom (hora ART)
// startMin: minutos desde medianoche

export const SCHEDULE = [
  // ── LUNES (dow=0) ─────────────────────────────────────────────────────
  { dayOfWeek: 0, startMin: 18*60,      itemId: 'xNpGxSdaSkdi8bqzGoQzAo3laBVRgec8t3T827yrT8M' },
  { dayOfWeek: 0, startMin: 19*60+15,   itemId: 'l3s1Blhidm1trZYlmnOOwH02AzXzPdBo4QNpviWlibF8' },
  { dayOfWeek: 0, startMin: 22*60,      itemId: 'StpQCayHgfczOfy8q9D2UctIoZDrnNTu02ULCQQQr9fA' },

  // ── MARTES (dow=1) ────────────────────────────────────────────────────
  { dayOfWeek: 1, startMin: 15*60,      itemId: 'agfEm3toRbicITlQJbJ4ppPrv700kzCrHmFczRDhmcf8' },
  { dayOfWeek: 1, startMin: 17*60,      itemId: 'irasB01gOUsUd4E4Iy6yVvp7CYMwYMVB00nr4BKU8tn38' },
  { dayOfWeek: 1, startMin: 17*60+15,   itemId: 'N5ISPSMoo502IHjTdvQt02GeR7xgJUiCFTlxrBLLIhpcg' },
  { dayOfWeek: 1, startMin: 20*60,      itemId: 'QUElHo8r5HtNqfh02XfGKm85jUJ01iTGbkyn2D4BeYNZI' },
  { dayOfWeek: 1, startMin: 20*60+15,   itemId: 'HRr2KXg2X800YNuos9Aj2LmZe8XIqHvTMgFrGKc7v7wQ' },
  { dayOfWeek: 1, startMin: 20*60+30,   itemId: 'K6p6zWxcLOtRXb02eWcic00RYQG8SwDxE014o9007ZTBwm8' },
  { dayOfWeek: 1, startMin: 20*60+45,   itemId: 'd1Mu65Kcey02gQtRDtcV00U01U01JYwn9dZettLfFmErz3E' },
  { dayOfWeek: 1, startMin: 21*60,      itemId: 'p75vcYJRLEjPMJo011Z1JOERMO5E013B02KCxYN5DR1Dg8' },
  { dayOfWeek: 1, startMin: 21*60+15,   itemId: 'CbBSyr5FvC7I00PpxpKNJBW1ibyLuT6Lr52uyeZHHyBg' },
  { dayOfWeek: 1, startMin: 22*60,      itemId: 'h5NFgWueG4nldZesITFtEYpnU01CyExDQ02FZ3tSBrp5w' },
  { dayOfWeek: 1, startMin: 22*60+20,   itemId: 'YSqI5Wj9dGRwjMh005Xs6a4Q4IPTdmAQJYa4WU1dH12w' },

  // ── MIÉRCOLES (dow=2) ─────────────────────────────────────────────────
  { dayOfWeek: 2, startMin: 11*60,      itemId: '86NmIj818900IFXfcwEhIyZO3TkP7lYd6NOfqOP8ZSCQ' },
  { dayOfWeek: 2, startMin: 13*60,      itemId: 'qM33QmuwmXJsibPHXJMbFh02V9gT2s7HDEO00v9VB7mHY' },
  { dayOfWeek: 2, startMin: 15*60,      itemId: 'agfEm3toRbicITlQJbJ4ppPrv700kzCrHmFczRDhmcf8' },
  { dayOfWeek: 2, startMin: 17*60,      itemId: 'irasB01gOUsUd4E4Iy6yVvp7CYMwYMVB00nr4BKU8tn38' },
  { dayOfWeek: 2, startMin: 17*60+15,   itemId: 'N5ISPSMoo502IHjTdvQt02GeR7xgJUiCFTlxrBLLIhpcg' },
  { dayOfWeek: 2, startMin: 20*60,      itemId: 'Q3kMlL901ouKhER0101Nzija5Y1025jWBV4ORBXTruuFEyM' },
  { dayOfWeek: 2, startMin: 20*60+15,   itemId: 'UiK7a7RjMI2LkEnxUEthecrAk4chE00OPr7ic1Tn9lG4' },
  { dayOfWeek: 2, startMin: 20*60+30,   itemId: 'oT00wnOnz00iFEzyaOmue00bXx2HOnyX01dII6t4UlGRM7A' },
  { dayOfWeek: 2, startMin: 20*60+45,   itemId: '9pXQ7MUiVlTklMCQdQVdbxoMn85YIC3jObLtzBFN801o' },
  { dayOfWeek: 2, startMin: 21*60,      itemId: 'p75vcYJRLEjPMJo011Z1JOERMO5E013B02KCxYN5DR1Dg8' },
  { dayOfWeek: 2, startMin: 21*60+15,   itemId: 'CbBSyr5FvC7I00PpxpKNJBW1ibyLuT6Lr52uyeZHHyBg' },
  { dayOfWeek: 2, startMin: 22*60,      itemId: 'wj0015QgHhNxFVU01iXuF8z5hvJ7TUnd02UfwqHa447Whs' },

  // ── JUEVES (dow=3) ────────────────────────────────────────────────────
  { dayOfWeek: 3, startMin: 11*60,      itemId: '86NmIj818900IFXfcwEhIyZO3TkP7lYd6NOfqOP8ZSCQ' },
  { dayOfWeek: 3, startMin: 13*60,      itemId: 'qM33QmuwmXJsibPHXJMbFh02V9gT2s7HDEO00v9VB7mHY' },
  { dayOfWeek: 3, startMin: 15*60,      itemId: 'agfEm3toRbicITlQJbJ4ppPrv700kzCrHmFczRDhmcf8' },
  { dayOfWeek: 3, startMin: 17*60,      itemId: 'irasB01gOUsUd4E4Iy6yVvp7CYMwYMVB00nr4BKU8tn38' },
  { dayOfWeek: 3, startMin: 17*60+15,   itemId: 'N5ISPSMoo502IHjTdvQt02GeR7xgJUiCFTlxrBLLIhpcg' },
  { dayOfWeek: 3, startMin: 20*60,      itemId: 'QUElHo8r5HtNqfh02XfGKm85jUJ01iTGbkyn2D4BeYNZI' },
  { dayOfWeek: 3, startMin: 20*60+15,   itemId: 'K6p6zWxcLOtRXb02eWcic00RYQG8SwDxE014o9007ZTBwm8' },
  { dayOfWeek: 3, startMin: 20*60+30,   itemId: 'K6p6zWxcLOtRXb02eWcic00RYQG8SwDxE014o9007ZTBwm8' },
  { dayOfWeek: 3, startMin: 20*60+45,   itemId: 'd1Mu65Kcey02gQtRDtcV00U01U01JYwn9dZettLfFmErz3E' },
  { dayOfWeek: 3, startMin: 21*60,      itemId: 'p75vcYJRLEjPMJo011Z1JOERMO5E013B02KCxYN5DR1Dg8' },
  { dayOfWeek: 3, startMin: 21*60+15,   itemId: 'CbBSyr5FvC7I00PpxpKNJBW1ibyLuT6Lr52uyeZHHyBg' },
  { dayOfWeek: 3, startMin: 22*60,      itemId: 'h5NFgWueG4nldZesITFtEYpnU01CyExDQ02FZ3tSBrp5w' },
  { dayOfWeek: 3, startMin: 22*60+20,   itemId: 'YSqI5Wj9dGRwjMh005Xs6a4Q4IPTdmAQJYa4WU1dH12w' },

  // ── VIERNES (dow=4) ───────────────────────────────────────────────────
  { dayOfWeek: 4, startMin: 11*60,      itemId: '86NmIj818900IFXfcwEhIyZO3TkP7lYd6NOfqOP8ZSCQ' },
  { dayOfWeek: 4, startMin: 13*60,      itemId: 'qM33QmuwmXJsibPHXJMbFh02V9gT2s7HDEO00v9VB7mHY' },
  { dayOfWeek: 4, startMin: 15*60,      itemId: 'agfEm3toRbicITlQJbJ4ppPrv700kzCrHmFczRDhmcf8' },
  { dayOfWeek: 4, startMin: 17*60,      itemId: 'irasB01gOUsUd4E4Iy6yVvp7CYMwYMVB00nr4BKU8tn38' },
  { dayOfWeek: 4, startMin: 17*60+15,   itemId: 'N5ISPSMoo502IHjTdvQt02GeR7xgJUiCFTlxrBLLIhpcg' },
  { dayOfWeek: 4, startMin: 20*60,      itemId: '9pXQ7MUiVlTklMCQdQVdbxoMn85YIC3jObLtzBFN801o' },
  { dayOfWeek: 4, startMin: 20*60+15,   itemId: 'oT00wnOnz00iFEzyaOmue00bXx2HOnyX01dII6t4UlGRM7A' },
  { dayOfWeek: 4, startMin: 20*60+30,   itemId: 'Q3kMlL901ouKhER0101Nzija5Y1025jWBV4ORBXTruuFEyM' },
  { dayOfWeek: 4, startMin: 20*60+45,   itemId: 'UiK7a7RjMI2LkEnxUEthecrAk4chE00OPr7ic1Tn9lG4' },
  { dayOfWeek: 4, startMin: 21*60,      itemId: 'p75vcYJRLEjPMJo011Z1JOERMO5E013B02KCxYN5DR1Dg8' },
  { dayOfWeek: 4, startMin: 21*60+15,   itemId: 'CbBSyr5FvC7I00PpxpKNJBW1ibyLuT6Lr52uyeZHHyBg' },
  { dayOfWeek: 4, startMin: 22*60,      itemId: 'wj0015QgHhNxFVU01iXuF8z5hvJ7TUnd02UfwqHa447Whs' },

  // ── SÁBADO (dow=5) ────────────────────────────────────────────────────
  { dayOfWeek: 5, startMin: 11*60,      itemId: '86NmIj818900IFXfcwEhIyZO3TkP7lYd6NOfqOP8ZSCQ' },
  { dayOfWeek: 5, startMin: 13*60,      itemId: 'qM33QmuwmXJsibPHXJMbFh02V9gT2s7HDEO00v9VB7mHY' },
  { dayOfWeek: 5, startMin: 15*60,      itemId: 'agfEm3toRbicITlQJbJ4ppPrv700kzCrHmFczRDhmcf8' },
  { dayOfWeek: 5, startMin: 17*60,      itemId: 'irasB01gOUsUd4E4Iy6yVvp7CYMwYMVB00nr4BKU8tn38' },
  { dayOfWeek: 5, startMin: 17*60+15,   itemId: 'N5ISPSMoo502IHjTdvQt02GeR7xgJUiCFTlxrBLLIhpcg' },
  { dayOfWeek: 5, startMin: 20*60,      itemId: 'QUElHo8r5HtNqfh02XfGKm85jUJ01iTGbkyn2D4BeYNZI' },
  { dayOfWeek: 5, startMin: 20*60+15,   itemId: 'K6p6zWxcLOtRXb02eWcic00RYQG8SwDxE014o9007ZTBwm8' },
  { dayOfWeek: 5, startMin: 20*60+30,   itemId: 'HRr2KXg2X800YNuos9Aj2LmZe8XIqHvTMgFrGKc7v7wQ' },
  { dayOfWeek: 5, startMin: 20*60+45,   itemId: 'd1Mu65Kcey02gQtRDtcV00U01U01JYwn9dZettLfFmErz3E' },
  { dayOfWeek: 5, startMin: 21*60,      itemId: 'p75vcYJRLEjPMJo011Z1JOERMO5E013B02KCxYN5DR1Dg8' },
  { dayOfWeek: 5, startMin: 21*60+15,   itemId: 'CbBSyr5FvC7I00PpxpKNJBW1ibyLuT6Lr52uyeZHHyBg' },
  { dayOfWeek: 5, startMin: 22*60,      itemId: 'h5NFgWueG4nldZesITFtEYpnU01CyExDQ02FZ3tSBrp5w' },
  { dayOfWeek: 5, startMin: 22*60+20,   itemId: 'YSqI5Wj9dGRwjMh005Xs6a4Q4IPTdmAQJYa4WU1dH12w' },

  // ── DOMINGO (dow=6) ───────────────────────────────────────────────────
  { dayOfWeek: 6, startMin: 11*60,      itemId: '86NmIj818900IFXfcwEhIyZO3TkP7lYd6NOfqOP8ZSCQ' },
  { dayOfWeek: 6, startMin: 13*60,      itemId: 'qM33QmuwmXJsibPHXJMbFh02V9gT2s7HDEO00v9VB7mHY' },
  { dayOfWeek: 6, startMin: 15*60,      itemId: 'agfEm3toRbicITlQJbJ4ppPrv700kzCrHmFczRDhmcf8' },
  { dayOfWeek: 6, startMin: 17*60,      itemId: 'irasB01gOUsUd4E4Iy6yVvp7CYMwYMVB00nr4BKU8tn38' },
  { dayOfWeek: 6, startMin: 17*60+15,   itemId: 'N5ISPSMoo502IHjTdvQt02GeR7xgJUiCFTlxrBLLIhpcg' },
  { dayOfWeek: 6, startMin: 20*60,      itemId: '9pXQ7MUiVlTklMCQdQVdbxoMn85YIC3jObLtzBFN801o' },
  { dayOfWeek: 6, startMin: 20*60+15,   itemId: 'oT00wnOnz00iFEzyaOmue00bXx2HOnyX01dII6t4UlGRM7A' },
  { dayOfWeek: 6, startMin: 20*60+30,   itemId: 'Q3kMlL901ouKhER0101Nzija5Y1025jWBV4ORBXTruuFEyM' },
  { dayOfWeek: 6, startMin: 20*60+45,   itemId: 'UiK7a7RjMI2LkEnxUEthecrAk4chE00OPr7ic1Tn9lG4' },
  { dayOfWeek: 6, startMin: 21*60,      itemId: 'p75vcYJRLEjPMJo011Z1JOERMO5E013B02KCxYN5DR1Dg8' },
  { dayOfWeek: 6, startMin: 21*60+15,   itemId: 'CbBSyr5FvC7I00PpxpKNJBW1ibyLuT6Lr52uyeZHHyBg' },
  { dayOfWeek: 6, startMin: 22*60,      itemId: 'h5NFgWueG4nldZesITFtEYpnU01CyExDQ02FZ3tSBrp5w' },
  { dayOfWeek: 6, startMin: 22*60+20,   itemId: 'YSqI5Wj9dGRwjMh005Xs6a4Q4IPTdmAQJYa4WU1dH12w' },
];
  // ── JUEVES (dow=3) ────────────────────────────────────────────────
  { dayOfWeek: 3, startMin: 17*60,      itemId: 'N5ISPSMoo502IHjTdvQt02GeR7xgJUiCFTlxrBLLIhpcg' },
  { dayOfWeek: 3, startMin: 18*60,      itemId: 'RSWU4WdVz3eD3yoZalubHKBGZMfB00Z00PJgK7KVp6zN00' },
  { dayOfWeek: 3, startMin: 20*60,      itemId: 'UiK7a7RjMI2LkEnxUEthecrAk4chE00OPr7ic1Tn9lG4' },
  { dayOfWeek: 3, startMin: 20*60+15,   itemId: 'QUElHo8r5HtNqfh02XfGKm85jUJ01iTGbkyn2D4BeYNZI' },
  { dayOfWeek: 3, startMin: 20*60+30,   itemId: 'd1Mu65Kcey02gQtRDtcV00U01U01JYwn9dZettLfFmErz3E' },
  { dayOfWeek: 3, startMin: 20*60+45,   itemId: 'QUElHo8r5HtNqfh02XfGKm85jUJ01iTGbkyn2D4BeYNZI' },
  { dayOfWeek: 3, startMin: 21*60,      itemId: 'p75vcYJRLEjPMJo011Z1JOERMO5E013B02KCxYN5DR1Dg8' },
  { dayOfWeek: 3, startMin: 21*60+15,   itemId: 'KqSlF5LSKjW028548zaZ5c7aPQNARdgA9pbuTGrL800r8' },
  { dayOfWeek: 3, startMin: 21*60+30,   itemId: 'p75vcYJRLEjPMJo011Z1JOERMO5E013B02KCxYN5DR1Dg8' },
  { dayOfWeek: 3, startMin: 21*60+45,   itemId: 'KqSlF5LSKjW028548zaZ5c7aPQNARdgA9pbuTGrL800r8' },
  { dayOfWeek: 3, startMin: 22*60,      itemId: 'YSqI5Wj9dGRwjMh005Xs6a4Q4IPTdmAQJYa4WU1dH12w' },
  { dayOfWeek: 3, startMin: 23*60,      itemId: 'iytKgjz1JJhz3Kl01WLcTCFZ9DTVClWf00kn71ACPW1AU' },
  { dayOfWeek: 3, startMin: 23*60+15,   itemId: 'iVB2ZU00L1WZDQJpqXrIAMg02Cmq4l6C2kKnP02sNP01CQM' },

  // ── VIERNES (dow=4) ───────────────────────────────────────────────
  { dayOfWeek: 4, startMin: 11*60,      itemId: '86NmIj818900IFXfcwEhIyZO3TkP7lYd6NOfqOP8ZSCQ' },
  { dayOfWeek: 4, startMin: 13*60,      itemId: 'qM33QmuwmXJsibPHXJMbFh02V9gT2s7HDEO00v9VB7mHY' },
  { dayOfWeek: 4, startMin: 15*60,      itemId: 'agfEm3toRbicITlQJbJ4ppPrv700kzCrHmFczRDhmcf8' },
  { dayOfWeek: 4, startMin: 17*60,      itemId: 'N5ISPSMoo502IHjTdvQt02GeR7xgJUiCFTlxrBLLIhpcg' },
  { dayOfWeek: 4, startMin: 18*60,      itemId: 'RSWU4WdVz3eD3yoZalubHKBGZMfB00Z00PJgK7KVp6zN00' },
  { dayOfWeek: 4, startMin: 20*60,      itemId: 'QUElHo8r5HtNqfh02XfGKm85jUJ01iTGbkyn2D4BeYNZI' },
  { dayOfWeek: 4, startMin: 20*60+15,   itemId: 'K6p6zWxcLOtRXb02eWcic00RYQG8SwDxE014o9007ZTBwm8' },
  { dayOfWeek: 4, startMin: 20*60+30,   itemId: 'd1Mu65Kcey02gQtRDtcV00U01U01JYwn9dZettLfFmErz3E' },
  { dayOfWeek: 4, startMin: 20*60+45,   itemId: 'UiK7a7RjMI2LkEnxUEthecrAk4chE00OPr7ic1Tn9lG4' },
  { dayOfWeek: 4, startMin: 21*60,      itemId: 'CbBSyr5FvC7I00PpxpKNJBW1ibyLuT6Lr52uyeZHHyBg' },
  { dayOfWeek: 4, startMin: 21*60+45,   itemId: 'p75vcYJRLEjPMJo011Z1JOERMO5E013B02KCxYN5DR1Dg8' },
  { dayOfWeek: 4, startMin: 22*60,      itemId: 'h5NFgWueG4nldZesITFtEYpnU01CyExDQ02FZ3tSBrp5w' },
  { dayOfWeek: 4, startMin: 22*60+30,   itemId: 'h5NFgWueG4nldZesITFtEYpnU01CyExDQ02FZ3tSBrp5w' },
  { dayOfWeek: 4, startMin: 23*60,      itemId: 'IHikcrMnpK00Dxsyb7xKpi1qpju01I00JmCpNXXrhg1WZg' },

  // ── SÁBADO (dow=5) ────────────────────────────────────────────────
  { dayOfWeek: 5, startMin: 11*60,      itemId: '86NmIj818900IFXfcwEhIyZO3TkP7lYd6NOfqOP8ZSCQ' },
  { dayOfWeek: 5, startMin: 13*60,      itemId: 'qM33QmuwmXJsibPHXJMbFh02V9gT2s7HDEO00v9VB7mHY' },
  { dayOfWeek: 5, startMin: 15*60,      itemId: 'agfEm3toRbicITlQJbJ4ppPrv700kzCrHmFczRDhmcf8' },
  { dayOfWeek: 5, startMin: 17*60,      itemId: 'N5ISPSMoo502IHjTdvQt02GeR7xgJUiCFTlxrBLLIhpcg' },
  { dayOfWeek: 5, startMin: 18*60,      itemId: 'RSWU4WdVz3eD3yoZalubHKBGZMfB00Z00PJgK7KVp6zN00' },
  { dayOfWeek: 5, startMin: 20*60,      itemId: 'K6p6zWxcLOtRXb02eWcic00RYQG8SwDxE014o9007ZTBwm8' },
  { dayOfWeek: 5, startMin: 20*60+15,   itemId: 'Q3kMlL901ouKhER0101Nzija5Y1025jWBV4ORBXTruuFEyM' },
  { dayOfWeek: 5, startMin: 20*60+30,   itemId: 'd1Mu65Kcey02gQtRDtcV00U01U01JYwn9dZettLfFmErz3E' },
  { dayOfWeek: 5, startMin: 20*60+45,   itemId: 'K6p6zWxcLOtRXb02eWcic00RYQG8SwDxE014o9007ZTBwm8' },
  { dayOfWeek: 5, startMin: 21*60,      itemId: 'p75vcYJRLEjPMJo011Z1JOERMO5E013B02KCxYN5DR1Dg8' },
  { dayOfWeek: 5, startMin: 21*60+15,   itemId: 'KqSlF5LSKjW028548zaZ5c7aPQNARdgA9pbuTGrL800r8' },
  { dayOfWeek: 5, startMin: 21*60+30,   itemId: 'p75vcYJRLEjPMJo011Z1JOERMO5E013B02KCxYN5DR1Dg8' },
  { dayOfWeek: 5, startMin: 21*60+45,   itemId: 'KqSlF5LSKjW028548zaZ5c7aPQNARdgA9pbuTGrL800r8' },
  { dayOfWeek: 5, startMin: 22*60,      itemId: 'wj0015QgHhNxFVU01iXuF8z5hvJ7TUnd02UfwqHa447Whs' },
  { dayOfWeek: 5, startMin: 23*60,      itemId: 'RUULhR2QDMRZT01YDXggu7WPKI01nzGyzvK1RPwGY3GyQ' },

  // ── DOMINGO (dow=6) ───────────────────────────────────────────────
  { dayOfWeek: 6, startMin: 11*60,      itemId: '86NmIj818900IFXfcwEhIyZO3TkP7lYd6NOfqOP8ZSCQ' },
  { dayOfWeek: 6, startMin: 13*60,      itemId: 'qM33QmuwmXJsibPHXJMbFh02V9gT2s7HDEO00v9VB7mHY' },
  { dayOfWeek: 6, startMin: 15*60,      itemId: 'agfEm3toRbicITlQJbJ4ppPrv700kzCrHmFczRDhmcf8' },
  { dayOfWeek: 6, startMin: 17*60,      itemId: 'N5ISPSMoo502IHjTdvQt02GeR7xgJUiCFTlxrBLLIhpcg' },
  { dayOfWeek: 6, startMin: 18*60,      itemId: 'RSWU4WdVz3eD3yoZalubHKBGZMfB00Z00PJgK7KVp6zN00' },
  { dayOfWeek: 6, startMin: 20*60,      itemId: 'Q3kMlL901ouKhER0101Nzija5Y1025jWBV4ORBXTruuFEyM' },
  { dayOfWeek: 6, startMin: 20*60+15,   itemId: 'HRr2KXg2X800YNuos9Aj2LmZe8XIqHvTMgFrGKc7v7wQ' },
  { dayOfWeek: 6, startMin: 20*60+30,   itemId: 'd1Mu65Kcey02gQtRDtcV00U01U01JYwn9dZettLfFmErz3E' },
  { dayOfWeek: 6, startMin: 20*60+45,   itemId: 'UiK7a7RjMI2LkEnxUEthecrAk4chE00OPr7ic1Tn9lG4' },
  { dayOfWeek: 6, startMin: 21*60,      itemId: 'CbBSyr5FvC7I00PpxpKNJBW1ibyLuT6Lr52uyeZHHyBg' },
  { dayOfWeek: 6, startMin: 21*60+45,   itemId: 'p75vcYJRLEjPMJo011Z1JOERMO5E013B02KCxYN5DR1Dg8' },
  { dayOfWeek: 6, startMin: 22*60,      itemId: 'YSqI5Wj9dGRwjMh005Xs6a4Q4IPTdmAQJYa4WU1dH12w' },
];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  res.status(200).json(SCHEDULE);
}
