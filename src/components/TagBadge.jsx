import { getTagColor, getTagLabel } from '../constants/tags';

export default function TagBadge({ tag, size = 'sm' }) {
  const color = getTagColor(tag);
  const label = getTagLabel(tag);
  const sizeClass = size === 'xs' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${color} ${sizeClass}`}>
      {label}
    </span>
  );
}
