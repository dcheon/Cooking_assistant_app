export const TAGS = [
  { value: 'korean',     label: '한식',       color: 'bg-red-100    text-red-700    border-red-200'    },
  { value: 'japanese',   label: '일식',       color: 'bg-pink-100   text-pink-700   border-pink-200'   },
  { value: 'italian',    label: '이탈리안',   color: 'bg-green-100  text-green-700  border-green-200'  },
  { value: 'chinese',    label: '중식',       color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'mexican',    label: '멕시칸',     color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'indian',     label: '인도',       color: 'bg-amber-100  text-amber-700  border-amber-200'  },
  { value: 'american',   label: '미국식',     color: 'bg-blue-100   text-blue-700   border-blue-200'   },
  { value: 'thai',       label: '태국',       color: 'bg-lime-100   text-lime-700   border-lime-200'   },
  { value: 'french',     label: '프랑스',     color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { value: 'vegetarian', label: '채식',       color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'spicy',      label: '매운맛',     color: 'bg-red-100    text-red-800    border-red-300'    },
  { value: 'quick',      label: '간편식',     color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'other',      label: '기타',       color: 'bg-gray-100   text-gray-600   border-gray-200'   },
];

export function getTag(value) {
  return TAGS.find(t => t.value === value);
}

export function getTagColor(value) {
  return getTag(value)?.color ?? 'bg-gray-100 text-gray-600 border-gray-200';
}

export function getTagLabel(value) {
  return getTag(value)?.label ?? value;
}
