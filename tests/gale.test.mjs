import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { preparedSites } from '../js/routes.js';
import { parseTerrain, lonLatToLocal, heightAt, slopeAt } from '../js/sim/terrain.js';
import { FIELD_GUIDE, scienceFor } from '../js/science.js';
import { SLOPE_NOGO_DEG } from '../js/config.js';

const raw=JSON.parse(readFileSync(new URL('../data/sites.json',import.meta.url)));
const sites=preparedSites(raw), gale=sites.find(s=>s.id==='gale');
const meta=JSON.parse(readFileSync(new URL('../data/gale/terrain.json',import.meta.url)));
const bytes=readFileSync(new URL('../data/gale/terrain.bin',import.meta.url));
const terrain=parseTerrain(meta,bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));

test('simulator HUD references resolve to real HTML elements before boot',()=>{
  const html=readFileSync(new URL('../sim.html',import.meta.url),'utf8');
  const code=readFileSync(new URL('../js/sim/main.js',import.meta.url),'utf8');
  const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  for(const match of code.matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.has(match[1]),`Missing HTML element ${match[1]}`);
});

test('shared catalog exposes both Gale routes without changing source data or duplicating routes',()=>{
  assert.equal(gale.hasSim,true);
  assert.deepEqual(gale.routes.map(r=>r.id),['boxwork','boxwork-ridge-short']);
  assert.equal(raw.find(s=>s.id==='gale').routes.length,1);
  assert.equal(preparedSites(sites).find(s=>s.id==='gale').routes.length,2);
  assert.deepEqual(gale.routes[1].waypoints.filter(p=>p.target).map(p=>p.target.name),['Boxwork ridge']);
});
test('Gale grid contains only valid elevations and covers every point of both routes',()=>{
  assert.equal(terrain.heights.length,meta.width*meta.height);
  assert.equal(meta.void_count,0);
  assert.ok(meta.source_url.includes('019698_1750_019988_1750'));
  assert.ok(terrain.heights.every(v=>Number.isFinite(v)&&v>-4000&&v<-3000));
  for(const route of gale.routes)for(const point of [gale.habitat,...route.waypoints]) {
    const p=lonLatToLocal(terrain,point.lat,point.lon);
    assert.ok(Math.abs(p.x)<800&&Math.abs(p.z)<800);
    // Independent rover altitudes are NOT silently forced to match this older DTM.
    assert.ok(Math.abs(heightAt(terrain,p.x,p.z)-point.elev_m)<20);
  }
});
test('both Gale routes have a connected walkable corridor around their recorded stops',()=>{
  // A few steep pixels cross straight waypoint chords; confirm room to walk around them.
  // This is a simulator reachability check, not astronaut route certification.
  const step=3, margin=24;
  const points=[gale.habitat,...gale.routes[0].waypoints,gale.habitat].map(p=>lonLatToLocal(terrain,p.lat,p.lon));
  for(let k=1;k<points.length;k++) {
    const a=points[k-1],b=points[k],xmin=Math.min(a.x,b.x)-margin,zmin=Math.min(a.z,b.z)-margin;
    const w=Math.ceil((Math.abs(a.x-b.x)+2*margin)/step)+1,h=Math.ceil((Math.abs(a.z-b.z)+2*margin)/step)+1;
    const cell=p=>[Math.round((p.x-xmin)/step),Math.round((p.z-zmin)/step)];
    const [sx,sz]=cell(a),[ex,ez]=cell(b),end=ez*w+ex,queue=[sz*w+sx],visited=new Set(queue);
    let found=false;
    for(let q=0;q<queue.length;q++) {
      const index=queue[q];if(index===end){found=true;break;}
      const x=index%w,z=Math.floor(index/w);
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx=x+dx,nz=z+dz,next=nz*w+nx;
        if(nx<0||nx>=w||nz<0||nz>=h||visited.has(next))continue;
        visited.add(next);
        if(slopeAt(terrain,xmin+nx*step,zmin+nz*step)<=SLOPE_NOGO_DEG)queue.push(next);
      }
    }
    assert.ok(found,`No walkable simulator corridor for segment ${k}`);
  }
});
test('optional field specimens explicitly distinguish regional observations from invented objects',()=>{
  for(const guide of Object.values(FIELD_GUIDE)) {
    assert.ok(guide.evidence.includes('not'));
    assert.equal(scienceFor({science:guide}),guide);
    assert.ok(new URL(guide.source).hostname.endsWith('nasa.gov'));
  }
});
