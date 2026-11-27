
/* ================= 3Dで見せる層（戦いの計算は そのまま。見せ方だけを 立体にする） ================= */
const S3=.1,X3=x=>(x-180)*S3,Z3=y=>(y-320)*S3,EM=E3.M;
E3.initAssets();
const glc=document.getElementById('gl');
const ren=new THREE.WebGLRenderer({canvas:glc,antialias:true,powerPreference:'high-performance'});
ren.setPixelRatio(Math.min(2,window.devicePixelRatio||1));ren.shadowMap.enabled=true;ren.shadowMap.type=THREE.PCFSoftShadowMap;ren.toneMapping=THREE.ACESFilmicToneMapping;ren.toneMappingExposure=.98;
const scene=new THREE.Scene();scene.background=new THREE.Color(0xa9d3f0);scene.fog=new THREE.Fog(0xa9d3f0,110,240);
scene.environment=new THREE.PMREMGenerator(ren).fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.55;
const cam3=new THREE.PerspectiveCamera(38,1,.5,420);
{const hemi=new THREE.HemisphereLight(0xdcefff,0x5d7a3d,1.1),sun=new THREE.DirectionalLight(0xfff4e0,2.5);sun.position.set(34,62,28);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-48,right:48,top:48,bottom:-48,near:1,far:170});sun.shadow.bias=-.0006;sun.shadow.normalBias=.04;scene.add(hemi,sun)}
{const far=new THREE.Mesh(new THREE.PlaneGeometry(700,700),new THREE.MeshStandardMaterial({color:0x5b9138,roughness:1}));far.rotation.x=-Math.PI/2;far.position.y=-.06;far.receiveShadow=true;scene.add(far)}

