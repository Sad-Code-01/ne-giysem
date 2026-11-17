/**
 * Aktif sekmeye tekrar basınca en üste kaydırma için basit olay dağıtıcı.
 * Sekme ekranları mount'ta kaydolur; FloatingTabBar tetikler.
 */

type ScrollHandler = () => void;

const handlers = new Map<string, Set<ScrollHandler>>();

/** `name` (rota adı) için kaydırma isteği dinleyicisi kaydeder; unsubscribe döner. */
export function onScrollToTopRequest(name: string, handler: ScrollHandler): () => void {
  let set = handlers.get(name);
  if (!set) {
    set = new Set();
    handlers.set(name, set);
  }
  set.add(handler);
  return () => {
    set?.delete(handler);
    if (set && set.size === 0) handlers.delete(name);
  };
}

/** Kayıtlı tüm dinleyicileri çağırır. */
export function requestScrollToTop(name: string): void {
  handlers.get(name)?.forEach((handler) => handler());
}
