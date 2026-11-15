import * as THREE from 'three';
import { SIM_DETAIL, FIELD_VISUAL } from '../config.js';
import { renderedHeight } from './model.js';
import { scienceFor, FIELD_GUIDE } from '../science.js';
import { buildHabitat } from './habitat.js';

function rockGeometry() {
  const geo=new THREE.IcosahedronGeometry(1,2),pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++) {
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
    const d=1+.12*Math.sin(x*17+z*9)*Math.cos(y*13)+.06*Math.sin(z*31);
    pos.setXYZ(i,x*d,y*d,z*d);
  }
  geo.computeVertexNormals();return geo;
}
function rockMaterial() {
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
  const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(256,256);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++) {
    const n=Math.sin(x*127.1+y*311.7)*43758.5453;
    const shade=(n-Math.floor(n))*24+Math.sin(y*.32+Math.sin(x*.025)*2)*9;
    const k=(y*256+x)*4;pixels.data[k]=116+shade;pixels.data[k+1]=99+shade;pixels.data[k+2]=81+shade;pixels.data[k+3]=255;
  }
  ctx.putImageData(pixels,0,0);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({map:texture,roughness:1});
}
// Illustrative distributions [H], anchored around real route positions, never a density survey.
export function addFieldObjects(scene, terrain, baseHeight, targets, base, prep, points) {
  const ground=(x,z)=>renderedHeight(terrain,x,z)-baseHeight;
  const geometry=rockGeometry(),material=rockMaterial();
  const specimens=[],scatter=[];
  const pale=new THREE.MeshStandardMaterial({color:'#cfc5a8',roughness:1});
  const dark=new THREE.MeshStandardMaterial({color:'#53483d',roughness:1});
  const addRock=(x,z,sx,sy,sz,angle=0)=>{
    const rock=new THREE.Mesh(geometry,material);rock.scale.set(sx,sy,sz);rock.position.set(x,ground(x,z)+sy*.55,z);rock.rotation.y=angle;rock.castShadow=true;rock.receiveShadow=true;scene.add(rock);return rock;
  };
  const segment=(a,b,width,height,mat)=>{
    const delta=new THREE.Vector3().subVectors(b,a),mid=a.clone().add(b).multiplyScalar(.5);
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(width,height,delta.length()),mat);
    mesh.position.copy(mid);mesh.lookAt(b);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);return mesh;
  };
  function outcrop(x,z,kind,seed=0) {
    if(kind==='ridge') {
      // Low intersecting ribs [H]; the orbital DTM remains unchanged.
      const nodes=[[-5,-3],[-1,-4],[3,-2],[5,2],[1,4],[-4,3],[0,0]];
      for(const [i,j] of [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,6],[2,6],[4,6]]) {
        const a=nodes[i],b=nodes[j];
        const start=new THREE.Vector3(x+a[0],ground(x+a[0],z+a[1])+.45,z+a[1]);
        const end=new THREE.Vector3(x+b[0],ground(x+b[0],z+b[1])+.45,z+b[1]);
        const steps=Math.ceil(start.distanceTo(end)/.55);
        for(let k=0;k<=steps;k++) {
          const q=start.clone().lerp(end,k/steps);
          addRock(q.x,q.z,.43,.6+(k%3)*.07,.5,k*.4);
        }
        segment(start.clone().add(new THREE.Vector3(0,.42,0)),end.clone().add(new THREE.Vector3(0,.42,0)),.055,.025,dark);
        for(let k=0;k<6;k++) {
          const q=start.clone().lerp(end,(k+.5)/6),n=new THREE.Mesh(geometry,k%2?material:pale);
          n.scale.set(.09,.06,.08);n.position.set(q.x+.27,q.y+.33,q.z);scene.add(n);
        }
      }
    } else {
      const rock=addRock(x,z,1.5,.65,1,seed*.3);
      for(let i=0;i<3;i++) {
        const line=new THREE.Mesh(new THREE.BoxGeometry(2.1,.025,.035),pale);
        line.position.set(x,rock.position.y+.54,z+(i-1)*.3);line.rotation.y=.25+i*.12;scene.add(line);
      }
      if(kind==='mudstone')for(let i=0;i<14;i++) {
        const dot=new THREE.Mesh(new THREE.TorusGeometry(.045,.012,5,10),dark);
        dot.rotation.x=-Math.PI/2;dot.position.set(x+Math.sin(i*7)*.85,rock.position.y+.55,z+Math.cos(i*3)*.45);scene.add(dot);
      }
      if(kind==='drill') {
        const hole=new THREE.Mesh(new THREE.CircleGeometry(.055,24),dark);
        hole.rotation.x=-Math.PI/2;hole.position.set(x+.2,rock.position.y+.57,z);scene.add(hole);
        const tailings=new THREE.Mesh(new THREE.RingGeometry(.06,.12,24),pale);
        tailings.rotation.x=-Math.PI/2;tailings.position.copy(hole.position);scene.add(tailings);
      }
    }
  }
  for(const [t,target] of targets.entries()) {
    const kind=scienceFor(target.target)?.kind;
    outcrop(target.x+6,target.z,kind,t);
    for(let i=0;i<SIM_DETAIL.rocksPerTarget;i++) {
      const a=(i*137.508+t*31)*Math.PI/180,r=Math.sqrt((i+1)/SIM_DETAIL.rocksPerTarget)*SIM_DETAIL.rockFieldRadiusM;
      scatter.push({x:target.x+Math.cos(a)*r,z:target.z+Math.sin(a)*r,size:SIM_DETAIL.rockMinM+(i*17%23)/23*(SIM_DETAIL.rockMaxM-SIM_DETAIL.rockMinM)});
    }
  }
  const seen=new Set();
  for(let i=1;i<points.length;i++) {
    const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.z-a.z);
    if(!length)continue;
    for(let step=FIELD_VISUAL.trailSpacingM;step<length;step+=FIELD_VISUAL.trailSpacingM) {
      const u=step/length,x=a.x+(b.x-a.x)*u+(b.z-a.z)/length*FIELD_VISUAL.trailOffsetM,z=a.z+(b.z-a.z)*u-(b.x-a.x)/length*FIELD_VISUAL.trailOffsetM;
      const key=`${Math.round(x/12)},${Math.round(z/12)}`;
      if(seen.has(key)||targets.some(t=>Math.hypot(t.x-x,t.z-z)<24))continue;seen.add(key);
      const guide=FIELD_GUIDE[prep.site],rock=addRock(x,z,.7,.35,.55,i);
      specimens.push({x,z,optional:true,visited:false,target:{name:guide.name,science:guide,why:guide.evidence,photo:guide.photo,credit:guide.credit}});
      for(let k=0;k<3;k++)scatter.push({x:x+Math.cos(k*2+i)*1.2,z:z+Math.sin(k*2+i)*1.2,size:.15+k*.08});
      if(prep.site==='gale')for(let k=0;k<5;k++) {
        const n=new THREE.Mesh(geometry,pale);n.scale.set(.07,.045,.06);n.position.set(x+Math.cos(k*2)*.4,rock.position.y+.28,z+Math.sin(k*2)*.3);scene.add(n);
      }
    }
  }
  const rocks=new THREE.InstancedMesh(geometry,material,scatter.length),transform=new THREE.Object3D();
  scatter.forEach((p,i)=>{transform.position.set(p.x,ground(p.x,p.z)+p.size*.2,p.z);transform.rotation.set(i*.13,i*.7,i*.09);transform.scale.set(p.size,p.size*.45,p.size*.8);transform.updateMatrix();rocks.setMatrixAt(i,transform.matrix);});
  rocks.instanceMatrix.needsUpdate=true;rocks.computeBoundingSphere();rocks.receiveShadow=true;scene.add(rocks);
  return {specimens,habitat:buildHabitat(scene,terrain,baseHeight,base,prep)};
}