/* ---- 地図ごとに 作りなおす もの：地面・道・城・木・マス ---- */
let world=null,built=null,keepTop=12;const cst={x:0,z:0};
function groundTex(){const k=document.createElement('canvas');k.width=1040;k.height=1600;const x=k.getContext('2d'),P=v=>(v+80)*2;
  x.fillStyle='#5b9138';x.fillRect(0,0,1040,1600);
  for(let i=0;i<2600;i++){x.fillStyle=['rgba(70,120,44,.3)','rgba(110,160,66,.26)','rgba(84,138,52,.3)','rgba(140,176,80,.16)'][i&3];x.beginPath();x.arc(Math.random()*1040,Math.random()*1600,6+Math.random()*26,0,TAU);x.fill()}
  for(const pass of[['#7d7052',1.5,62],['#c2ae82',1.08,52]]){x.strokeStyle=x.fillStyle=pass[0];x.lineCap='round';x.lineWidth=pass[2]*2;
    x.beginPath();for(const d of DIRS){x.moveTo(P(d.x-d.ox*8),P(d.y-d.oy*8));x.lineTo(P(d.x+d.ox*130),P(d.y+d.oy*130))}x.stroke();
    x.beginPath();for(let i=0;i<blocked.length;i++)if(!blocked[i]){const px=P((i%GW)*CS+CS/2),py=P(((i/GW)|0)*CS+CS/2),r=CS*2*pass[1];x.moveTo(px+r,py);x.arc(px,py,r,0,TAU)}x.fill()}
  for(let i=0;i<9000;i++){x.fillStyle=i&1?'rgba(255,250,235,.07)':'rgba(40,30,10,.07)';x.fillRect(Math.random()*1040,Math.random()*1600,3,3)}
  const t=new THREE.CanvasTexture(k);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
function farFromRoad(x,y,r){for(let a=0;a<8;a++){const px=x+Math.cos(a*.785)*r,py=y+Math.sin(a*.785)*r;if(px<0||py<0||px>=W||py>=HT||!blk(px,py))return false}return blk(x,y)}
function build3d(m){if(world){scene.remove(world);world.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material&&o.material.userData&&o.material.userData.own){o.material.map.dispose();o.material.dispose()}})}
  world=new THREE.Group();scene.add(world);built=m;E3.setSeed(m.id*13+7);
  {const gm=new THREE.MeshStandardMaterial({map:groundTex(),roughness:.96});gm.userData.own=1;const g=new THREE.Mesh(new THREE.PlaneGeometry(52,80),gm);g.rotation.x=-Math.PI/2;g.receiveShadow=true;world.add(g)}
  /* 城：石垣の上に 五層の 天守（鶴ヶ城の 赤瓦） */
  {const w=(CX1-CX0)*S3,d=(CY1-CY0)*S3,cx=X3((CX0+CX1)/2),cz=Z3((CY0+CY1)/2);cst.x=cx;cst.z=cz;
    world.add(E3.mesh(E3.stoneBaseGeo(w,d,w*.93,d*.93,1.1),EM.stone,cx,0,cz));world.add(E3.mesh(E3.boxGeo(w*.93,.08,d*.93),EM.gravel,cx,1.1,cz));
    const k=new THREE.Group(),f=Math.min(w*.86/12,d*.86/11);k.position.set(cx,1.1,cz);k.scale.setScalar(f);world.add(k);
    k.add(E3.mesh(E3.stoneBaseGeo(12,11,9.6,8.8,4.2),EM.stoneWarm,0,0,0));
    const tiers=[{w:8.4,d:7.6,h:2.2},{w:7.4,d:6.6,h:1.8},{w:6.4,d:5.6,h:1.7},{w:5.3,d:4.6,h:1.6},{w:4.1,d:3.6,h:1.6}];
    const main=E3.buildKeep({x:0,z:0,y:4.2,tiers,ov:.85,rise:.75,up:.4,topRise:1.6,roofMat:EM.roofRed});k.add(main.walls,main.roofs);k.add(E3.mesh(E3.boxGeo(8.45,.6,7.65),EM.darkWood,0,4.5,0));
    const T=main.info;for(const a of[[2.6,1.05,0,'pz'],[2.6,1.05,0,'nz'],[2.4,1,1,'px'],[2.4,1,1,'nx'],[2.2,.9,2,'pz']])E3.placeGable(k,{w:a[0],h:a[1],roofMat:EM.roofRed},0,0,T[a[2]],T[a[2]+1],.85,a[3]);
    k.add(E3.shachihoko(-T.ridge.half,T.ridge.y,0,-1,1.15),E3.shachihoko(T.ridge.half,T.ridge.y,0,1,1.15));keepTop=1.1+(T.ridge.y+1)*f;
    const b=new E3.Batch();for(const s of[[-1,-1],[1,-1],[-1,1],[1,1]])E3.pineTree(b,cx+s[0]*w*.4,1.1,cz+s[1]*d*.4,.75);b.build(world)}
  /* 木：道から はなれた 所に。外がわには 多めに */
  {const b=new E3.Batch();let n=0;
    for(let i=0;i<900&&n<64;i++){const x=10+E3.rnd()*340,y=10+E3.rnd()*620;if(!farFromRoad(x,y,17)||inCastle(x,y))continue;if(PADS.some(p=>p.sx&&Math.hypot(p.sx-x,p.sy-y)<34))continue;n++;(E3.rnd()<.42?E3.sakuraTree:E3.pineTree)(b,X3(x),0,Z3(y),.9+E3.rnd()*.6)}
    for(let i=0;i<500;i++){const x=-80+E3.rnd()*520,y=-80+E3.rnd()*800;if(x>-6&&x<W+6&&y>-6&&y<HT+6)continue;if(DIRS.some(d=>segD(x,y,d.x,d.y,d.x+d.ox*140,d.y+d.oy*140)<44))continue;(E3.rnd()<.3?E3.sakuraTree:E3.pineTree)(b,X3(x),0,Z3(y),1.1+E3.rnd()*.9)}
    b.build(world);for(let i=0;i<12;i++){const a=i*.524+E3.rnd()*.3,r=74+E3.rnd()*22;E3.hill(world,Math.sin(a)*r,Math.cos(a)*r,9+E3.rnd()*8)}}
  /* 数字のマスと、櫓・大筒の 立つ 台 */
  for(const p of PADS){const col=p.type==='jin'?0x3a9c5c:p.type==='yumi'?0x3c76c8:0x7a5632,ed=p.type==='jin'?0x1c5a34:p.type==='yumi'?0x1c3f78:0x4a2f18;
    const a=new THREE.Mesh(new THREE.BoxGeometry(3.7,.1,2.7),new THREE.MeshStandardMaterial({color:ed,roughness:.8}));a.position.set(X3(p.x),.05,Z3(p.y));a.receiveShadow=true;world.add(a);
    const t=new THREE.Mesh(new THREE.BoxGeometry(3.3,.1,2.3),new THREE.MeshStandardMaterial({color:col,roughness:.7}));t.position.set(X3(p.x),.1,Z3(p.y));t.receiveShadow=true;world.add(t);
    if(p.sx){const s=E3.mesh(new THREE.CylinderGeometry(2.3,2.7,.36,20),EM.stone,X3(p.sx),.18,Z3(p.sy));world.add(s);world.add(E3.mesh(new THREE.CylinderGeometry(2.1,2.1,.06,20),EM.gravel,X3(p.sx),.39,Z3(p.sy)))}}}

