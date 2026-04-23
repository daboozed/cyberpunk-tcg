import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

let cache = null;
let listeners = [];

function notify() {
  listeners.forEach(fn => fn({ ...cache }));
}

async function loadOnce() {
  if (cache !== null) return;
  cache = {};
  const records = await base44.entities.CardImage.list();
  records.forEach(r => { cache[r.card_id] = r.image_url; });
  notify();
}

export function useCardImages() {
  const [images, setImages] = useState(cache || {});

  useEffect(() => {
    listeners.push(setImages);
    loadOnce();
    return () => { listeners = listeners.filter(l => l !== setImages); };
  }, []);

  return images;
}

export function invalidateCardImages() {
  cache = null;
  loadOnce();
}