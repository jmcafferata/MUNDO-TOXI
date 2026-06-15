package media.toxi.radio

data class TvItem(val id: String, val duration: Double, val title: String)
data class TvSlot(val index: Int, val offsetMs: Long, val item: TvItem)

// Misma epoch que radio.html para que la app y la web queden alineadas.
const val EPOCH_SEC = 1767225600L

val RADIO_PLAYLIST = listOf(
    TvItem("N5ISPSMoo502IHjTdvQt02GeR7xgJUiCFTlxrBLLIhpcg", 2580.9, "Literatura y Realidad Virtual — Ana Arzoumanian"),
    TvItem("CbBSyr5FvC7I00PpxpKNJBW1ibyLuT6Lr52uyeZHHyBg", 2457.566667, "Alfredo Cafferata en TOXI Media"),
    TvItem("agfEm3toRbicITlQJbJ4ppPrv700kzCrHmFczRDhmcf8", 5693.633333, "Storytelling y Transgresión — Gael P. Rossi")
)

fun getCurrentSlot(): TvSlot = getFlatSlot(RADIO_PLAYLIST)

fun getNextTitle(index: Int): String = RADIO_PLAYLIST[(index + 1) % RADIO_PLAYLIST.size].title

private fun getFlatSlot(playlist: List<TvItem>): TvSlot {
    val totalDuration = playlist.sumOf { it.duration }
    val nowSec = System.currentTimeMillis() / 1000.0
    val elapsed = ((nowSec - EPOCH_SEC) % totalDuration + totalDuration) % totalDuration
    var acc = 0.0

    for ((i, item) in playlist.withIndex()) {
        acc += item.duration
        if (elapsed < acc) {
            val offset = elapsed - (acc - item.duration)
            return TvSlot(i, (offset * 1000).toLong(), item)
        }
    }

    return TvSlot(0, 0L, playlist[0])
}
