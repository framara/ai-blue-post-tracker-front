import { useState, useEffect, useRef } from 'react';
import './App.css';

// API configuration
const API_BASE_URL = 'http://localhost:5289/api';

// Types for API response
interface BluePost {
  id: string;
  title: string;
  content: string;
  summary: string;
  sourceUrl: string;
  postedAt: string;
  replyCount: number;
  isSticky: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    role: string;
    isActive: boolean;
    postCount: number;
  };
  region: {
    id: number;
    code: string;
    name: string;
  };
  forumCategory: {
    id: number;
    name: string;
    description: string;
  };
  postType?: {
    id: number;
    name: string;
    description: string;
    color: string;
    priority: number;
  };
  source: {
    id: number;
    name: string;
    baseUrl: string;
    priority: number;
  };
}

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<string[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [posts, setPosts] = useState<BluePost[]>([]);
  const [displayedPosts, setDisplayedPosts] = useState<BluePost[]>([]);
  // Extract snippets (search mode)
  interface ExtractSnippet { id: string; bluePostId: string; postedAt: string; extractText: string; highlightedExtractHtml?: string; matchedTerms?: string[]; rankScore?: number; postTitle: string; authorName: string; forumCategory: string; sourceUrl?: string; sequence?: number; }
  const [displayedExtracts, setDisplayedExtracts] = useState<ExtractSnippet[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [showPosts, setShowPosts] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [initialPostsRequested, setInitialPostsRequested] = useState(false);
  const HERO_TRANSITION = 320; // px distance to complete hero -> compact transition
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const POSTS_PER_PAGE = 10;

  // Fetch topics from backend on load
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/topics`);
        if (response.ok) {
          const data = await response.json();
          setTopics(data);
        }
      } catch (error) {
        console.error('Error fetching topics:', error);
        // Fallback topics if API fails
        setTopics([
          'Balance Changes',
          'Bug Fixes',
          'Class Updates',
          'PvP Changes',
          'Raid & Dungeons',
          'Hotfixes',
          'Season Updates',
          'Character Issues',
          'Server Issues',
          'Game Performance',
          'UI/UX Improvements',
          'New Features',
          'Community Events',
          'Technical Issues',
          'Maintenance'
        ]);
      }
    };

    fetchTopics();
  }, []);

  // DO NOT load posts on mount to keep page empty per spec.

  // Filter topics based on search input
  useEffect(() => {
    if (searchQuery.length === 0) {
      setFilteredTopics([]);
      setShowAutocomplete(false);
      return;
    }

    const filtered = topics.filter(topic =>
      topic.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);
    
    setFilteredTopics(filtered);
    setShowAutocomplete(filtered.length > 0);
  }, [searchQuery, topics]);

  // Simple and smooth scroll handling
  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      setScrollY(current);

      // Lazy load posts only once after user intent to scroll
      if (!initialPostsRequested && current > 20) {
        setInitialPostsRequested(true);
        loadLatestPosts(1);
      }

      // Mark that user has scrolled past hero reveal point
      if (current > 80) setHasScrolled(true); else if (current < 40) setHasScrolled(false);

      // Infinite scroll check (after posts visible or searching)
      if ((hasScrolled || showPosts) && hasMorePosts && !isLoading) {
        const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
        if (scrollTop + clientHeight >= scrollHeight - 300) {
          loadMorePosts();
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasScrolled, showPosts, hasMorePosts, isLoading, initialPostsRequested]);

  const loadLatestPosts = async (page: number) => {
    if (isLoading) return;
    
    console.log(`Loading posts for page ${page}`); // Debug log
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/BluePosts?page=${page}&pageSize=${POSTS_PER_PAGE}`);
      console.log('Response status:', response.status); // Debug log
      
      if (response.ok) {
        let newPosts: BluePost[] = await response.json();
        // Ensure date desc ordering
        newPosts = newPosts.sort((a,b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
        console.log('Loaded posts:', newPosts.length); // Debug log
        
        if (page === 1) {
          setPosts(newPosts);
          setDisplayedPosts(newPosts.slice(0, POSTS_PER_PAGE));
        } else {
          setPosts(prev => [...prev, ...newPosts]);
          setDisplayedPosts(prev => [...prev, ...newPosts]);
        }
        
        setCurrentPage(page + 1);
        setHasMorePosts(newPosts.length === POSTS_PER_PAGE);
      } else {
        console.error('Failed to load posts:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      // Add some mock data for testing scroll functionality
      if (page === 1) {
        const mockPosts = Array.from({ length: 10 }, (_, i) => ({
          id: `mock-${i}`,
          title: `Mock Blue Post ${i + 1}`,
          content: `This is mock content for post ${i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
          summary: `Mock summary for post ${i + 1}`,
          sourceUrl: `https://example.com/post-${i + 1}`,
          postedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          replyCount: Math.floor(Math.random() * 100),
          isSticky: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: {
            id: `author-${i}`,
            name: `Blue Author ${i + 1}`,
            role: 'Community Manager',
            isActive: true,
            postCount: 100 + i
          },
          region: {
            id: 1,
            code: 'US',
            name: 'United States'
          },
          forumCategory: {
            id: 1,
            name: 'General Discussion',
            description: 'General game discussion'
          },
          source: {
            id: 1,
            name: 'Official Forums',
            baseUrl: 'https://example.com',
            priority: 1
          }
        }));
        setPosts(mockPosts);
        setDisplayedPosts(mockPosts);
        console.log('Added mock posts for testing');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadMorePosts = () => {
    if (isSearchMode) {
      searchExtracts(searchQuery, currentPage);
      return;
    }
    // Load more from latest posts
    const nextBatch = posts.slice(displayedPosts.length, displayedPosts.length + POSTS_PER_PAGE);
    if (nextBatch.length > 0) {
      setDisplayedPosts(prev => [...prev, ...nextBatch]);
    } else if (hasMorePosts) {
      loadLatestPosts(currentPage);
    }
  };

  const searchExtracts = async (topic: string, page: number = 1) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Extracts?query=${encodeURIComponent(topic)}&page=${page}&pageSize=${POSTS_PER_PAGE}`);
      if (response.ok) {
        const snippets: ExtractSnippet[] = await response.json();
        if (page === 1) {
          setDisplayedExtracts(snippets);
        } else {
          setDisplayedExtracts(prev => [...prev, ...snippets]);
        }
        setCurrentPage(page + 1);
        setHasMorePosts(snippets.length === POSTS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error searching extracts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicSelect = (topic: string) => {
    setSearchQuery(topic);
    setShowAutocomplete(false);
    setShowPosts(true);
    setIsSearchMode(true);
    setCurrentPage(1);
    searchExtracts(topic, 1);
    searchInputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredTopics.length > 0) {
      handleTopicSelect(filteredTopics[0]);
    }
    if (e.key === 'Escape') {
      setShowAutocomplete(false);
      searchInputRef.current?.blur();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Parallax progress 0 -> 1
  const progress = Math.min(1, scrollY / HERO_TRANSITION);
  const eased = progress < 1 ? Math.pow(progress, 0.85) : 1; // slightly accelerated
  const scale = 1 - 0.4 * eased; // 1 -> 0.6
  // Move from center to top: we interpolate top offset via transform on wrapper
  // We'll shift along Y from 0 to -(viewportHeight/2 - 70px) using calc in CSS var approach, simpler: use inline style with fixed top.

  const searchWrapperStyle: React.CSSProperties = {
    '--progress': eased.toString(),
  } as any;
  const searchInnerStyle: React.CSSProperties = {
    transform: `scale(${scale.toFixed(3)})`,
    transformOrigin: 'center center'
  };
  // When compact fully (progress=1) pin to small top bar form
  const compact = eased >= 1;

  return (
    <div className="minimal-app">
      {/* Search Parallax Shell */}
      <div className={`search-parallax-shell ${compact ? 'compact' : ''}`} style={searchWrapperStyle}>
        <div className="search-parallax-core" style={searchInnerStyle}>
          <div className="search-container">
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowPosts(false)}
              onKeyDown={handleKeyDown}
            />
            {showAutocomplete && filteredTopics.length > 0 && (
              <ul className="autocomplete-dropdown">
                {filteredTopics.map((topic, index) => (
                  <li
                    key={index}
                    className="autocomplete-item"
                    onClick={() => handleTopicSelect(topic)}
                  >
                    {topic}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Hint Arrow only at hero idle */}
      {progress === 0 && !showPosts && (
        <div className="scroll-hint"><div className="v-arrow">∨</div></div>
      )}

      {/* Posts with parallax fade / lag */}
      {/** Posts only start fading in once hero fully docked to prevent overlap */}
      <div
  className={`posts-section ${progress >= 1 ? 'visible compact-offset' : 'hidden'}`}
        style={{
          opacity: progress >= 1 ? 1 : 0,
          transform: progress >= 1 ? 'translateY(0)' : 'translateY(40px)'
        }}
      >
        <div className="posts-container">
          {isSearchMode ? displayedExtracts.map((snip, index) => (
            <article key={`${snip.id}-${index}`} className="post-card" style={{ animationDelay: `${index * 40}ms` }}>
              <div className="post-header">
                <div className="post-meta">
                  <span className="post-author">{snip.authorName}</span>
                  <span className="post-region">{snip.forumCategory}</span>
                </div>
                <div className="post-date">
                  <span className="date">{formatDate(snip.postedAt)}</span>
                  <span className="time">{formatTime(snip.postedAt)}</span>
                </div>
              </div>
              <h3 className="post-title">
                <a href={snip.sourceUrl} target="_blank" rel="noopener noreferrer">{snip.postTitle}</a>
              </h3>
              <div className="post-content">
                <p dangerouslySetInnerHTML={{ __html: snip.highlightedExtractHtml || snip.extractText }} />
              </div>
              <div className="post-footer">
                <span className="post-category">Extract</span>
                <div className="post-tags">
                  <span className="tag">Snippet</span>
                  {snip.matchedTerms && snip.matchedTerms.slice(0,3).map(t => (
                    <span key={t} className="tag accent">{t}</span>
                  ))}
                </div>
              </div>
            </article>
          )) : displayedPosts.map((post, index) => (
            <article
              key={`${post.id}-${index}`}
              className="post-card"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="post-header">
                <div className="post-meta">
                  <span className="post-author">{post.author.name}</span>
                  <span className="post-role">{post.author.role}</span>
                  <span className="post-region">{post.region.name}</span>
                </div>
                <div className="post-date">
                  <span className="date">{formatDate(post.postedAt)}</span>
                  <span className="time">{formatTime(post.postedAt)}</span>
                </div>
              </div>
              <h3 className="post-title">
                <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer">{post.title}</a>
              </h3>
              <div className="post-content"><p>{post.summary || post.content}</p></div>
              <div className="post-footer">
                <span className="post-category">{post.forumCategory.name}</span>
                <div className="post-tags"><span className="tag">Blue Post</span></div>
              </div>
            </article>
          ))}
          {isLoading && (
            <div className="loading-indicator"><div className="loading-spinner"></div><p>Loading more {isSearchMode ? 'extracts' : 'posts'}...</p></div>
          )}
          {!hasMorePosts && displayedPosts.length > 0 && (
            <div className="end-message"><p>You've reached the end!</p></div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
