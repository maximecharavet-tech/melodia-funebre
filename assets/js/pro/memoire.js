// IndexedDB minimal : brouillons de questionnaire, file d'envoi hors ligne,
// état de la démonstration. Rien de sensible ne part ailleurs que sur
// l'appareil tant que la personne n'enregistre pas sur le serveur.
const NOM = 'melodia-pro';
const VERSION = 1;
let base = null;

function ouvrir() {
  if (base) return base;
  base = new Promise((resoudre, rejeter) => {
    const r = indexedDB.open(NOM, VERSION);
    r.onupgradeneeded = () => {
      const db = r.result;
      for (const s of ['brouillons', 'file', 'demo']) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s);
    };
    r.onsuccess = () => resoudre(r.result);
    r.onerror = () => rejeter(r.error);
  });
  return base;
}

async function tx(magasin, mode, f) {
  const db = await ouvrir();
  return new Promise((resoudre, rejeter) => {
    const t = db.transaction(magasin, mode);
    const s = t.objectStore(magasin);
    const r = f(s);
    t.oncomplete = () => resoudre(r && 'result' in r ? r.result : undefined);
    t.onerror = () => rejeter(t.error);
  });
}

export const lire = (magasin, cle) => tx(magasin, 'readonly', (s) => s.get(cle));
export const ecrire = (magasin, cle, valeur) => tx(magasin, 'readwrite', (s) => s.put(valeur, cle));
export const effacer = (magasin, cle) => tx(magasin, 'readwrite', (s) => s.delete(cle));
export async function tout(magasin) {
  const db = await ouvrir();
  return new Promise((resoudre, rejeter) => {
    const t = db.transaction(magasin, 'readonly');
    const r = t.objectStore(magasin).openCursor();
    const out = [];
    r.onsuccess = () => { const c = r.result; if (c) { out.push({ cle: c.key, valeur: c.value }); c.continue(); } else resoudre(out); };
    r.onerror = () => rejeter(r.error);
  });
}