/* ---- 櫓と大筒（レベルで 姿が かわる） ---- */
const mIron=new THREE.MeshStandardMaterial({color:0x23262e,metalness:.7,roughness:.38}),mGoldI=new THREE.MeshStandardMaterial({color:0xe2b23c,metalness:.85,roughness:.3});
let tw=[],twG=null;
function mkTower(p){const g=new THREE.Group(),lv=p.lv;g.position.set(X3(p.sx),.4,Z3(p.sy));
  if(p.type==='yagura'){const h=2.4+lv*.35,s=1+lv*.07;g.scale.setScalar(s);
    for(const a of[[-1,-1],[1,-1],[-1,1],[1,1]]){const l=E3.mesh(E3.boxGeo(.24,h,.24),EM.darkWood,a[0]*.85,h/2,a[1]*.85);l.rotation.z=-a[0]*.07;l.rotation.x=a[1]*.07;g.add(l)}
    g.add(E3.mesh(E3.boxGeo(2.3,.16,2.3),EM.darkWood,0,h*.5,0));g.add(E3.mesh(E3.boxGeo(2.5,.2,2.5),EM.darkWood,0,h,0));
    const k=E3.buildKeep({x:0,z:0,y:h+.1,tiers:lv>=3?[{w:2,d:2,h:1.1},{w:1.4,d:1.4,h:.9}]:[{w:1.9,d:1.9,h:1.2}],ov:.5,rise:.45,up:.22,winScale:.7,topRise:.85,roofMat:lv>=4?EM.gold:EM.roofRed});g.add(k.walls,k.roofs)}
  else{const n=lv>=5?3:lv>=3?2:1,s=1+lv*.08,B=lv>=4?mGoldI:mIron;g.scale.setScalar(s);
    for(let i=0;i<n;i++){const z=(i-(n-1)/2)*1.5,q=new THREE.Group();q.position.z=z;g.add(q);q.add(E3.mesh(E3.boxGeo(2.1,.42,1),EM.darkWood,-.1,.5,0));
      const bar=E3.mesh(new THREE.CylinderGeometry(.3,.38,2.5,14),B,.35,1,0);bar.rotation.z=-Math.PI/2+.16;q.add(bar);const mz=E3.mesh(new THREE.CylinderGeometry(.4,.4,.2,14),B,1.56,1.2,0);mz.rotation.z=-Math.PI/2+.16;q.add(mz);
      for(const w of[-.56,.56]){const wh=E3.mesh(new THREE.CylinderGeometry(.5,.5,.14,14),EM.darkWood,-.2,.5,w);wh.rotation.x=Math.PI/2;q.add(wh)}}}
  return g}

/* ---- うごく もの：立て札の兵、影、矢、弾、小判、光 ---- */
const texOf=new Map(),_m=new THREE.Matrix4(),_p=new THREE.Vector3(),_q=new THREE.Quaternion(),_s=new THREE.Vector3(),_e=new THREE.Euler(),_c=new THREE.Color(),QI=new THREE.Quaternion();
function mkBB(cap){const geo=new THREE.PlaneGeometry(1,1);geo.translate(0,.5,0);const m=new THREE.InstancedMesh(geo,new THREE.MeshBasicMaterial({alphaTest:.5,side:THREE.DoubleSide,toneMapped:false}),cap);m.frustumCulled=false;m.count=0;m.renderOrder=2;scene.add(m);return m}
function useTex(m,cvs){if(m.userData.src===cvs)return;let t=texOf.get(cvs);if(!t){t=new THREE.CanvasTexture(cvs);t.colorSpace=THREE.SRGBColorSpace;texOf.set(cvs,t)}m.material.map=t;m.material.needsUpdate=true;m.userData.src=cvs;m.userData.asp=cvs.width/cvs.height}
function put(m,x,y,hpx,flip,lift){if(m.count>=m.instanceMatrix.count)return;const h=hpx*S3*1.3;_p.set(X3(x),lift||0,Z3(y));_s.set(h*m.userData.asp*(flip?-1:1),h,1);_m.compose(_p,cam3.quaternion,_s);m.setMatrixAt(m.count++,_m)}
const bbFoe=mkBB(900),bbMid=mkBB(320),bbNin=mkBB(40),bbHero=mkBB(1),bbAshi=mkBB(140),bbTep=mkBB(12),bbYumi=mkBB(12),bbMus=mkBB(8),BBS=[bbFoe,bbMid,bbNin,bbHero,bbAshi,bbTep,bbYumi,bbMus];
function mkInst(geo,mat,cap,order){const m=new THREE.InstancedMesh(geo,mat,cap);m.frustumCulled=false;m.count=0;m.setColorAt(0,_c.set(0xffffff));if(order)m.renderOrder=order;scene.add(m);return m}
const shGeo=new THREE.CircleGeometry(1,14);shGeo.rotateX(-Math.PI/2);
const iShadow=mkInst(shGeo,new THREE.MeshBasicMaterial({color:0x1a1408,transparent:true,opacity:.3,depthWrite:false}),1500,1);
const iBox=mkInst(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({roughness:.7}),700);iBox.castShadow=true;
const iGlow=mkInst(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({toneMapped:false}),1400);
const iBall=mkInst(new THREE.SphereGeometry(1,12,9),new THREE.MeshStandardMaterial({roughness:.4,metalness:.3}),80);
const iFx=mkInst(new THREE.SphereGeometry(1,14,10),new THREE.MeshBasicMaterial({transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}),260,3);
const coinGeo=new THREE.CylinderGeometry(.34,.34,.09,14);coinGeo.rotateX(Math.PI/2);
const iCoin=mkInst(coinGeo,new THREE.MeshStandardMaterial({color:0xf3c53f,metalness:.85,roughness:.3}),420);
const INST=[iShadow,iBox,iGlow,iBall,iFx,iCoin];
function inst(m,x,y,z,sx,sy,sz,yaw,col,pitch){if(m.count>=m.instanceMatrix.count)return;_p.set(x,y,z);_s.set(sx,sy,sz);if(yaw||pitch){_e.set(0,yaw||0,pitch||0);_q.setFromEuler(_e)}else _q.copy(QI);_m.compose(_p,_q,_s);m.setMatrixAt(m.count,_m);if(col!=null)m.setColorAt(m.count,_c.set(col));m.count++}
const shadow=(x,y,r)=>inst(iShadow,X3(x),.045,Z3(y),r,1,r*.8);
const aura=new THREE.Mesh(new THREE.RingGeometry(.82,1,40),new THREE.MeshBasicMaterial({transparent:true,opacity:.95,toneMapped:false,depthWrite:false,side:THREE.DoubleSide}));aura.rotation.x=-Math.PI/2;aura.renderOrder=1;scene.add(aura);
const goalM=new THREE.Mesh(new THREE.RingGeometry(.7,.95,32),new THREE.MeshBasicMaterial({color:0xf0c75e,transparent:true,opacity:.9,toneMapped:false,depthWrite:false,side:THREE.DoubleSide}));goalM.rotation.x=-Math.PI/2;goalM.renderOrder=1;scene.add(goalM);

