/* ROTVEIN — object pooling. Nothing that spawns every frame is ever
   allocated twice: meshes are hidden and handed back out. */

export function Pool(make) {
  const free = [], live = [];
  return {
    free, live,
    get() {
      const o = free.pop() || make();
      live.push(o);
      o.mesh.visible = true;
      return o;
    },
    put(o) {
      o.mesh.visible = false;
      const i = live.indexOf(o);
      if (i >= 0) live.splice(i, 1);
      free.push(o);
    },
    /** iterate live objects backwards so callbacks may recycle safely */
    each(fn) { for (let i = live.length - 1; i >= 0; i--) fn(live[i], i); },
    clear() { for (let i = live.length - 1; i >= 0; i--) this.put(live[i]); },
    get count() { return live.length; },
  };
}
