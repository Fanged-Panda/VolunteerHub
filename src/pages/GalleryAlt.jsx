import React, { useEffect, useMemo, useRef } from 'react';

const ASSET_IMAGES = import.meta.glob('../assets/*.{png,jpg,jpeg,webp,gif,avif,svg}', {
  eager: true,
  import: 'default',
});

const CONFIG = {
  COLS: 3,
  ROWS: 3,
  easingFactor: 0.1,
  rotationStrength: 0.1,
  rotationEasing: 0.06,
  scaleEasing: 0.08,
  maxScaleEffect: 0.2,
  tileOverscan: 1,
};

const INFINITE_ALT_STYLES = `
  .vh-infinite-alt-root {
    position: relative;
    width: 100%;
    height: calc(100vh - 4rem);
    overflow: hidden;
  }

  .vh-infinite-alt-root.is-night {
    background: #020617;
  }

  .vh-infinite-alt-root.is-day {
    background: #fff7ed;
  }

  .vh-infinite-alt-viewport {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    cursor: grab;
    touch-action: none;
  }

  .vh-infinite-alt-viewport.vh-infinite-alt-grabbing {
    cursor: grabbing;
  }

  .vh-infinite-alt-container {
    position: absolute;
    inset: -10vmin;
    width: 100%;
    height: 100%;
    transform-origin: center center;
    will-change: transform;
  }

  .vh-infinite-alt-grid {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .vh-infinite-alt-item {
    position: absolute;
    padding: clamp(88px, 1.1vw, 88px);
    box-sizing: border-box;
    overflow: hidden;
    will-change: transform;
    user-select: none;
    backface-visibility: hidden;
  }

  .vh-infinite-alt-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
  }

  .vh-infinite-alt-empty {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    color: #94a3b8;
    font-weight: 600;
  }
`;

