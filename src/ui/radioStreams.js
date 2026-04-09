/**
 * Curated list of free internet radio streams from around the world.
 * All URLs are direct audio streams (MP3/AAC) compatible with HTML5 <audio>.
 *
 * To add a new stream: ensure it responds to HEAD requests with an audio
 * content-type and doesn't require authentication or CORS proxying.
 */
const RADIO_STREAMS = [
  // South America
  { url: 'https://icecast2.ufpel.edu.br/live', label: '🇧🇷 Brazil — UFPel Radio (Pop/Eclectic)' },

  // North America — SomaFM (San Francisco, donation-supported, no ads)
  { url: 'https://ice1.somafm.com/groovesalad-256-mp3', label: '🇺🇸 USA — Groove Salad (Ambient/Downtempo)' },
  { url: 'https://ice1.somafm.com/dronezone-256-mp3', label: '🇺🇸 USA — Drone Zone (Space Ambient)' },
  { url: 'https://ice1.somafm.com/defcon-256-mp3', label: '🇺🇸 USA — DEF CON (Dark Electronic)' },
  { url: 'https://ice1.somafm.com/deepspaceone-128-mp3', label: '🇺🇸 USA — Deep Space One (Deep House)' },
  { url: 'https://ice1.somafm.com/seventies-320-mp3', label: '🇺🇸 USA — Left Coast 70s (Classic Rock)' },
  { url: 'https://ice1.somafm.com/lush-128-mp3', label: '🇺🇸 USA — Lush (Sensual Downtempo)' },
  { url: 'https://ice1.somafm.com/spacestation-128-mp3', label: '🇺🇸 USA — Space Station Soma (Ambient)' },
  { url: 'https://stream.radioparadise.com/aac-320', label: '🇺🇸 USA — Radio Paradise (Eclectic Rock)' },
  { url: 'https://listen.181fm.com/181-classical_128k.mp3', label: '🇺🇸 USA — 181.fm Classical (Orchestral)' },

  // Europe — France (Radio France, public radio)
  { url: 'https://icecast.radiofrance.fr/fip-midfi.mp3', label: '🇫🇷 France — FIP (Eclectic World/Jazz)' },
  { url: 'https://icecast.radiofrance.fr/fipjazz-midfi.mp3', label: '🇫🇷 France — FIP Jazz (24/7 Jazz)' },
  { url: 'https://icecast.radiofrance.fr/fipelectro-midfi.mp3', label: '🇫🇷 France — FIP Electro (Electronic)' },
  { url: 'https://icecast.radiofrance.fr/fipworld-midfi.mp3', label: '🇫🇷 France — FIP World (World Music)' },
  { url: 'https://icecast.radiofrance.fr/fiphiphop-midfi.mp3', label: '🇫🇷 France — FIP Hip-Hop (Rap/Hip-Hop)' },

  // Internet-only
  { url: 'https://radio.plaza.one/mp3', label: '🌐 Internet — Plaza One (Vaporwave/Future Funk)' },

  // Custom URL option (must be last)
  { url: 'custom', label: '✏️ Custom URL...' },
];

export default RADIO_STREAMS;
