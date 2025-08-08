## Blue Post Tracker – Frontend

Minimal, high‑contrast React + TypeScript + Vite UI for exploring Blizzard "blue" posts with a parallax search-first experience.

### Core UX
1. Initial View: Dark background (#111217), cyan text (#00AEFF), only a centered search box and a subtle V arrow hint at bottom.
2. Parallax Scroll: As the user scrolls, the hero search smoothly scales down and docks at the top center; only then do posts fade/slide into view (no overlap).
3. Autocomplete: Topic suggestions (max 5) are fetched from the backend `/api/topics` endpoint and filtered client-side as you type.
4. Lazy Data: No posts are fetched until the user shows intent (slight scroll or selecting a topic); infinite scroll loads 10 more at a time.
5. Search Mode: Selecting a topic switches to filtered, date‑desc results; infinite scroll continues the filtered query.

### Technology
- React 18 + TypeScript
- Vite dev/build tooling
- Lightweight custom parallax (no heavy animation libs)
- CSS only (no Tailwind for the hero / parallax section, though Tailwind can coexist if desired)

### Features
- Minimal hero / distraction‑free entry
- Smooth parallax docking (center → compact top)
- Autocomplete topics (API + fallback list)
- Infinite scroll (10 posts/page)
- Date descending ordering enforced client-side as a safeguard
- Mock data fallback if API unreachable (dev only)

### Getting Started
Backend must run first (ASP.NET Core API providing `/api/BluePosts` & `/api/topics`).

```powershell
# From API project root
dotnet run

# In another terminal (this frontend directory)
npm install
npm run dev
```

Open the printed Vite dev URL (e.g. http://localhost:5173 or similar).

### Configuration
Currently the API base URL is hard‑coded in `src/App.tsx` as:
```
const API_BASE_URL = 'http://localhost:5289/api';
```
If you need to change environments, refactor this to use an environment variable (e.g. `import.meta.env.VITE_API_BASE_URL`) and add a `.env` file:
```
VITE_API_BASE_URL=http://localhost:5289/api
```

### Build / Preview
```powershell
npm run build
npm run preview
```

### Parallax Implementation Notes
- Transition range: ~320px scroll distance maps progress 0→1.
- Search scaling: 1.0 → 0.6; only once progress hits 1 do posts fade in.
- Overlap prevention: posts remain opacity 0 until hero docks (progress >= 1).
- Infinite scroll threshold: loads more when within 300px of bottom.

To tune: adjust `HERO_TRANSITION`, scale interpolation, or reveal threshold inside `App.tsx`.

### Accessibility
- Large, high-contrast typography.
- Focus styles on inputs & suggestion items.
- Reduced motion media query respected (animations soften/disable).

### Future Enhancements (Ideas)
- Keyboard navigation (↑/↓) within autocomplete.
- Sticky mini header shadow & subtle progress bar.
- Skeleton loaders for initial scroll fetch.
- Offline caching (Service Worker) & graceful degradation.
- Replace manual scroll listener with `IntersectionObserver` for posts.

### Troubleshooting
| Issue | Hint |
|-------|------|
| No topics appear | Verify API `/api/topics` reachable (CORS / port). |
| Empty posts after scroll | Check API base URL constant or network errors in console. |
| Parallax feels abrupt | Increase `HERO_TRANSITION` or introduce easing tweak. |
| Infinite scroll stops early | Confirm API returns full `pageSize` batches; else `hasMorePosts` becomes false. |

### License
Internal / project-specific (add explicit license if needed).

---
Short, focused, minimal—tweak as features expand.