/* ---- カメラ：指2本（または ボタン・Q/E・右ドラッグ）で 回す、つまんで 寄る ---- */
const CAM={yaw:0,pitch:.9,dist:60,tx:0,tz:0,hold:0,zoomHold:0,intro:0,g:null};
function camRot(ix,iy){const cs=Math.cos(CAM.yaw),sn=Math.sin(CAM.yaw);return[ix*cs+iy*sn,-ix*sn+iy*cs]}
const scrRight=(dx,dy)=>dx*Math.cos(CAM.yaw)-dy*Math.sin(CAM.yaw);
function fit(){const s=$('#stage'),w=Math.max(50,s.clientWidth),h=Math.max(50,s.clientHeight),d=Math.min(2,window.devicePixelRatio||1);ren.setSize(w,h,false);cam3.aspect=w/h;cam3.updateProjectionMatrix();cv.width=Math.round(w*d);cv.height=Math.round(h*d);cv.style.width=w+'px';cv.style.height=h+'px';cv._w=w;cv._h=h;cv._d=d}
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),gpl=new THREE.Plane(new THREE.Vector3(0,1,0),0),hitV=new THREE.Vector3();
function toCanvas(e){const r=cv.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height*2-1));ray.setFromCamera(ndc,cam3);if(!ray.ray.intersectPlane(gpl,hitV))return[G?G.hero.x:180,G?G.hero.y:320,1.5];return[hitV.x/S3+180,hitV.z/S3+320,1.5]}
{const st=$('#stage'),pts=new Map();let gest=false,g0=null,rdrag=null;
  const two=()=>{const a=[...pts.values()];return{ang:Math.atan2(a[1].y-a[0].y,a[1].x-a[0].x),d:Math.hypot(a[1].x-a[0].x,a[1].y-a[0].y)}};
  st.addEventListener('pointerdown',e=>{if(state!=='play')return;if(e.pointerType==='mouse'){if(e.button===2){rdrag={x:e.clientX,y:e.clientY};e.stopPropagation();e.preventDefault()}return}
    pts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pts.size>=2){gest=true;g0=two();joy=null;inp.x=0;inp.y=0;e.stopPropagation()}else if(gest)e.stopPropagation()},true);
  st.addEventListener('pointermove',e=>{if(rdrag&&e.pointerType==='mouse'){CAM.yaw-=(e.clientX-rdrag.x)*.008;CAM.pitch=Math.max(.45,Math.min(1.35,CAM.pitch+(e.clientY-rdrag.y)*.005));rdrag={x:e.clientX,y:e.clientY};e.stopPropagation();return}
    if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(gest){e.stopPropagation();if(pts.size>=2){const t=two();let da=t.ang-g0.ang;if(da>Math.PI)da-=TAU;if(da<-Math.PI)da+=TAU;CAM.yaw-=da;CAM.dist=Math.max(26,Math.min(105,CAM.dist*g0.d/Math.max(20,t.d)));g0=t}}},true);
  const up=e=>{if(e.pointerType==='mouse'){if(rdrag){rdrag=null;e.stopPropagation()}return}pts.delete(e.pointerId);if(gest){e.stopPropagation();if(pts.size===0)gest=false}};
  st.addEventListener('pointerup',up,true);st.addEventListener('pointercancel',up,true);st.addEventListener('contextmenu',e=>e.preventDefault());
  st.addEventListener('wheel',e=>{if(state!=='play')return;CAM.dist=Math.max(26,Math.min(105,CAM.dist*(e.deltaY>0?1.1:.91)));e.preventDefault()},{passive:false});
  document.querySelectorAll('#camui button').forEach(b=>{const on=e=>{e.preventDefault();e.stopPropagation();const k=b.dataset.c;if(k==='l')CAM.hold=1;else if(k==='r')CAM.hold=-1;else CAM.zoomHold=k==='in'?-1:1},off=()=>{CAM.hold=0;CAM.zoomHold=0};
    b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointerleave',off);b.addEventListener('pointercancel',off)})}

const prjV=new THREE.Vector3();
function prj(x,y,h){prjV.set(X3(x),h||0,Z3(y)).project(cam3);return[(prjV.x+1)/2*cv._w,(1-prjV.y)/2*cv._h,prjV.z<1]}
function rrect(k,x,y,w,h,r){k.beginPath();k.roundRect(x,y,w,h,r)}
let last3=0;
function draw(){const now=performance.now(),dt=Math.min(.05,(now-last3)/1000||0);last3=now;const g=G,play=state==='play'&&g;
  if(!CUR)useMap(MAPS[0]);if(built!==CUR)build3d(CUR);
  if(twG!==g||!play){for(const t of tw)if(t&&t.obj)scene.remove(t.obj);tw=[];twG=g}
  $('#camui').hidden=!play;
  /* カメラ */
  if(play){const H=g.hero;if(CAM.g!==g){CAM.g=g;CAM.intro=0;CAM.yaw=0;CAM.pitch=.9;CAM.tx=X3(H.x);CAM.tz=Z3(H.y);CAM.dist=cam3.aspect<.8?66:cam3.aspect<1.2?56:46}
    CAM.intro=Math.min(1,CAM.intro+dt/2.4);CAM.yaw+=(CAM.hold+(keys.q?1:0)-(keys.e?1:0))*1.6*dt;CAM.dist=Math.max(26,Math.min(105,CAM.dist*(1+CAM.zoomHold*.9*dt)));
    const fx=X3(H.x)*.62+cst.x*.38,fz=Z3(H.y)*.62+cst.z*.38,a=Math.min(1,dt*3.2);CAM.tx+=(fx-CAM.tx)*a;CAM.tz+=(fz-CAM.tz)*a}
  else{CAM.g=null;CAM.yaw+=dt*.12;CAM.tx=cst.x;CAM.tz=cst.z+2}
  {const q=play?1-Math.pow(1-CAM.intro,3):1,yaw=CAM.yaw+(1-q)*1.5,d=play?CAM.dist*(1+(1-q)*.9):44,pt=play?CAM.pitch:.62,sh=play&&g.shake>0?(Math.random()-.5)*.5:0;
    cam3.position.set(CAM.tx+Math.sin(yaw)*Math.cos(pt)*d+sh,Math.sin(pt)*d+sh,CAM.tz+Math.cos(yaw)*Math.cos(pt)*d);cam3.lookAt(CAM.tx,play?1.5:keepTop*.45,CAM.tz);cam3.updateMatrixWorld()}
  for(const m of BBS)m.count=0;for(const m of INST)m.count=0;aura.visible=false;goalM.visible=false;
  if(play&&ART.ok){const H=g.hero,col=g.st.col,t=g.t,E=ART.foe(col),Bs=ART.boss(col);
    useTex(bbFoe,E);useTex(bbMid,Bs);useTex(bbNin,ART.foe('#23202b'));useTex(bbHero,ART.hero);useTex(bbAshi,g.solLv>=6?ART.ashiG:ART.ashi);useTex(bbTep,ART.teppo);useTex(bbYumi,ART.yumi);useTex(bbMus,ART.musha);
    /* 櫓・大筒 */
    g.pads.forEach((p,i)=>{if(!p.sx)return;let o=tw[i];if(!o||o.lv!==p.lv){if(o&&o.obj)scene.remove(o.obj);o=tw[i]={lv:p.lv,obj:p.lv>0?mkTower(p):null};if(o.obj)scene.add(o.obj)}if(o.obj&&p.type==='ozutsu')o.obj.rotation.y=-p.ang});
    /* 敵 */
    for(const o of g.en){const tx=BX-o.x,ty=BY-o.y,tl=Math.hypot(tx,ty)||1,fl=scrRight(tx,ty)>0,ph=t*10*(o.cav?1.5:1)+(o.ph||0),bob=Math.abs(Math.sin(ph))*.22,pu=o.fl>0?1.12:1,yaw=-Math.atan2(ty,tx),wx=X3(o.x),wz=Z3(o.y);
      if(o.boss){put(bbMid,o.x,o.y,62*pu,fl,Math.abs(Math.sin(t*5))*.25);shadow(o.x,o.y,1.5);continue}
      shadow(o.x,o.y,o.cav?1.1:o.big||o.mid?.75:.55);
      if(o.can){const kk=Math.max(0,1-(t-(o.fire||-9))/.25);inst(iBox,wx,.45,wz,1.9,.45,1,yaw,0x5b3b26);inst(iBox,wx+tx/tl*(.5-kk*.4),1,wz+ty/tl*(.5-kk*.4),2.4,.55,.55,yaw,col,.16);put(bbFoe,o.x-tx/tl*13,o.y-ty/tl*13,25,fl,0);
        if(kk>0)inst(iFx,wx+tx/tl*1.9,1.3,wz+ty/tl*1.9,.5+kk*.7,.5+kk*.7,.5+kk*.7,0,_c.setRGB(kk,.8*kk,.4*kk).getHex());continue}
      let lift=bob;if(o.cav){inst(iBox,wx,.85,wz,2.2,.85,.7,yaw,0x7a4a26);inst(iBox,wx+tx/tl*1.2,1.45,wz+ty/tl*1.2,.8,.55,.42,yaw,0x6b3f20,.7);inst(iBox,wx-tx/tl*1.2,.95,wz-ty/tl*1.2,.5,.12,.12,yaw,0x2a1a10,-.6);
        for(const a of[-.75,.75])for(const b of[-.22,.22])inst(iBox,wx+tx/tl*a-ty/tl*b,.3+Math.abs(Math.sin(ph+a*3))*.14,wz+ty/tl*a+tx/tl*b,.16,.6,.16,yaw,0x4a2c16);lift=1.05+bob*.6}
      put(o.mid||o.big?bbMid:o.nin?bbNin:bbFoe,o.x,o.y,(o.h||27)*pu,fl,lift);
      if(o.shd)inst(iBox,wx+tx/tl*.62,1.05+bob,wz+ty/tl*.62,.16,1.9,1.05,yaw,0xcdb964)}
    /* 自軍 */
    for(const s of g.sol){shadow(s.x,s.y,.55);put(bbAshi,s.x,s.y,26+g.solLv*.6,(s.f?1:-1)*Math.cos(CAM.yaw)>0,Math.abs(Math.sin(s.ph))*.2)}
    for(const a of g.al){const L=a.lv||0,sz=30+L*.9;shadow(a.x,a.y,.65);if(a.t==='m')put(bbMus,a.x,a.y,sz+12,(a.f?1:-1)*Math.cos(CAM.yaw)>0,Math.abs(Math.sin(a.ph||0))*.22);else put(a.t==='y'?bbYumi:bbTep,a.x,a.y,a.t==='y'?sz-2:sz,scrRight(a.ax,a.ay)>0,0)}
    if(H.dead<=0){shadow(H.x,H.y,.8);if(!(H.inv>0&&((t*10)|0)%2))put(bbHero,H.x,H.y,46+H.lv*1.7,scrRight(H.ax,H.ay)<0,H.mv?Math.abs(Math.sin(H.walk))*.28:0);
      aura.visible=true;const rr=1.5+H.lv*.14+Math.sin(t*6)*(H.lv>=2?.12:0);aura.position.set(X3(H.x),.07,Z3(H.y));aura.scale.setScalar(rr);aura.material.color.set(H.lv>=4?0xff783c:H.lv>=2?0x78c8ff:0xf0c75e)}
    if(g.goal&&H.dead<=0){goalM.visible=true;goalM.position.set(X3(g.goal[0]),.08,Z3(g.goal[1]));goalM.scale.setScalar(1+.25*Math.sin(t*8))}
    /* 矢・玉・弾・小判 */
    for(const a of g.ar){const L=a.lvl||0,yw=-Math.atan2(a.vy,a.vx);if(a.gun)inst(iGlow,X3(a.x),1.5,Z3(a.y),1.1,.16,.16,yw,0xffd27a);else inst(iGlow,X3(a.x-a.vx*.02),a.big?2.2:1.5,Z3(a.y-a.vy*.02),L>=4?3.2:L>=2?2.6:2.1,L>=4?.2:.13,L>=4?.2:.13,yw,L>=4?0xff8a3c:L>=2?0x8fe0ff:0xfff7e0)}
    for(const a of g.ea)inst(iGlow,X3(a.x-a.vx*.03),1.5,Z3(a.y-a.vy*.03),2.2,.17,.17,-Math.atan2(a.vy,a.vx),0xff4a3a);
    for(const b of g.balls){if(b.t<0)continue;const p=b.t/b.T,r=.34+(b.lv||1)*.05;inst(iBall,X3(b.x),.8+Math.sin(p*Math.PI)*5,Z3(b.y),r,r,r,0,(b.lv||1)>=4?0xffb347:0x1c1a16);shadow(b.x,b.y,.4)}
    for(const b of g.eb){const p=b.t/b.T;inst(iBall,X3(b.x),.8+Math.sin(p*Math.PI)*6,Z3(b.y),.45,.45,.45,0,0xc0261a);shadow(b.x,b.y,.45)}
    g.cn.forEach((k,i)=>inst(iCoin,X3(k.x),.55+Math.sin(t*5+i)*.12,Z3(k.y),1,1,1,t*4+i));
    /* 光と けむり、たおれて とぶ 敵 */
    for(const f of g.fx){const p=f.d?1-f.t/f.d:0;
      if(f.k==='x'){const R=f.R*S3*(.5+.8*p),v=1-p;inst(iFx,X3(f.x),R*.5,Z3(f.y),R,R*.8,R,0,_c.setRGB(v,.62*v,.2*v).getHex());inst(iFx,X3(f.x),.12,Z3(f.y),R*1.15,.05,R*1.15,0,_c.setRGB(.3*v,.14*v,.04*v).getHex())}
      else if(f.k==='r'){const R=f.R*S3*(.3+.7*p),q=f.col.split(','),v=(1-p)*.55;inst(iFx,X3(f.x),.12,Z3(f.y),R,.05,R,0,_c.setRGB(q[0]/255*v,q[1]/255*v,q[2]/255*v).getHex())}
      else if(f.k==='p'){const R=.3+(.25-f.t)*2.4,v=Math.min(.7,f.t*2.4);inst(iFx,X3(f.x),.9,Z3(f.y),R,R,R,0,_c.setRGB(v,v*.95,v*.85).getHex())}
      else if(f.k==='s'){const v=f.t/.12*.5;inst(iFx,X3(f.x),.15,Z3(f.y),1.5,.05,1.5,0,_c.setRGB(v,v,v).getHex())}
      else if(f.k==='d')put(f.m?bbMid:bbFoe,f.x+f.vx*p,f.y,(f.h||27)*(1-p*p),scrRight(f.fl?1:-1,0)>0,Math.sin(p*Math.PI)*2.6)}}
  for(const m of BBS)m.instanceMatrix.needsUpdate=true;for(const m of INST){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true}
  ren.render(scene,cam3);overlay(play?g:null)}

/* ---- 上に かさねる 文字と しるし ---- */
function overlay(g){const k=c,w=cv._w,h=cv._h;k.setTransform(cv._d,0,0,cv._d,0,0);k.clearRect(0,0,w,h);if(!g){k.fillStyle='rgba(14,23,41,.28)';k.fillRect(0,0,w,h);return}
  const H=g.hero,t=g.t,BR='"Yuji Syuku","Yu Mincho",serif';k.textAlign='center';k.textBaseline='middle';
  for(const p of g.pads){const q=prj(p.x,p.y,.2);if(!q[2])continue;const mx=p.lv>=MAXLV,x=q[0],y=q[1],can=!mx&&g.coins>=p.cost-p.paid;
    if(!mx&&p.paid>0){k.fillStyle='rgba(216,165,63,.9)';rrect(k,x-20,y+9,40*Math.min(1,p.paid/p.cost),5,2);k.fill();k.strokeStyle='rgba(14,23,41,.7)';k.lineWidth=1;rrect(k,x-20,y+9,40,5,2);k.stroke()}
    k.font='bold 17px sans-serif';k.lineWidth=4;k.strokeStyle='rgba(14,23,41,.85)';const num=mx?'極':String(Math.ceil(p.cost-p.paid));k.strokeText(num,x,y);k.fillStyle=can?'#ffe9a0':'#fff7e0';k.fillText(num,x,y);
    k.font='12px '+BR;const lb=p.name+(p.lv?' '+p.lv:''),lw=k.measureText(lb).width+10;k.fillStyle=p.type==='jin'?'rgba(28,90,52,.9)':p.type==='yumi'?'rgba(28,63,120,.9)':'rgba(14,23,41,.75)';rrect(k,x-lw/2,y-27,lw,15,4);k.fill();k.fillStyle='#fff7e0';k.fillText(lb,x,y-19);
    if(can){const s=.5+.5*Math.sin(t*7);k.strokeStyle='rgba(255,236,150,'+(.4+.5*s).toFixed(2)+')';k.lineWidth=2;k.beginPath();k.ellipse(x,y+2,30+s*4,17+s*3,0,0,TAU);k.stroke()}
    if(p.type==='jin'&&!mx&&g.base.hp<g.base.max*.5){const b=Math.abs(Math.sin(t*6))*4;k.fillStyle='#e2503d';k.beginPath();k.arc(x+lw/2+10,y-20-b,8,0,TAU);k.fill();k.fillStyle='#fff';k.font='bold 13px sans-serif';k.fillText('!',x+lw/2+10,y-19.5-b)}
    if(p.dw>0&&p.dw<.45&&!mx){k.strokeStyle='#fff';k.lineWidth=3;k.lineCap='round';k.beginPath();k.arc(x,y,24,-Math.PI/2,-Math.PI/2+TAU*p.dw/.45);k.stroke()}}
  {const q=prj(BX,BY,keepTop+.6),x=Math.max(60,Math.min(w-60,q[0])),y=Math.max(14,q[1]),r=Math.max(0,g.base.hp/g.base.max);k.fillStyle=g.base.hit>0?'rgba(150,30,20,.9)':'rgba(14,23,41,.82)';rrect(k,x-56,y-9,112,18,5);k.fill();k.fillStyle='#fff7e0';k.font='11px '+BR;k.fillText('城',x-46,y);
    k.fillStyle='#4a4f5c';k.fillRect(x-36,y-5,86,10);k.fillStyle=r>.5?'#6fbf8a':r>.25?'#e0b040':'#e2503d';k.fillRect(x-36,y-5,86*r,10);k.fillStyle='#fff';k.font='bold 9px sans-serif';k.fillText(Math.max(0,Math.ceil(g.base.hp))+' / '+g.base.max,x+7,y+.5)}
  for(const e of g.en){if(!e.boss&&!e.can)continue;const q=prj(e.x,e.y,e.boss?9:3.4);if(!q[2])continue;const x=q[0],y=q[1];
    if(e.boss){const nm=plain(g.st.lord);k.font='12px '+BR;const lw=k.measureText(nm).width+12;k.fillStyle='rgba(14,23,41,.82)';rrect(k,x-lw/2,y-16,lw,16,4);k.fill();k.fillStyle='#fff7e0';k.fillText(nm,x,y-8)}
    k.fillStyle='rgba(14,23,41,.75)';k.fillRect(x-19,y+2,38,5);k.fillStyle='#e2503d';k.fillRect(x-18,y+3,36*Math.max(0,e.hp/e.max),3)}
  if(H.dead<=0){if(H.hp<H.max){const q=prj(H.x,H.y,-.6);k.fillStyle='rgba(14,23,41,.75)';k.fillRect(q[0]-14,q[1],28,5);k.fillStyle='#6fbf8a';k.fillRect(q[0]-13,q[1]+1,26*Math.max(0,H.hp/H.max),3)}}
  else{const q=prj(CUR.hero[0],CUR.hero[1],1);k.fillStyle='rgba(14,23,41,.82)';rrect(k,q[0]-56,q[1]-11,112,22,5);k.fill();k.fillStyle='#fff7e0';k.font='13px sans-serif';k.fillText('たてなおし '+Math.ceil(H.dead)+'びょう',q[0],q[1])}
  for(const f of g.fx)if(f.k==='t'){const p=1-f.t/f.d,q=prj(f.x,f.y,3.5+p*2);k.globalAlpha=Math.min(1,f.t*2.5);k.font='16px '+BR;k.lineWidth=4;k.strokeStyle='rgba(14,23,41,.85)';const x=Math.max(90,Math.min(w-90,q[0])),y=Math.max(60,Math.min(h-30,q[1]));k.strokeText(f.text,x,y);k.fillStyle=f.col;k.fillText(f.text,x,y);k.globalAlpha=1}
  /* 敵の 来る 方向（画面の 外なら ふちに 出す） */
  const mark=(lx,ly,colr,big)=>{const q=prj(lx,ly,1),s=.5+.5*Math.sin(t*(big?14:9)),r=(big?13:10)+s*4;let x=q[0],y=q[1];if(!q[2]){x=w-x;y=h+60}x=Math.max(22,Math.min(w-22,x));y=Math.max(22,Math.min(h-22,y));
    k.fillStyle=colr.replace('A',(.55+.4*s).toFixed(2));k.beginPath();k.moveTo(x,y-r);k.lineTo(x+r,y);k.lineTo(x,y+r);k.lineTo(x-r,y);k.closePath();k.fill();k.fillStyle='#fff';k.font='bold 13px sans-serif';k.fillText('!',x,y+.5)};
  if(g.toSpawn>0)for(const s of g.sides)mark(DIRS[s].x,DIRS[s].y,'rgba(226,60,45,A)',0);
  for(const v of g.ev){if(!v.w)continue;if(v.pts)for(const p of v.pts)mark(Math.max(0,Math.min(W,p[0])),Math.max(0,Math.min(HT,p[1])),'rgba(120,70,200,A)',1);else mark(DIRS[v.side].x,DIRS[v.side].y,'rgba(255,150,30,A)',1)}
  for(const f of g.fx)if(f.k==='w'){const by=Math.round(h*.16);k.globalAlpha=Math.min(1,f.t*2);k.fillStyle='rgba(14,23,41,.8)';k.fillRect(0,by,w,50);k.fillStyle='#bf3b2b';k.fillRect(0,by,w,2);k.fillRect(0,by+48,w,2);k.fillStyle='#f0c75e';k.font='27px '+BR;k.fillText(f.text,w/2,by+26);k.globalAlpha=1}
  if(joy){const r=cv.getBoundingClientRect(),x=joy.x0-r.left,y=joy.y0-r.top;k.strokeStyle='rgba(255,255,255,.55)';k.lineWidth=2;k.beginPath();k.arc(x,y,45,0,TAU);k.stroke();k.fillStyle='rgba(255,255,255,.45)';k.beginPath();k.arc(x+inp.x*45,y+inp.y*45,17,0,TAU);k.fill()}}

/* 試すための 取っ手 */
window.__t3={g:()=>G,cur:()=>CUR,ren,CAM,M:()=>M,start(s){newGame(s);state='play';showCard()},step(n){for(let i=0;i<n&&!G.over;i++)update(1/30)},err:null};addEventListener('error',e=>{window.__t3.err=String(e.message)});
fit();showCard();loadArt();requestAnimationFrame(loop);
