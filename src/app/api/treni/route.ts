import { NextResponse } from 'next/server';

export async function GET() {
  const stationCode = 'S08311'; // Capranica-Sutri

  // ViaggiaTreno richiede una data formattata in inglese senza parentesi o fusi estesi
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0]; // HH:mm:ss
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const cleanDate = `${days[now.getDay()]} ${months[now.getMonth()]} ${String(now.getDate()).padStart(2, '0')} ${now.getFullYear()} ${timeStr}`;
  const url = `http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/partenze/${stationCode}/${encodeURIComponent(cleanDate)}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Accept': 'application/json, text/plain, */*'
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      return NextResponse.json(
        { errore: `ViaggiaTreno ha risposto con status ${res.status}`, urlChiamato: url },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { errore: 'Errore di connessione', dettaglio: String(error) },
      { status: 500 }
    );
  }
}