'use client';
/**
 * OpenSlot — drop-in editable region for OpenSpace.
 *
 * Usage:
 *   <OpenSlot name="hero" path="/">
 *     <h1>Default headline</h1>
 *     <p>This renders until someone publishes an edit in OpenSpace.</p>
 *   </OpenSlot>
 *
 * Props:
 *   name     (required) — unique slot name on this page
 *   path     (optional) — page path the content is keyed by; defaults to current pathname
 *   as       (optional) — wrapper tag, default 'div'
 *   className / style — passed through to the wrapper
 *
 * The wrapper always carries data-ospace-slot={name}, which is what the
 * OpenSpace editor detects when you open this page via "Edit a URL".
 */
import { useEffect, useState } from 'react';

const cache = new Map(); // path -> Promise<slots>

function fetchSlots(path) {
  if (!cache.has(path)) {
    cache.set(
      path,
      fetch(`/api/content?path=${encodeURIComponent(path)}`)
        .then((r) => (r.ok ? r.json() : {}))
        .catch(() => ({}))
    );
  }
  return cache.get(path);
}

export default function OpenSlot({ name, path, as: Tag = 'div', className, style, children }) {
  const [html, setHtml] = useState(null);

  useEffect(() => {
    const p = path || window.location.pathname;
    let alive = true;
    fetchSlots(p).then((slots) => {
      if (alive && slots && typeof slots[name] === 'string') setHtml(slots[name]);
    });
    return () => { alive = false; };
  }, [name, path]);

  if (html !== null) {
    return (
      <Tag
        data-ospace-slot={name}
        className={className}
        style={style}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return (
    <Tag data-ospace-slot={name} className={className} style={style}>
      {children}
    </Tag>
  );
}
