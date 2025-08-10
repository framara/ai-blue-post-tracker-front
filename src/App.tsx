import { useState, useEffect } from 'react';
import './App.css';
import type { FragmentResult, FragmentScope } from './types/api';

// Types for legacy feed rendering
interface Author { id: string; name: string; role?: string; }
interface Region { id: number; name: string; }
interface ForumCategory { id: number; name: string; }
interface BluePost { id: string; title: string; content: string; summary?: string; sourceUrl: string; postedAt: string; author: Author; region: Region; forumCategory: ForumCategory; }

const API_BASE_URL = 'http://localhost:5289/api';
const PAGE_SIZE = 10;
const HERO_TRANSITION_PX = 120; // Total reference distance
const DOCK_PROGRESS = 0.65; // Fraction of full distance at which we dock to top (earlier docking)

function App() {
  // Data state
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<BluePost[]>([]);
  const [displayedPosts, setDisplayedPosts] = useState<BluePost[]>([]);
  const [fragments, setFragments] = useState<FragmentResult[]>([]);
  const [fragmentNextOffset, setFragmentNextOffset] = useState<number | null>(null);
  const [fragmentTotal, setFragmentTotal] = useState<number>(0);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [scope, setScope] = useState<FragmentScope>('any');
  const [dedupe, setDedupe] = useState(true);

  // Parallax state
  const [scrollY, setScrollY] = useState(0);

  // No topic suggestions; we search whatever the user types

  // Initial posts
  useEffect(() => { loadPosts(1); }, []);

  // No autocomplete filtering

  // Scroll listener for parallax
  useEffect(()=>{
    const onScroll = () => setScrollY(window.scrollY || document.documentElement.scrollTop);
    window.addEventListener('scroll', onScroll, { passive: true });
    return ()=> window.removeEventListener('scroll', onScroll);
  },[]);

  const loadPosts = async (page:number) => {
    if (isLoading) return; setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/BluePosts?page=${page}&pageSize=${PAGE_SIZE}`);
      if (res.ok) {
        let newPosts: BluePost[] = await res.json();
        newPosts = newPosts.sort((a,b)=>new Date(b.postedAt).getTime()-new Date(a.postedAt).getTime());
        if (page===1) { setPosts(newPosts); setDisplayedPosts(newPosts); }
        else { setPosts(p=>[...p,...newPosts]); setDisplayedPosts(p=>[...p,...newPosts]); }
        setCurrentPage(page+1); setHasMorePosts(newPosts.length===PAGE_SIZE);
      }
    } finally { setIsLoading(false); }
  };

  const loadMore = () => {
    if (isSearchMode) return;
    if (displayedPosts.length < posts.length) {
      setDisplayedPosts(posts.slice(0, displayedPosts.length + PAGE_SIZE));
    } else if (hasMorePosts) {
      loadPosts(currentPage);
    }
  };

  // Infinite scroll for pagination
  useEffect(()=>{ const onScroll=()=>{ if (isLoading) return; const {scrollTop,clientHeight,scrollHeight}=document.documentElement; if (scrollTop+clientHeight>=scrollHeight-200) loadMore(); }; window.addEventListener('scroll',onScroll,{passive:true}); return ()=>window.removeEventListener('scroll',onScroll); },[isLoading,displayedPosts,posts,hasMorePosts,currentPage,isSearchMode]);

  const runFragmentSearch = async (q:string, offset:number=0, append:boolean=false)=>{
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('query', q);
      params.set('limit', String(PAGE_SIZE));
      params.set('dedupe', String(dedupe));
      params.set('offset', String(offset));
      if (scope && scope !== 'any') params.set('scope', scope);
      const r = await fetch(`${API_BASE_URL}/search/fragments?${params.toString()}`);
      if (r.ok) {
        const nextRaw = r.headers.get('X-Next-Offset');
        const totalRaw = r.headers.get('X-Total-Count');
        const next = nextRaw && nextRaw.trim() !== '' ? Number(nextRaw) : null;
        const total = totalRaw ? Number(totalRaw) : 0;
        const data: FragmentResult[] = await r.json();
        setFragmentNextOffset(next);
        setFragmentTotal(total);
        setFragments(prev => append ? [...prev, ...data] : data);
      }
    } finally { setIsLoading(false);} };
  const handleSearchSubmit = () => {
    const q = searchQuery.trim();
    if (!q) {
      setIsSearchMode(false);
      setFragments([]);
      setFragmentNextOffset(null);
      setFragmentTotal(0);
      return;
    }
    setIsSearchMode(true);
    setCurrentPage(1);
    setFragments([]);
    setFragmentNextOffset(null);
    setFragmentTotal(0);
    runFragmentSearch(q, 0, false);
  };
  const handleKeyDown=(e:React.KeyboardEvent)=>{ if(e.key==='Enter'){ handleSearchSubmit(); } };
  const formatDate=(d:string)=>new Date(d).toLocaleDateString();
  const formatTime=(d:string)=>new Date(d).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});

  // Transform plain-text-ish HTML (with <mark>) into Blizzard-like markup:
  // - Lines ending with ':' or matching known section names become subheadings
  // - Lines starting with •, -, or * become list items grouped into <ul>
  // - Other lines become paragraphs
  const transformToBlizzHtml = (html: string) => {
    const text = html.replace(/\r/g, '');
    const lines = text.split('\n');
    const out: string[] = [];
    let inList = false;
    const isBullet = (line: string) => /^\s*[•\-*]\s+/.test(line);
    const isSection = (line: string) => /[:：]\s*$/.test(line) || /^(Classes|Delves|Items|Quests|Dungeons|Raids|Player versus Player|PvP)\b/i.test(line.trim());
    for (let raw of lines) {
      const line = raw.trim();
      if (!line) { continue; }
      if (isBullet(line)) {
        if (!inList) { out.push('<ul class="blizz-list">'); inList = true; }
        const content = line.replace(/^\s*[•\-*]\s+/, '');
        out.push(`<li>${content}</li>`);
        continue;
      }
      if (inList) { out.push('</ul>'); inList = false; }
      if (isSection(line)) {
        const title = line.replace(/[:：]\s*$/, '');
        out.push(`<h4 class="blizz-subheading">${title}</h4>`);
      } else {
        out.push(`<p>${line}</p>`);
      }
    }
    if (inList) out.push('</ul>');
    return out.join('\n');
  };

  // Parallax calculations
  const rawProgress = Math.min(1, scrollY / HERO_TRANSITION_PX);            // 0..1 over full reference
  const dockProgress = Math.min(1, rawProgress / DOCK_PROGRESS);            // 0..1 by the time we dock
  const eased = dockProgress < 1 ? Math.pow(dockProgress, 0.85) : 1;        // eased pre-dock motion
  const compact = rawProgress >= DOCK_PROGRESS;                             // dock earlier
  const scale = 1 - 0.4 * eased;                                            // scale relative to dock progress

  const searchWrapperStyle: React.CSSProperties = { '--progress': eased.toString() } as any;
  const searchInnerStyle: React.CSSProperties = { transform: `scale(${scale.toFixed(3)})`, transformOrigin: 'center center' };

  // Dynamic padding so first post never gets hidden. Shrinks faster (uses dockProgress) and docks at 9rem sooner.
  const postsPaddingTop = compact ? '9rem' : `calc(${(1 - dockProgress) * 100}vh + 2rem)`;
  const postsOpacity = Math.min(1, dockProgress * 1.4);
  const postsTranslate = 40 * (1 - dockProgress);
  const postsSectionStyle: React.CSSProperties = {
    paddingTop: postsPaddingTop,
    opacity: postsOpacity,
    transform: `translateY(${postsTranslate.toFixed(0)}px)`
  };

  return (
    <div className="minimal-app">
      {/* Parallax Search Shell */}
      <div className={`search-parallax-shell ${compact ? 'compact' : ''}`} style={searchWrapperStyle}>
        <div className="search-parallax-core" style={searchInnerStyle}>
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search…"
              value={searchQuery}
              onChange={(e)=>{ setSearchQuery(e.target.value); if(isSearchMode && !e.target.value){ setIsSearchMode(false); setFragments([]); setFragmentNextOffset(null); setFragmentTotal(0); } }}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>
      </div>

      {/* Scroll hint only at top & not searching */}
  {rawProgress === 0 && !isSearchMode && (
        <div className="scroll-hint"><div className="v-arrow">∨</div></div>
      )}

      {/* Posts Section */}
      <div className={`posts-section visible ${compact ? 'compact-offset' : ''}`} style={postsSectionStyle}>
        <div className="posts-container">
          {/* Filters for fragments */}
          {isSearchMode && (
            <div style={{display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.75rem'}}>
              <div style={{display:'flex', gap:'0.25rem'}}>
                {(['any','retail','ptr','classic'] as FragmentScope[]).map(s => (
                  <button key={s} className={`chip ${scope===s?'active':''}`} onClick={()=>{ setScope(s); if(searchQuery){ setFragments([]); setFragmentNextOffset(null); setFragmentTotal(0); runFragmentSearch(searchQuery, 0, false); } }}>
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
              <label style={{display:'flex', alignItems:'center', gap:'0.25rem', marginLeft:'auto'}}>
                <input type="checkbox" checked={dedupe} onChange={(e)=>{ setDedupe(e.target.checked); if(searchQuery){ setFragments([]); setFragmentNextOffset(null); setFragmentTotal(0); runFragmentSearch(searchQuery, 0, false); } }} />
                Dedupe regions
              </label>
            </div>
          )}
          {isSearchMode ? fragments.map((frag,i)=>(
            <article key={frag.id ?? i} className="post-card blizz-post" style={{animationDelay:`${i*40}ms`}}>
              <div className="post-header">
                <div className="post-meta"><span className="post-author">{frag.region}</span><span className="post-region">{frag.scope ?? 'Retail'}</span></div>
                <div className="post-date"><span className="date">{formatDate(frag.postedAt)}</span><span className="time">{formatTime(frag.postedAt)}</span></div>
              </div>
              <h3 className="post-title"><a href={frag.sourceUrl} target="_blank" rel="noreferrer">{frag.postTitle}</a></h3>
              <div className="post-content blizz-content" dangerouslySetInnerHTML={{__html: transformToBlizzHtml(frag.textHtml)}} />
              <div className="post-footer">
                <span className="post-category">Fragment</span>
                <div className="post-tags">
                  {frag.isPvP && <span className="tag" style={{background:'#8B0000', color:'#fff'}}>PvP</span>}
                  <span className="tag">Newest</span>
                </div>
              </div>
            </article>
          )) : displayedPosts.map((post,i)=>(
            <article key={post.id} className="post-card" style={{animationDelay:`${i*40}ms`}}>
              <div className="post-header">
                <div className="post-meta"><span className="post-author">{post.author.name}</span>{post.author.role && <span className="post-role">{post.author.role}</span>}<span className="post-region">{post.region.name}</span></div>
                <div className="post-date"><span className="date">{formatDate(post.postedAt)}</span><span className="time">{formatTime(post.postedAt)}</span></div>
              </div>
              <h3 className="post-title"><a href={post.sourceUrl} target="_blank" rel="noreferrer">{post.title}</a></h3>
              <div className="post-content"><p>{post.summary || post.content}</p></div>
              <div className="post-footer"><span className="post-category">{post.forumCategory.name}</span><div className="post-tags"><span className="tag">Blue Post</span></div></div>
            </article>
          ))}
          {isSearchMode && !isLoading && fragmentNextOffset !== null && (
            <div style={{textAlign:'center',margin:'1rem 0'}}>
              <button className="load-more-button" onClick={()=> runFragmentSearch(searchQuery, fragmentNextOffset ?? 0, true)}>
                Load more results
              </button>
              {fragmentTotal > 0 && (
                <div style={{marginTop:'0.5rem', fontSize:'0.9rem', color:'#666'}}>
                  Showing {fragments.length} of {fragmentTotal}
                </div>
              )}
            </div>
          )}
          {isLoading && <div className="loading-indicator"><div className="loading-spinner"/><p>Loading...</p></div>}
          {!isSearchMode && !isLoading && hasMorePosts && (
            <div style={{textAlign:'center',margin:'2rem 0'}}>
              <button className="load-more-button" onClick={loadMore}>Load More</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
