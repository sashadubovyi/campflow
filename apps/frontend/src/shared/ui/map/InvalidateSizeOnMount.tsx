import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/**
 * Leaflet міряє контейнер у момент монтування. Якщо карта з'являється
 * всередині модалки/акордеона під час CSS-transition, розмір ще неправильний —
 * тайли лишаються сірими, хоча маркери ставляться. Перемірюємо одразу після
 * монтування і ще раз після завершення анімації контейнера.
 */
export function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    const kick = () => {
      try {
        map.invalidateSize();
      } catch {
        // карта могла демонтуватись
      }
    };
    const t1 = setTimeout(kick, 50);
    const t2 = setTimeout(kick, 350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);
  return null;
}