function labelFromPath(pathname, index) {
  const filename = pathname.split('/').pop() || `image-${index + 1}`;
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Optional gallery variant inspired by CodePen "Infinite Grid" (EaydbxM).
// This page is intentionally not wired in App routes.
export default function GalleryInfiniteAlt({ theme = 'day' }) {
  const isNight = theme === 'night';
  const viewportRef = useRef(null);
  const containerRef = useRef(null);
  const gridRef = useRef(null);

  const images = useMemo(() => {
    return Object.entries(ASSET_IMAGES)
      .sort(([pathA], [pathB]) => pathA.localeCompare(pathB))
      .map(([path, src], index) => ({
        key: path,
        src,
        alt: labelFromPath(path, index),
      }))
      .filter((image) => typeof image.src === 'string' && image.src.length > 0);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const container = containerRef.current;
    const grid = gridRef.current;
    if (!viewport || !container || !grid || images.length === 0) return undefined;

    let animationFrameId = null;
    let cellWidth = 0;
    let cellHeight = 0;
    let tilesX = 1;
    let tilesY = 1;

    const state = {
      gridItems: [],
      cameraOffset: { x: 0, y: 0 },
      targetOffset: { x: 0, y: 0 },
      isDragging: false,
      previousMousePosition: { x: 0, y: 0 },
      touchStart: null,
      containerRotationX: 0,
      containerRotationY: 0,
      targetRotationX: 0,
      targetRotationY: 0,
      containerScale: 1,
      targetScale: 1,
      scrollSpeed: 0,
    };

    const imageFor = (baseX, baseY) => {
      const index = (baseX + baseY * CONFIG.COLS) % images.length;
      return images[(index + images.length) % images.length];
    };

    const calculateCellSizeAndTiling = () => {
      const vw = window.innerWidth;
      const vh = Math.max(window.innerHeight - 64, 1);
      const minScale = 1 - CONFIG.maxScaleEffect;
      const requiredCoverFactor = 1 / minScale;

      const size = Math.max(vw / CONFIG.COLS, vh / CONFIG.ROWS) * requiredCoverFactor;

      cellWidth = size;
      cellHeight = size;

      const totalWidth = cellWidth * CONFIG.COLS;
      const totalHeight = cellHeight * CONFIG.ROWS;

      const neededTilesX = Math.ceil((vw * requiredCoverFactor) / totalWidth);
      const neededTilesY = Math.ceil((vh * requiredCoverFactor) / totalHeight);

      tilesX = Math.max(1, neededTilesX + CONFIG.tileOverscan);
      tilesY = Math.max(1, neededTilesY + CONFIG.tileOverscan);
    };

    const createGridItems = () => {
      grid.innerHTML = '';
      state.gridItems = [];

      for (let tileY = -tilesY; tileY <= tilesY; tileY += 1) {
        for (let tileX = -tilesX; tileX <= tilesX; tileX += 1) {
          for (let y = 0; y < CONFIG.ROWS; y += 1) {
            for (let x = 0; x < CONFIG.COLS; x += 1) {
              const element = document.createElement('div');
              element.className = 'vh-infinite-alt-item';
              element.style.width = `${cellWidth}px`;
              element.style.height = `${cellHeight}px`;

              const baseX = x;
              const baseY = y;
              const yOffset = x * cellHeight * 0.15;

              const asset = imageFor(baseX, baseY);
              const imageNode = document.createElement('img');
              imageNode.src = asset.src;
              imageNode.alt = asset.alt;
              imageNode.loading = 'lazy';
              imageNode.decoding = 'async';
              element.appendChild(imageNode);

              grid.appendChild(element);
              state.gridItems.push({ element, baseX, baseY, tileX, tileY, yOffset });
            }
          }
        }
      }
    };

    const updateItemPositions = () => {
      const totalWidth = cellWidth * CONFIG.COLS;
      const totalHeight = cellHeight * CONFIG.ROWS;

      state.gridItems.forEach(({ element, baseX, baseY, tileX, tileY, yOffset }) => {
        const baseOffsetX = state.cameraOffset.x % totalWidth;
        const baseOffsetY = state.cameraOffset.y % totalHeight;

        const x = baseX * cellWidth + tileX * totalWidth - baseOffsetX;
        const y = baseY * cellHeight + tileY * totalHeight - baseOffsetY + yOffset;

        element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    };

    const onMouseDown = (event) => {
      state.isDragging = true;
      viewport.classList.add('vh-infinite-alt-grabbing');
      state.previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const onMouseMove = (event) => {
      if (!state.isDragging) return;

      const deltaX = event.clientX - state.previousMousePosition.x;
      const deltaY = event.clientY - state.previousMousePosition.y;

      state.targetOffset.x -= deltaX;
      state.targetOffset.y -= deltaY;

      state.scrollSpeed = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      state.targetRotationY = deltaX * CONFIG.rotationStrength;
      state.targetRotationX = -deltaY * CONFIG.rotationStrength;

      state.previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const onMouseUp = () => {
      state.isDragging = false;
      viewport.classList.remove('vh-infinite-alt-grabbing');
      state.targetRotationX = 0;
      state.targetRotationY = 0;
    };

    const onTouchStart = (event) => {
      if (event.touches.length !== 1) return;
      state.touchStart = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    };

    const onTouchMove = (event) => {
      if (event.touches.length !== 1 || !state.touchStart) return;
      event.preventDefault();

      const deltaX = event.touches[0].clientX - state.touchStart.x;
      const deltaY = event.touches[0].clientY - state.touchStart.y;

      state.targetOffset.x -= deltaX;
      state.targetOffset.y -= deltaY;

      state.scrollSpeed = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      state.targetRotationY = deltaX * CONFIG.rotationStrength;
      state.targetRotationX = -deltaY * CONFIG.rotationStrength;

      state.touchStart = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    };

    const onTouchEnd = () => {
      state.touchStart = null;
      state.targetRotationX = 0;
      state.targetRotationY = 0;
    };

    const onWheel = (event) => {
      event.preventDefault();

      state.targetOffset.x += event.deltaX;
      state.targetOffset.y += event.deltaY;

      state.scrollSpeed = Math.sqrt(event.deltaX * event.deltaX + event.deltaY * event.deltaY);
      state.targetRotationY = event.deltaX * CONFIG.rotationStrength * 0.5;
      state.targetRotationX = -event.deltaY * CONFIG.rotationStrength * 0.5;
    };

    const onWindowResize = () => {
      calculateCellSizeAndTiling();
      createGridItems();
      updateItemPositions();
    };

    const animate = () => {
      animationFrameId = window.requestAnimationFrame(animate);

      const deltaX = state.targetOffset.x - state.cameraOffset.x;
      const deltaY = state.targetOffset.y - state.cameraOffset.y;

      if (Math.abs(deltaX) > 0.01 || Math.abs(deltaY) > 0.01) {
        state.cameraOffset.x += deltaX * CONFIG.easingFactor;
        state.cameraOffset.y += deltaY * CONFIG.easingFactor;
        updateItemPositions();
      }

      const speedFactor = Math.min(state.scrollSpeed * 0.01, 1);
      state.targetScale = 1 - speedFactor * CONFIG.maxScaleEffect;
      state.scrollSpeed *= 0.85;

      state.containerScale += (state.targetScale - state.containerScale) * CONFIG.scaleEasing;
      state.containerRotationX += (state.targetRotationX - state.containerRotationX) * CONFIG.rotationEasing;
      state.containerRotationY += (state.targetRotationY - state.containerRotationY) * CONFIG.rotationEasing;

      container.style.transform =
        `scale(${state.containerScale}) skewY(${state.containerRotationX}deg) skewX(${state.containerRotationY}deg)`;
    };

    calculateCellSizeAndTiling();
    createGridItems();
    updateItemPositions();

    viewport.style.perspective = '1000px';

    viewport.addEventListener('mousedown', onMouseDown);
    viewport.addEventListener('mousemove', onMouseMove);
    viewport.addEventListener('mouseup', onMouseUp);
    viewport.addEventListener('mouseleave', onMouseUp);
    viewport.addEventListener('wheel', onWheel, { passive: false });
    viewport.addEventListener('touchstart', onTouchStart, { passive: true });
    viewport.addEventListener('touchmove', onTouchMove, { passive: false });
    viewport.addEventListener('touchend', onTouchEnd);
    window.addEventListener('resize', onWindowResize);

    animate();

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }

      viewport.removeEventListener('mousedown', onMouseDown);
      viewport.removeEventListener('mousemove', onMouseMove);
      viewport.removeEventListener('mouseup', onMouseUp);
      viewport.removeEventListener('mouseleave', onMouseUp);
      viewport.removeEventListener('wheel', onWheel);
      viewport.removeEventListener('touchstart', onTouchStart);
      viewport.removeEventListener('touchmove', onTouchMove);
      viewport.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', onWindowResize);
      viewport.style.perspective = '';
    };
  }, [images]);

  return (
    <main className="min-h-[calc(100vh-4rem)] overflow-hidden">
      <style>{INFINITE_ALT_STYLES}</style>

      <section className={`vh-infinite-alt-root ${isNight ? 'is-night' : 'is-day'}`}>
        {images.length === 0 ? (
          <div className="vh-infinite-alt-empty">No images found in src/assets.</div>
        ) : (
          <div ref={viewportRef} className="vh-infinite-alt-viewport">
            <div ref={containerRef} className="vh-infinite-alt-container">
              <div ref={gridRef} className="vh-infinite-alt-grid" />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
