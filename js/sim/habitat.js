import * as THREE from 'three';
import { renderedHeight } from './model.js';
import { HABITAT_VISUAL } from '../config.js';

// Authored engineering visualization [H], informed by NASA MSH concepts.
// Dimensions, arrangement and hardware are not a flight design or NASA CAD.
export function buildHabitat(scene, terrain, datum, base, prep) {
  const root = new THREE.Group();
  const bx=base.x+HABITAT_VISUAL.offsetM, bz=base.z;
  const ground=(x,z)=>renderedHeight(terrain,bx+x,bz+z)-datum;
  const deck=Math.max(...[-4,4].flatMap(x=>[-6,6].map(z=>ground(x,z))))+1.1;
  root.position.set(bx,deck,bz); scene.add(root);
  const mat=(color,metalness=.1,roughness=.65)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
  const shell=mat('#e2e4de',.35,.45), frame=mat('#596670',.65,.4), dark=mat('#202f38',.3), orange=mat('#c47b3e'), foil=mat('#b2a37a',.55,.48), blue=mat('#24446a',.5,.3), glass=mat('#16313c',.7,.17);
  const mesh=(geometry,material,x,y,z,rx=0,rz=0)=>{
    const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.rotation.set(rx,0,rz);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;
  };
  const box=(x,y,z,w,h,d,m=frame)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z);
  const cylinder=(x,y,z,r,h,m=frame,rx=0)=>mesh(new THREE.CylinderGeometry(r,r,h,32),m,x,y,z,rx);
  const ring=(x,y,z,r,t,m=frame)=>mesh(new THREE.TorusGeometry(r,t,8,48),m,x,y,z);
  const rod=(a,b,r=.045,m=frame)=>{
    const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),delta=to.clone().sub(from);
    const item=mesh(new THREE.CylinderGeometry(r,r,delta.length(),8),m,...from.clone().add(to).multiplyScalar(.5).toArray());
    item.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return item;
  };
  function label(text,x,y,z,w=2,h=.5) {
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=192;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#20343e';ctx.fillRect(0,0,768,192);
    ctx.fillStyle='#f0f3e9';ctx.font='600 48px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,96,720);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:texture,roughness:.8}),x,y,z);
  }
  // Pressure barrel, formed end caps and circumferential structural seams.
  cylinder(0,3.1,0,2.7,8.8,shell,Math.PI/2);
  for(const z of [-4.4,4.4]) mesh(new THREE.SphereGeometry(2.7,40,20),shell,0,3.1,z).scale.set(1,1,.38);
  for(const z of [-4.3,-2.2,0,2.2,4.3]) ring(0,3.1,z,2.72,.045,frame);
  // A real floor and terrain-adjusted legs replace floating geometry.
  box(0,.1,0,6.5,.3,10.3);
  for(const x of [-2.9,2.9]) for(const z of [-4.2,4.2]) {
    const low=ground(x,z)-deck;
    cylinder(x,(low+.1)/2,z,.14,.1-low);
    cylinder(x,low+.08,z,.65,.16,frame);
    rod([x,low+.3,z],[x*.7,.7,z*.85],.07);
    box(x,.3,z,.55,.2,.6,orange);
  }
  // Forward transfer tunnel and airlock: distinct from the main pressure shell.
  cylinder(0,1.65,6,1.5,3.5,shell,Math.PI/2);
  for(const z of [4.6,6.1,7.7])ring(0,1.65,z,1.53,.065,frame);
  cylinder(0,1.65,7.79,1.43,.12,dark,Math.PI/2);
  cylinder(0,1.65,7.88,1.18,.12,shell,Math.PI/2);
  ring(0,1.65,7.96,1.22,.065,orange);
  ring(0,1.65,8.05,.34,.035,frame);
  for(let i=0;i<8;i++) {const a=i*Math.PI/4;cylinder(Math.cos(a)*1.08,1.65+Math.sin(a)*1.08,8.01,.045,.1,frame,Math.PI/2);}
  box(.7,1.65,8.07,.12,.4,.1,frame);box(-.48,1.95,8.01,.46,.28,.04,glass);
  label('AIRLOCK  /  CONCEPT [H]',0,3.48,5.65,2.9,.48);
  // Porch and access steps, handrails and open space in front of the hatch.
  box(0,-.02,8.2,3.5,.22,2.5);
  for(let i=0;i<5;i++)box(0,-.2-i*.2,9.6+i*.35,1.8,.15,.36);
  for(const x of [-1.6,1.6]) {
    for(const z of [7.3,8.3,9.3])rod([x,.1,z],[x,1.1,z],.035);
    rod([x,1.1,7.3],[x,1.1,9.3],.04,orange);
  }
  // Selected hydrogen-rich shielding is represented by segmented service tanks.
  if(prep.shelter==='polymer') {
    for(const side of [-1,1])for(let i=0;i<6;i++) {
      cylinder(side*2.65,2.9,-3.5+i*1.35,.32,2.7,foil);
      for(const y of [1.65,4.15])cylinder(side*2.65,y,-3.5+i*1.35,.35,.1,frame);
    }
    label('WATER / POLYMER SHIELDING [H]',0,4.25,5.5,3.8,.4);
  }
  // Regolith option uses engineered containment cells; the entry remains clear.
  if(prep.shelter==='regolith') {
    const soil=mat('#8c735d',0,.95);
    for(const side of [-1,1])for(let row=0;row<3;row++)for(let i=0;i<6;i++) {
      box(side*(3.5-row*.25),.5+row*1.05,-4+i*1.65,1.15,1,1.55,soil);
      box(side*(4.09-row*.25),.5+row*1.05,-4+i*1.65,.04,.85,1.4,frame);
    }
    label('REGOLITH CONTAINMENT [H]',0,4.25,5.5,3.5,.4);
  }
  // Thermal loop radiators and power arrays are recognizable pieces of equipment.
  if(prep.essentials.includes('cooling'))for(const side of [-1,1]) {
    box(side*4,3.6,-2,.12,2.2,4.5,shell);
    for(let i=0;i<12;i++)box(side*4.08,3.6,-4+i*.35,.03,2.05,.025,frame);
    rod([side*2,1.5,-2],[side*4,2.5,-2],.07);
  }
  if(prep.essentials.includes('power')) for(const side of [-1,1]) {
    const panel=new THREE.Group();panel.position.set(side*8.2,1.3,-1);panel.rotation.z=-side*.18;root.add(panel);
    const slab=new THREE.Mesh(new THREE.BoxGeometry(5.5,.12,6.2),frame);panel.add(slab);
    for(let i=0;i<5;i++)for(let j=0;j<6;j++) {
      const cell=new THREE.Mesh(new THREE.BoxGeometry(1.02,.025,.94),blue);cell.position.set((i-2)*1.08,.08,(j-2.5)*1.01);panel.add(cell);
    }
    for(const z of [-3,1])rod([side*8.2,ground(side*8.2,z)-deck,z],[side*8.2,1.3,z],.08);
    box(side*5.7,.6,3.2,1.1,1.2,1.5,dark);
  }
  if(prep.essentials.includes('comms')) {
    cylinder(-1.8,6.4,-3,.06,3.7,frame);
    const dish=mesh(new THREE.SphereGeometry(.85,32,12,0,Math.PI*2,0,.65),shell,-1.8,8.1,-3,Math.PI/3);dish.material=mat('#d7ddd9');dish.material.side=THREE.DoubleSide;
    rod([-1.8,8.1,-3],[-1.8,8.8,-2.6],.025);cylinder(1.7,6,-3,.025,2.7,frame);
  }
  // Selected tools and procedures get a visible service area rather than changing physics.
  for(const [i,id] of prep.equipment.entries()) {
    const x=3.9+(i%3)*.85,z=5+Math.floor(i/3)*.9;
    box(x,.35,z,.72,.7,.66,id==='medico'?shell:foil);box(x,.68,z,.76,.08,.7,frame);
    box(x,.38,z+.34,.22,.1,.02,id==='medico'?orange:dark);
  }
  if(prep.extras?.includes('repair')) {box(-4,.7,5.4,1.9,.18,1);for(const x of [-4.7,-3.3])rod([x,0,5.4],[x,.7,5.4],.04);box(-4,1,5.3,.9,.45,.5,orange);}
  if(prep.extras?.includes('dust')) {box(-2,.02,8.2,.6,.1,1.8,dark);rod([-2,.1,7.5],[-2,1.4,7.5],.03);}
  if(prep.extras?.includes('backup'))for(const x of [-4.2,-3.6])cylinder(x,1.1,3.5,.23,1.5,shell);
  label(`SURFACE HABITAT  /  CREW ${prep.crew} [H]`,0,4.9,5.22,3.8,.42);
  // Optional rover includes a pressure cabin, windows, suspension and six wheels.
  if(prep.rover) {
    const rx=13,rz=8,ry=ground(rx,rz)-deck;
    box(rx,ry+1.3,rz,2.5,.5,4.4,frame);box(rx,ry+2.35,rz,2.3,1.8,3.4,shell);
    box(rx,ry+2.65,rz+1.72,1.9,.8,.035,glass);box(rx,ry+3.3,rz,2.5,.13,3.6,shell);
    for(const side of [-1,1])for(const dz of [-1.6,0,1.6]) {
      const wheel=cylinder(rx+side*1.5,ry+.7,rz+dz,.65,.4,dark);wheel.rotation.z=Math.PI/2;
      const hub=cylinder(rx+side*1.73,ry+.7,rz+dz,.32,.05,frame);hub.rotation.z=Math.PI/2;
      rod([rx+side*.8,ry+1.4,rz+dz],[rx+side*1.5,ry+.7,rz+dz],.08);
      for(let k=0;k<12;k++) {const a=k*Math.PI/6;box(rx+side*1.5,ry+.7+Math.cos(a)*.65,rz+dz+Math.sin(a)*.65,.43,.045,.09,frame);}
    }
    for(const x of [-.8,.8])box(rx+x,ry+1.8,rz+1.74,.3,.18,.1,shell);
    cylinder(rx,ry+3.8,rz-1,.03,1,frame);
  }
  return {x:bx,z:bz,radius:HABITAT_VISUAL.collisionRadiusM,inspectX:bx,inspectZ:bz+10};
}
