import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import useRecipeStore from '../store/useRecipeStore';
import RecipeCard from '../components/RecipeCard';
import { TAGS } from '../constants/tags';

const SORT_OPTIONS = [
  { value: 'recent',   label: '최근 추가순' },
  { value: 'name',     label: '이름 가나다순' },
  { value: 'time',     label: '조리 시간 짧은 순' },
];

export default function FavoritesPage() {
  const allRecipes = useRecipeStore(s => s.recipes);
  const favoriteIds = useRecipeStore(s => s.favoriteIds);

  const [search, setSearch]       = useState('');
  const [sort, setSort]           = useState('recent');
  const [activeTags, setActiveTags] = useState([]);

  const favorites = useMemo(
    () => favoriteIds.map(id => allRecipes.find(r => r.id === id)).filter(Boolean),
    [allRecipes, favoriteIds]
  );

  const usedTags = useMemo(() => {
    const used = new Set(favorites.flatMap(r => r.tags ?? []));
    return TAGS.filter(t => used.has(t.value));
  }, [favorites]);

  const filtered = useMemo(() => {
    let list = favorites;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => r.title.toLowerCase().includes(q));
    }

    if (activeTags.length > 0) {
      list = list.filter(r => activeTags.every(tag => r.tags?.includes(tag)));
    }

    if (sort === 'name') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title, 'ko'));
    } else if (sort === 'time') {
      list = [...list].sort((a, b) => (a.prepTime ?? 9999) - (b.prepTime ?? 9999));
    }
    // 'recent' keeps favoriteIds order (already preserved by the map above)

    return list;
  }, [favorites, search, sort, activeTags]);

  function toggleTag(value) {
    setActiveTags(prev =>
      prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value]
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">♥ 즐겨찾기</h1>
        <p className="text-gray-400 text-sm mt-0.5">자주 만드는 레시피를 모아보세요</p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">🤍</div>
          <p className="text-lg font-medium text-gray-500">즐겨찾기한 레시피가 없습니다</p>
          <p className="text-sm mt-1">레시피 카드의 ♡ 를 눌러 추가해보세요</p>
          <Link
            to="/"
            className="inline-block mt-4 bg-amber-500 hover:bg-amber-600 text-white
                       px-6 py-2.5 rounded-full transition text-sm font-semibold"
          >
            레시피 둘러보기
          </Link>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="즐겨찾기 검색..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-gray-800
                         placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-300 transition"
            />
          </div>

          {/* Sort */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={`flex-shrink-0 text-sm px-3.5 py-1.5 rounded-full border font-medium transition ${
                  sort === opt.value
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-amber-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Tag filter */}
          {usedTags.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {usedTags.map(tag => (
                <button
                  key={tag.value}
                  onClick={() => toggleTag(tag.value)}
                  className={`flex-shrink-0 text-sm px-3.5 py-1.5 rounded-full border font-medium transition ${
                    activeTags.includes(tag.value)
                      ? 'bg-amber-500 text-white border-amber-500'
                      : `bg-white ${tag.color} hover:opacity-80`
                  }`}
                >
                  {tag.label}
                </button>
              ))}
              {activeTags.length > 0 && (
                <button
                  onClick={() => setActiveTags([])}
                  className="flex-shrink-0 text-sm px-3 py-1.5 rounded-full border border-gray-200
                             text-gray-400 hover:text-gray-600 hover:border-gray-300 transition"
                >
                  초기화
                </button>
              )}
            </div>
          )}

          {/* Results */}
          {filtered.length > 0 ? (
            <div className="grid gap-4">
              {filtered.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-lg font-medium text-gray-500">검색 결과가 없습니다</p>
              <p className="text-sm mt-1">검색어나 태그 필터를 바꿔보세요</p>
              <button
                onClick={() => { setSearch(''); setActiveTags([]); }}
                className="inline-block mt-4 text-amber-600 hover:underline text-sm font-semibold"
              >
                필터 초기화
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
