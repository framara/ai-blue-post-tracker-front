import { useState, useEffect, useRef } from 'react';
import './App.css';

// Types
interface Author { id: string; name: string; role?: string; }
interface Region { id: number; name: string; }
interface ForumCategory { id: number; name: string; }
interface BluePost { id: string; title: string; content: string; summary?: string; sourceUrl: string; postedAt: string; author: Author; region: Region; forumCategory: ForumCategory; }
interface ExtractSnippet { id: string; bluePostId: string; postedAt: string; extractText: string; highlightedExtractHtml?: string; sectionSnippetHtml?: string; isSectionFragment?: boolean; matchedTerms?: string[]; postTitle: string; authorName: string; forumCategory: string; sourceUrl?: string; }

const API_BASE_URL = 'http://localhost:5289/api';
const PAGE_SIZE = 10;
const HERO_TRANSITION_PX = 120; // Total reference distance
const DOCK_PROGRESS = 0.65; // Fraction of full distance at which we dock to top (earlier docking)

function App() {
  // Data state
  const [searchQuery, setSearchQuery] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<string[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [posts, setPosts] = useState<BluePost[]>([]);
  const [displayedPosts, setDisplayedPosts] = useState<BluePost[]>([]);
  const [displayedExtracts, setDisplayedExtracts] = useState<ExtractSnippet[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Parallax state
  const [scrollY, setScrollY] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load topics once
  useEffect(() => { (async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/topics`);
      if (r.ok) { setTopics(await r.json()); return; }
    } catch {}
    setTopics(['Balance Changes','Bug Fixes','Class Updates','Hotfixes','Season Updates','Server Issues','Technical Issues']);
  })(); }, []);

  // Initial posts
  useEffect(() => { loadPosts(1); }, []);

  // Autocomplete filtering
  useEffect(() => {
    if (!searchQuery) { setFilteredTopics([]); setShowAutocomplete(false); return; }
    const f = topics.filter(t=>t.toLowerCase().includes(searchQuery.toLowerCase())).slice(0,5);
    setFilteredTopics(f); setShowAutocomplete(f.length>0);
  }, [searchQuery, topics]);

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

  const runExtractSearch = async (q:string, page:number)=>{
    setIsLoading(true);
    try {
      // Always request section fragments so class/spec queries narrow properly
      const url = `${API_BASE_URL}/Extracts?query=${encodeURIComponent(q)}&page=${page}&pageSize=${PAGE_SIZE}&section=true`;
      const r = await fetch(url);
      if (r.ok) {
        const data: ExtractSnippet[] = await r.json();
        setDisplayedExtracts(data);
      }
    } finally { setIsLoading(false);} };
  const handleTopicSelect = (t:string) => { setSearchQuery(t); setIsSearchMode(true); setCurrentPage(1); runExtractSearch(t,1); setShowAutocomplete(false); };
  const handleKeyDown=(e:React.KeyboardEvent)=>{ if(e.key==='Enter' && filteredTopics.length>0) handleTopicSelect(filteredTopics[0]); if(e.key==='Escape'){ setShowAutocomplete(false); searchInputRef.current?.blur(); } };
  const formatDate=(d:string)=>new Date(d).toLocaleDateString();
  const formatTime=(d:string)=>new Date(d).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});

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
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e)=>{ setSearchQuery(e.target.value); if(isSearchMode && !e.target.value){ setIsSearchMode(false); setDisplayedExtracts([]);} }}
              onKeyDown={handleKeyDown}
            />
            {showAutocomplete && filteredTopics.length>0 && (
              <ul className="autocomplete-dropdown">
                {filteredTopics.map((t,i)=>(<li key={i} className="autocomplete-item" onClick={()=>handleTopicSelect(t)}>{t}</li>))}
              </ul>
            )}
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
          {isSearchMode ? displayedExtracts.map((snip,i)=>(
            <article key={snip.id} className="post-card" style={{animationDelay:`${i*40}ms`}}>
              <div className="post-header">
                <div className="post-meta"><span className="post-author">{snip.authorName}</span><span className="post-region">{snip.forumCategory}</span></div>
                <div className="post-date"><span className="date">{formatDate(snip.postedAt)}</span><span className="time">{formatTime(snip.postedAt)}</span></div>
              </div>
              <h3 className="post-title"><a href={snip.sourceUrl} target="_blank" rel="noreferrer">{snip.postTitle}</a></h3>
              <div className="post-content"><p dangerouslySetInnerHTML={{__html: snip.sectionSnippetHtml || snip.highlightedExtractHtml || snip.extractText}} /></div>
              {snip.isSectionFragment && (
                <div style={{marginTop:'0.5rem', fontSize:'0.7rem', letterSpacing:'0.05em', opacity:0.6}}>Class Fragment</div>
              )}
              <div className="post-footer"><span className="post-category">Extract</span><div className="post-tags"><span className="tag">Snippet</span></div></div>
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
