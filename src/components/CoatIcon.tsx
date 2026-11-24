import type { IconProps } from 'phosphor-react-native';
import { SvgXml } from 'react-native-svg';

/**
 * Mont/ceket ikonu — Phosphor setinde karşılığı yok.
 * Kaynak: IconOven "coat" (MIT), stroke tabanlı; currentColor renge çevrilir.
 */
const COAT_XML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path stroke-width="1.5" d="M10 2.75h4q1.5 0 2.8.74l.9.52q1.3.74 1.37 2.24l.61 13.5q.07 1.5-1.43 1.5H5.75q-1.5 0-1.43-1.5l.61-13.5Q5 4.75 6.3 4.01l.9-.52q1.3-.74 2.8-.74"/><path stroke-width="1.5" d="m8.75 3.25l3.25 7.5l3.25-7.5"/><path stroke-width="2" d="M12 14h.01M12 17.5h.01"/></g></svg>`;

export function CoatIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return <SvgXml xml={COAT_XML.replaceAll('currentColor', color)} width={size} height={size} />;
}
