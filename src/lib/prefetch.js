/**
 * Module to prefetch all lazy-loaded routes in a bfcache-compatible way.
 * This improves UX by loading all pages in background before user navigates,
 * while ensuring prefetching doesn't interfere with page load or bfcache restoration.
 */

// All lazy route imports - these will be called to trigger prefetching
const routesToPrefetch = [
  () => import('../pages/About'),
  () => import('../pages/GalleryAlt'),
  () => import('../pages/VolunteerDashboard'),
  () => import('../pages/EventPage'),
  () => import('../pages/CoordinatorDashboard'),
  () => import('../pages/AdminPanel'),
  () => import('../pages/AuthPage'),
];

const componentsToPrefetch = [
  () => import('../components/ChatbotWidget'),
];

/**
 * Prefetch all lazy routes with low priority to prevent UI jank.
 * Uses requestIdleCallback when available to defer work until the browser is idle,
 * and waits for the LCP image to finish loading to avoid network contention.
 * @returns {Promise<void>}
 */
export async function prefetchAllRoutes() {
  // Check if we should skip due to bfcache restoration
  // This is checked again in case the function is called manually
  if (window.__VH_BFCACHE_RESTORED) {
    return;
  }

  try {
    // Wait for LCP image to finish loading before starting prefetch
    // This prevents network contention with the critical LCP resource
    const waitForLCP = () => {
      return new Promise((resolve) => {
        // Check if the LCP image preload link exists and wait for it to load
        const lcpPreload = document.querySelector('link[rel="preload"][as="image"][href*="cuet"]');
        
        if (lcpPreload) {
          // If already loaded, resolve immediately
          if (lcpPreload.complete || lcpPreload.readyState === 'complete') {
            resolve();
            return;
          }
          
          // Wait for the image to load
          const checkLoaded = () => {
            if (lcpPreload.complete || lcpPreload.readyState === 'complete') {
              resolve();
            } else {
              setTimeout(checkLoaded, 50);
            }
          };
          checkLoaded();
        } else {
          // No preload link found, wait a bit for initial render then resolve
          setTimeout(resolve, 500);
        }
      });
    };

    // Use requestIdleCallback if available to avoid interfering with critical rendering
    const schedulePrefetch = (callback) => {
      if (typeof window.requestIdleCallback === 'function') {
        // Use requestIdleCallback with a timeout to ensure it eventually runs
        window.requestIdleCallback(callback, { timeout: 5000 });
      } else {
        // Fallback: use setTimeout with a longer delay to ensure LCP is complete
        setTimeout(callback, 1000);
      }
    };

    // Wrap the actual prefetch work in a function to be scheduled
    const doPrefetch = async () => {
      // First wait for LCP image to be ready
      await waitForLCP();
      
      // Prefetch all route components with error handling
      const routePromises = routesToPrefetch.map(loader => 
        loader().catch(() => null)
      );
      
      // Prefetch other components with error handling
      const componentPromises = componentsToPrefetch.map(loader => 
        loader().catch(() => null)
      );

      // Wait for all imports to complete (errors are already handled)
      return Promise.all([...routePromises, ...componentPromises]);
    };

    // Schedule the prefetch work after LCP is ready
    schedulePrefetch(async () => {
      try {
        await doPrefetch();
      } catch {
        // Silently fail if prefetch encounters errors
      }
    });
  } catch {
    // Silently fail if scheduling fails
  }
}

/**
 * Initialize bfcache-compatible prefetching.
 * This function sets up event listeners and triggers prefetching when appropriate.
 */
function initPrefetch() {
  // Check if page is being restored from bfcache
  // pageshow event fires for both normal loads and bfcache restorations
  function handlePageShow(event) {
    if (event.persisted) {
      // Page was restored from bfcache - skip prefetching
      // The prefetched modules are already in memory
      window.__VH_BFCACHE_RESTORED = true;
      return;
    }

    // Normal page load - start prefetching
    window.__VH_BFCACHE_RESTORED = false;
    prefetchAllRoutes();
  }

  // Listen for pageshow event
  // This fires for both initial load and bfcache restoration
  if (typeof window !== 'undefined') {
    window.addEventListener('pageshow', handlePageShow);
  }
}

// Auto-start prefetching when this module is imported, but only if:
// 1. We're in a browser environment
// 2. The page is NOT being restored from bfcache
// 3. The browser supports requestIdleCallback (or we use fallback)
if (typeof window !== 'undefined') {
  // Check if we're being restored from bfcache using performance API
  // This is a proactive check before the pageshow event
  const isBFCacheRestore = 
    'performance' in window && 
    performance.getEntriesByType &&
    performance.getEntriesByType('navigation')[0]?.type === 'back_forward';

  if (!isBFCacheRestore) {
    // Not a bfcache restoration - initialize prefetching
    initPrefetch();
  } else {
    // Mark as restored from bfcache
    window.__VH_BFCACHE_RESTORED = true;
  }
}