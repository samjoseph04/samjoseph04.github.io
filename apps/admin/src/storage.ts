const DRAFT_KEY = 'sam-joseph-portfolio-draft-v1';
export function readLocalDraft() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
  } catch {
    return null;
  }
}
export function saveLocalDraft(value: unknown) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(value));
}
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('sam-joseph-portfolio-assets', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function storeLocalFile(path: string, file: File) {
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('files', 'readwrite');
    transaction.objectStore('files').put(file, path);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}
export async function localFiles(): Promise<Record<string, string>> {
  const db = await database();
  const result = await new Promise<Record<string, string>>((resolve, reject) => {
    const store = db.transaction('files').objectStore('files');
    const request = store.openCursor();
    const files: Record<string, string> = {};
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        files[String(cursor.key)] = URL.createObjectURL(cursor.value);
        cursor.continue();
      } else resolve(files);
    };
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
}
