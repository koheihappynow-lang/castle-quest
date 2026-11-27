
/* ================= 3Dで見せる層（戦いの計算は そのまま。見せ方だけを 立体にする） ================= */
const S3=.16,X3=x=>(x-180)*S3,Z3=y=>(y-320)*S3,EM=E3.M;
E3.initAssets();
const glc=document.getElementById('gl');
const ren=new THREE.WebGLRenderer({canvas:glc,antialias:true,powerPreference:'high-performance'});
ren.setPixelRatio(Math.min(2,window.devicePixelRatio||1));ren.shadowMap.enabled=true;ren.shadowMap.type=THREE.PCFSoftShadowMap;ren.toneMapping=THREE.ACESFilmicToneMapping;
const scene=new THREE.Scene();scene.background=new THREE.Color(0xa9d3f0);scene.fog=new THREE.Fog(0xa9d3f0,210,560);
scene.environment=new THREE.PMREMGenerator(ren).fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.55;
const cam3=new THREE.PerspectiveCamera(42,1,.5,900);
const hemiL=new THREE.HemisphereLight(0xdcefff,0x5d7a3d,1.1),sunL=new THREE.DirectionalLight(0xfff4e0,2.5);
{sunL.position.set(54,104,44);sunL.castShadow=true;sunL.shadow.mapSize.set(2048,2048);Object.assign(sunL.shadow.camera,{left:-90,right:90,top:90,bottom:-90,near:1,far:330});sunL.shadow.bias=-.0006;sunL.shadow.normalBias=.1;scene.add(hemiL,sunL)}

/* ---- 地図ごとの 景色（季節・時間・木・水） ---- */
const THEMES={
  'map2.jpg':{name:'さくらの 鶴ヶ城',grass:'#5b9138',tint:['70,120,44','110,160,66','84,138,52','150,180,90'],road:'#c2ae82',edge:'#7d7052',sky:0xa9d3f0,sun:0xfff4e0,sunI:2.5,hemi:1.1,exp:.98,trees:{sakura:.6,pine:.3,round:.1},roll:.9},
  'map3.jpg':{name:'みどりの 山道',grass:'#3f7a30',tint:['40,96,36','70,130,52','52,110,40','96,150,70'],road:'#b8a47c',edge:'#6c6048',sky:0x9cc9ea,sun:0xffffff,sunI:2.7,hemi:1,exp:.95,trees:{pine:.55,round:.4,sakura:.05},roll:1.5,rocks:26},
  'map4.jpg':{name:'ゆうぐれの 城下町',grass:'#6a8a3c',tint:['90,120,50','120,150,66','100,130,56','160,170,90'],road:'#c9b08a',edge:'#806a4c',sky:0xf2c89c,sun:0xffc890,sunI:2.9,hemi:.85,exp:1,trees:{sakura:.45,pine:.35,round:.2},roll:.6,houses:54},
  'map5.jpg':{name:'あさもやの 川中島',grass:'#4f8250',tint:['60,110,70','90,140,90','70,122,78','120,160,110'],road:'#b9b094',edge:'#6f6a58',sky:0xc8dce6,sun:0xf0f4ff,sunI:2.1,hemi:1.25,exp:.98,fog:[120,400],trees:{pine:.6,round:.3,sakura:.1},roll:2.1,water:.05,rocks:30},
  'map6.jpg':{name:'もみじの 関ヶ原',grass:'#8a8a3a',tint:['120,116,50','150,140,62','132,124,54','176,160,80'],road:'#c4ac80',edge:'#7a6646',sky:0xe6d2a8,sun:0xffe2b0,sunI:2.6,hemi:.95,exp:1,trees:{momiji:.55,pine:.3,round:.15},roll:1.2,rocks:14}};
let THM=THEMES['map2.jpg'];
/* ---- 3D だけの 地図：本物の 城のように、まっすぐには 攻めこめない 道 ---- */
THEMES.masu=Object.assign({},THEMES['map3.jpg'],{name:'ますがたの 城'});THEMES.uzu=Object.assign({},THEMES['map6.jpg'],{name:'うずまきの 城'});THEMES.tsuzura=Object.assign({},THEMES['map2.jpg'],{name:'つづらおりの 山城'});
{const Y='yagura',O='ozutsu',pad=(x,y,sx,sy,type,cost)=>({x,y,sx,sy,type,cost,name:type===Y?'櫓':type===O?'大筒':type==='yumi'?'ゆみを つよく':'しろを なおす'}),base={img:'map2.jpg',baseHp:750,spd:1.3,cnt:1.2,ban:100,occ:null};
  /* 枡形：門の 前で 一度 横に 曲がる（lv1） */
  MAPS.push(Object.assign({},base,{id:20,thm:'masu',lv:1,rect:[130,230,150,250],c:[180,200],hero:[180,300],bar:[180,236],fl:[180,200,60,60],
    dirs:[{x:180,y:632,ox:0,oy:1},{x:352,y:470,ox:1,oy:0},{x:8,y:340,ox:-1,oy:0},{x:80,y:8,ox:0,oy:-1},{x:352,y:200,ox:1,oy:0}],
    walk:mkWalk([130,230,150,250],[106,254,126,274],[
      [[180,270],[180,340],[290,340],[290,470],[180,470],[180,654]],[[374,470],[290,470]],[[-14,340],[180,340]],
      [[180,130],[180,60],[80,60],[80,-14]],[[374,200],[250,200]]],21,null),
    pads:[pad(235,340,235,405,Y,15),pad(290,400,340,400,O,30),pad(110,340,110,398,Y,20),pad(180,530,126,532,O,40),pad(235,470,242,528,Y,25),pad(130,60,132,16,O,45),pad(300,200,312,148,Y,30),pad(150,262,0,0,'yumi',25),pad(210,262,0,0,'jin',30)],
    apost:[[180,310],[240,340],[290,400],[240,470],[180,520],[120,340],[180,90],[300,200]],gpost:[[150,268],[210,268],[112,200],[248,200],[180,132],[180,322]]}));
  /* 渦：城の まわりを 大きく 回りこむ（lv2） */
  MAPS.push(Object.assign({},base,{id:21,thm:'uzu',lv:2,spd:1.4,rect:[140,220,270,370],c:[180,320],hero:[180,382],bar:[180,356],fl:[180,320,56,60],
    dirs:[{x:180,y:632,ox:0,oy:1},{x:8,y:350,ox:-1,oy:0},{x:352,y:170,ox:1,oy:0},{x:45,y:8,ox:0,oy:-1},{x:352,y:520,ox:1,oy:0}],
    walk:mkWalk([140,220,270,370],[118,242,248,392],[
      [[180,654],[180,520],[45,520],[45,170],[315,170],[315,320],[238,320]],[[-14,350],[45,350]],[[374,170],[315,170]],[[45,-14],[45,170]],[[374,520],[180,520]]],21,null),
    pads:[pad(110,520,110,464,Y,15),pad(45,480,62,582,O,30),pad(180,170,180,114,Y,20),pad(250,170,252,114,O,40),pad(280,320,286,396,Y,25),pad(240,520,240,464,O,45),pad(180,580,124,592,Y,30),pad(150,380,0,0,'yumi',25),pad(210,380,0,0,'jin',30)],
    apost:[[180,386],[270,320],[315,250],[250,170],[120,170],[45,260],[45,440],[120,520]],gpost:[[150,386],[210,386],[124,320],[236,320],[180,254],[230,330]]}));
  /* つづら折り：山道を 右へ 左へ 2回。北からは 近道が 一本（lv1） */
  MAPS.push(Object.assign({},base,{id:22,thm:'tsuzura',lv:1,rect:[130,230,90,190],c:[180,140],hero:[180,238],bar:[180,176],fl:[180,140,60,60],ban:300,
    dirs:[{x:180,y:632,ox:0,oy:1},{x:352,y:300,ox:1,oy:0},{x:8,y:440,ox:-1,oy:0},{x:352,y:580,ox:1,oy:0},{x:180,y:8,ox:0,oy:-1}],
    walk:mkWalk([130,230,90,190],[106,254,66,214],[
      [[180,210],[180,300],[300,300],[300,440],[70,440],[70,580],[180,580],[180,654]],[[374,300],[300,300]],[[-14,440],[70,440]],[[374,580],[180,580]],[[180,-14],[180,70]]],21,null),
    pads:[pad(240,300,240,366,Y,15),pad(180,440,178,384,O,30),pad(120,440,122,502,Y,20),pad(70,510,20,510,O,40),pad(240,580,240,524,Y,25),pad(180,256,120,262,O,45),pad(180,40,236,30,Y,30),pad(150,202,0,0,'yumi',25),pad(210,202,0,0,'jin',30)],
    apost:[[180,244],[240,300],[300,370],[180,440],[70,510],[120,580],[180,60],[250,440]],gpost:[[150,208],[210,208],[112,140],[248,140],[180,72],[180,270]]}));
  for(const a of[[20,23],[21,24],[22,25]])MAPS.push(mirrorMap(MAPS.find(m=>m.id===a[0]),a[1]))}
/* 国が 進むほど、むずかしい 道の 地図が 出る */
function mapOK(m,s){const l=m.lv||0;if(s<=3)return l===0;if(l===2&&s<6)return false;if(s>=8&&l===0)return Math.random()<.25;return true}
/* 土地の 高さ：城が いちばん 高い 丘の 上。道は 城へ のぼっていく */
const HC3=11.5,RD3=205,LV=[[36,1],[82,.68],[128,.38]];
const rdist=new Int16Array(GW*GH);
function mkRd(){rdist.fill(-1);const q=[];for(let i=0;i<blocked.length;i++)if(!blocked[i]){rdist[i]=0;q.push(i)}
  for(let h=0;h<q.length;h++){const c=q[h],cx=c%GW,cy=(c-cx)/GW;for(const d of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+d[0],ny=cy+d[1];if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const n=ny*GW+nx;if(rdist[n]>=0)continue;rdist[n]=rdist[c]+1;q.push(n)}}}
function rdAt(x,y){const fx=x/CS-.5,fy=y/CS-.5;if(fx<0||fy<0||fx>GW-1||fy>GH-1)return 0;const x0=fx|0,y0=fy|0,x1=Math.min(GW-1,x0+1),y1=Math.min(GH-1,y0+1),ax=fx-x0,ay=fy-y0;
  return(rdist[y0*GW+x0]*(1-ax)+rdist[y0*GW+x1]*ax)*(1-ay)+(rdist[y1*GW+x0]*(1-ax)+rdist[y1*GW+x1]*ax)*ay}
function cdist(x,y){const qx=x<CX0?CX0:x>CX1?CX1:x,qy=y<CY0?CY0:y>CY1?CY1:y;return Math.hypot(x-qx,y-qy)}
function Y3(x,y){const d=cdist(x,y),t=d>RD3?0:1-d/RD3,s=t*t*(3-2*t);
  const ex=Math.max(Math.abs(x-180)-200,Math.abs(y-320)-340),o=ex<=0?0:ex>220?1:ex/220;
  let h=HC3*s;const r=rdAt(x,y);
  if(r>0){const ht=HC3*(d<LV[0][0]?LV[0][1]:d<LV[1][0]?LV[1][1]:d<LV[2][0]?LV[2][1]:s*.55),u=r>=3.2?1:r/3.2;h+=(ht-h)*u*u*(3-2*u)}
  h+=(1-s)*THM.roll*(.62*Math.sin(x*.021+1.3)*Math.cos(y*.017+.4)+.38*Math.sin(x*.047+y*.039))+o*o*9*(1+Math.sin(x*.012+2)*Math.cos(y*.01));
  if(THM.water!=null&&h<THM.water+.4&&r<=0)h=THM.water+.4;return h}

const keyOf3=new Map(Object.entries(EM).map(e=>[e[1],e[0]]));
/* ---- 地図ごとに 作りなおす もの：地面・道・城・木・マス ---- */
let world=null,built=null,keepTop=12,introName=0;const cst={x:0,z:0,y:0};
function groundTex(){const Q=2.5,k=document.createElement('canvas');k.width=760*Q;k.height=1040*Q;const x=k.getContext('2d'),P=v=>(v+200)*Q,T=THM;
  x.fillStyle=T.grass;x.fillRect(0,0,k.width,k.height);
  for(let i=0;i<9800;i++){x.fillStyle='rgba('+T.tint[i&3]+','+((i&3)===3?.16:.28)+')';x.beginPath();x.arc(Math.random()*k.width,Math.random()*k.height,(4+Math.random()*18)*Q*.5,0,TAU);x.fill()}
  for(const pass of[[T.edge,1.55,31],[T.road,1.1,26]]){x.strokeStyle=x.fillStyle=pass[0];x.lineCap='round';x.lineWidth=pass[2]*2*Q;
    x.beginPath();for(const d of DIRS){x.moveTo(P(d.x-d.ox*8),P(d.y-d.oy*8));x.lineTo(P(d.x+d.ox*300),P(d.y+d.oy*300))}x.stroke();
    x.beginPath();for(let i=0;i<blocked.length;i++)if(!blocked[i]){const px=P((i%GW)*CS+CS/2),py=P(((i/GW)|0)*CS+CS/2),r=CS*Q*pass[1];x.moveTo(px+r,py);x.arc(px,py,r,0,TAU)}x.fill()}
  /* 石だたみ：道の 上に 小さな 石を しきつめる */
  for(let i=0;i<blocked.length;i++)if(!blocked[i])for(let j=0;j<3;j++){const px=P((i%GW)*CS+Math.random()*CS),py=P(((i/GW)|0)*CS+Math.random()*CS);x.fillStyle=j===0?'rgba(255,248,225,.2)':j===1?'rgba(70,56,34,.16)':'rgba(120,104,76,.2)';x.beginPath();x.ellipse(px,py,(1.1+Math.random()*1.5)*Q,(.8+Math.random())*Q,Math.random()*3,0,TAU);x.fill()}
  for(let i=0;i<48000;i++){x.fillStyle=i&1?'rgba(255,250,225,.08)':'rgba(30,40,10,.09)';x.fillRect(Math.random()*k.width,Math.random()*k.height,Q,Q*1.6)}
  const t=new THREE.CanvasTexture(k);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t}
function grassTex(){const k=document.createElement('canvas');k.width=k.height=512;const x=k.getContext('2d'),T=THM;x.fillStyle=T.grass;x.fillRect(0,0,512,512);for(let i=0;i<230;i++){x.fillStyle='rgba('+T.tint[i&3]+','+((i&3)===3?.16:.28)+')';const px=Math.random()*512,py=Math.random()*512,r=6+Math.random()*27;for(const ox of[-512,0,512])for(const oy of[-512,0,512]){x.beginPath();x.arc(px+ox,py+oy,r,0,TAU);x.fill()}}for(let i=0;i<1150;i++){x.fillStyle=i&1?'rgba(255,250,225,.08)':'rgba(30,40,10,.09)';x.fillRect(Math.random()*512,Math.random()*512,3,4.8)}const t=new THREE.CanvasTexture(k);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3600/170.7,3800/170.7);t.anisotropy=4;return t}
function landGeo(w,d,sw,sd,drop,hole){const g=new THREE.PlaneGeometry(w,d,sw,sd);g.rotateX(-Math.PI/2);const p=g.attributes.position;for(let i=0;i<p.count;i++){const lx=p.getX(i)/S3+180,ly=p.getZ(i)/S3+320;p.setY(i,Y3(lx,ly)-drop-(hole&&lx>-160&&lx<W+160&&ly>-160&&ly<HT+160?40:0))};g.computeVertexNormals();return g}
function farFromRoad(x,y,r){for(let a=0;a<8;a++){const px=x+Math.cos(a*.785)*r,py=y+Math.sin(a*.785)*r;if(px<0||py<0||px>=W||py>=HT||!blk(px,py))return false}return blk(x,y)}
function tree(b,x,y,s){const T=THM.trees,gy=Y3(x,y);if(THM.water!=null&&gy<THM.water+.15)return;let r=E3.rnd();
  for(const k in T){if((r-=T[k])<0){if(k==='sakura')E3.sakuraTree(b,X3(x),gy,Z3(y),s);else if(k==='pine')E3.pineTree(b,X3(x),gy,Z3(y),s);else if(k==='momiji')E3.roundTree(b,X3(x),gy,Z3(y),s,E3.rnd()<.5?'orange':E3.rnd()<.5?'redOchre':'ochre');else E3.roundTree(b,X3(x),gy,Z3(y),s*1.1);return}}E3.pineTree(b,X3(x),gy,Z3(y),s)}
function nobori(g,x,y,z,ry){g.add(E3.mesh(new THREE.CylinderGeometry(.04,.04,3,6),EM.iron,x,y+1.5,z));const q=new THREE.Group();q.position.set(x,0,z);q.rotation.y=ry;const f=E3.mesh(E3.boxGeo(.03,2.1,.62),EM.nobori,0,y+1.85,.34);f.castShadow=false;q.add(f);g.add(q)}
function build3d(m){if(world){scene.remove(world);world.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material&&o.material.userData&&o.material.userData.own){if(o.material.map)o.material.map.dispose();o.material.dispose()}})}
  world=new THREE.Group();scene.add(world);built=m;E3.setSeed(m.id*13+7);THM=THEMES[m.thm||m.img]||THEMES['map2.jpg'];const T=THM;introName=3.2;mkRd();
  scene.background.set(T.sky);scene.fog.color.set(T.sky);scene.fog.near=T.fog?T.fog[0]:210;scene.fog.far=T.fog?T.fog[1]:560;sunL.color.set(T.sun);sunL.intensity=T.sunI;hemiL.intensity=T.hemi;ren.toneMappingExposure=T.exp;
  {const gm=new THREE.MeshStandardMaterial({map:groundTex(),roughness:.96});gm.userData.own=1;const g=new THREE.Mesh(landGeo(760*S3,1040*S3,200,274,0),gm);g.receiveShadow=true;world.add(g);
    const om=new THREE.MeshStandardMaterial({map:grassTex(),roughness:.96});om.userData.own=1;const o=new THREE.Mesh(landGeo(3600*S3,3800*S3,120,126,.3,1),om);o.receiveShadow=true;world.add(o);
    if(T.water!=null){const wt=E3.waterPlane(world,600,620,0,0,T.water);wt.receiveShadow=true}}
  /* 城：丘の 上の 高い 石垣、白い へいと 四すみの 櫓、まん中に 五層の 天守 */
  {const w=(CX1-CX0)*S3,d=(CY1-CY0)*S3,cx=X3((CX0+CX1)/2),cz=Z3((CY0+CY1)/2),y0=HC3-.4,TH=3.4,ty=y0+TH,hw=w*.47,hd=d*.47;cst.x=cx;cst.z=cz;cst.y=HC3;
    world.add(E3.mesh(E3.stoneBaseGeo(w*1.02,d*1.02,w*.96,d*.96,TH),EM.stoneWarm,cx,y0,cz));world.add(E3.mesh(E3.boxGeo(w*.96,.08,d*.96),EM.gravel,cx,ty,cz));
    const b=new E3.Batch(),gate=1.3;
    for(const s of[[-hw,-hd,hw,-hd],[hw,-hd,hw,hd],[-hw,-hd,-hw,hd],[-hw,hd,-gate,hd],[gate,hd,hw,hd]]){const L=Math.hypot(s[2]-s[0],s[3]-s[1]),ry=Math.atan2(-(s[3]-s[1]),s[2]-s[0]),mx=cx+(s[0]+s[2])/2,mz=cz+(s[1]+s[3])/2;
      b.box('plaster',L,.85,.26,mx,ty+.42,mz,ry);b.box('roofRed',L+.1,.14,.5,mx,ty+.92,mz,ry);b.box('darkWood',L,.12,.3,mx,ty+.06,mz,ry)}
    for(const sx of[-1,1])b.box('darkWood',.3,2,.3,cx+sx*gate,ty+1,cz+hd);b.box('darkWood',gate*2+.9,.26,.5,cx,ty+2,cz+hd);b.box('roofRed',gate*2+1.5,.16,1.1,cx,ty+2.25,cz+hd);
    
    for(const s of[[-1,1],[1,1]])E3.pineTree(b,cx+s[0]*hw*.55,ty,cz+s[1]*hd*.62,.6);b.build(world);
    for(const s of[[-1,-1],[1,-1],[-1,1],[1,1]]){const tx=cx+s[0]*(hw-.7),tz=cz+s[1]*(hd-.7);world.add(E3.mesh(E3.stoneBaseGeo(2,2,1.7,1.7,.6),EM.stoneWarm,tx,ty,tz));
      const t=E3.buildKeep({x:tx,z:tz,y:ty+.6,tiers:[{w:1.6,d:1.6,h:.95},{w:1.15,d:1.15,h:.75}],ov:.36,rise:.36,up:.2,winScale:.6,topRise:.62,roofMat:EM.roofRed});world.add(t.walls,t.roofs)}
    for(const sx of[-1,1])for(const q of[.38,.74])nobori(world,cx+sx*hw*q,ty,cz+hd-.5,sx>0?.4:-.4);
    const k=new THREE.Group(),f=Math.min(w*.8/12,d*.8/11);k.position.set(cx-w*.04,ty,cz-d*.05);k.scale.setScalar(f);world.add(k);
    k.add(E3.mesh(E3.stoneBaseGeo(12,11,9.6,8.8,4.2),EM.stoneWarm,0,0,0));
    const tiers=[{w:8.4,d:7.6,h:2.2},{w:7.4,d:6.6,h:1.8},{w:6.4,d:5.6,h:1.7},{w:5.3,d:4.6,h:1.6},{w:4.1,d:3.6,h:1.6}];
    const main=E3.buildKeep({x:0,z:0,y:4.2,tiers,ov:.85,rise:.75,up:.4,topRise:1.6,roofMat:EM.roofRed});k.add(main.walls,main.roofs);k.add(E3.mesh(E3.boxGeo(8.45,.6,7.65),EM.darkWood,0,4.5,0));
    const TI=main.info;for(const a of[[2.6,1.05,0,'pz'],[2.6,1.05,0,'nz'],[2.4,1,1,'px'],[2.4,1,1,'nx'],[2.2,.9,2,'pz'],[2.2,.9,2,'nz']])E3.placeGable(k,{w:a[0],h:a[1],roofMat:EM.roofRed},0,0,TI[a[2]],TI[a[2]+1],.85,a[3]);
    E3.placeGable(k,{w:2,h:.75,curved:true,roofMat:EM.roofRed},0,0,TI[3],TI[4],.85,'pz');
    k.add(E3.shachihoko(-TI.ridge.half,TI.ridge.y,0,-1,1.15),E3.shachihoko(TI.ridge.half,TI.ridge.y,0,1,1.15));keepTop=ty+(TI.ridge.y+1)*f;
    {const sx=cx+hw*.6,sz=cz+hd*.42;world.add(E3.mesh(E3.stoneBaseGeo(3.6,3.6,3,3,1.4),EM.stoneWarm,sx,ty,sz));
      const sk=E3.buildKeep({x:sx,z:sz,y:ty+1.4,tiers:[{w:2.8,d:2.8,h:1.3},{w:2.2,d:2.2,h:1.05},{w:1.6,d:1.6,h:.95}],ov:.42,rise:.42,up:.22,winScale:.65,topRise:.8,roofMat:EM.roofRed});world.add(sk.walls,sk.roofs);
      E3.hipHall(world,{x:sx,z:(sz+cz-d*.05)/2+1.2,y:ty,w:1.7,d:Math.abs(sz-cz)*.7,h:1.5,wall:EM.plaster,roofMat:EM.roofRed,ov:.3,up:.12})}}
  {const b=new E3.Batch(),cxl=(CX0+CX1)/2,cyl=(CY0+CY1)/2,hw=(CX1-CX0)/2,hh=(CY1-CY0)/2;
    LV.forEach((L,li)=>{const D=L[0],pts=[],N=Math.max(8,Math.round(D*1.5708/7));
      const corner=(sx,sy,a0)=>{for(let i=0;i<=N;i++){const a=a0+i/N*Math.PI/2;pts.push([cxl+sx*hw+Math.cos(a)*D,cyl+sy*hh+Math.sin(a)*D])}};
      const edge=(x0,y0,x1,y1)=>{const n=Math.max(1,Math.round(Math.hypot(x1-x0,y1-y0)/7));for(let i=1;i<n;i++)pts.push([x0+(x1-x0)*i/n,y0+(y1-y0)*i/n])};
      corner(1,1,0);edge(CX1,CY1+D,CX0,CY1+D);corner(-1,1,Math.PI/2);edge(CX0-D,CY1,CX0-D,CY0);corner(-1,-1,Math.PI);edge(CX0,CY0-D,CX1,CY0-D);corner(1,-1,Math.PI*1.5);edge(CX1+D,CY0,CX1+D,CY1);
      for(let i=0;i<pts.length;i++){const p=pts[i],q=pts[(i+1)%pts.length],mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2;if(mx<6||my<6||mx>W-6||my>HT-6||rdAt(mx,my)<3.6)continue;
        const qx=mx<CX0?CX0:mx>CX1?CX1:mx,qy=my<CY0?CY0:my>CY1?CY1:my,nl=Math.hypot(mx-qx,my-qy)||1,nx=(mx-qx)/nl,ny=(my-qy)/nl,yLo=Y3(mx+nx*5,my+ny*5),yHi=Y3(mx-nx*5,my-ny*5);if(yHi-yLo<.6)continue;
        const Ln=Math.hypot(q[0]-p[0],q[1]-p[1])*S3+.3,ry=Math.atan2(-(q[1]-p[1]),q[0]-p[0]),wx=X3(mx),wz=Z3(my);
        b.box('stoneWarm',Ln,yHi-yLo+1,1,wx,(yLo-.6+yHi+.4)/2,wz,ry);
        b.box('plaster',Ln,li<2?.8:.6,.32,wx,yHi+(li<2?.8:.7),wz,ry);b.box('roof',Ln+.06,.16,.62,wx,yHi+(li<2?1.26:1.06),wz,ry)}
      /* 門 */
      const n=pts.length,mid=i=>{const p=pts[i],q=pts[(i+1)%n];return[(p[0]+q[0])/2,(p[1]+q[1])/2]},inb=m=>m[0]>10&&m[1]>10&&m[0]<W-10&&m[1]<HT-10,isRoad=i=>{const m=mid(i);return inb(m)&&rdAt(m[0],m[1])<.5};
      let st=0;while(st<n&&isRoad(st))st++;let rc=0;for(let k=0;k<n;k++){const i=(st+k)%n;if(isRoad(i)&&!isRoad((i+n-1)%n))rc++}if(li===0&&rc>4)return;
      for(let k=0;k<n;k++){const i=(st+k)%n;if(!isRoad(i)||isRoad((i+n-1)%n))continue;let len=1;while(len<n&&isRoad((i+len)%n))len++;
        const gi=(i+(len>>1))%n,p=pts[gi],q=pts[(gi+1)%n],m=mid(gi),tl=Math.hypot(q[0]-p[0],q[1]-p[1])||1,tx=(q[0]-p[0])/tl,ty2=(q[1]-p[1])/tl;
        if(PADS.some(pd=>Math.hypot(pd.x-m[0],pd.y-m[1])<19)||Math.hypot(CUR.hero[0]-m[0],CUR.hero[1]-m[1])<26)continue;
        const yr=Y3(m[0],m[1]),hs=Math.min(7.5,len*7*S3/2+1.2),P=E3.matrixAt(X3(m[0]),yr,Z3(m[1]),Math.atan2(-ty2,tx));
        if(li<2){for(const sx of[-1,1]){b.box('stoneWarm',2.6,7.4,3.4,sx*(hs+1.3),2.9,0,0,P);b.box('darkWood',.5,6.2,.5,sx*(hs-.25),3.1,1.2,0,P);b.box('darkWood',.5,6.2,.5,sx*(hs-.25),3.1,-1.2,0,P)}
          b.box('darkWood',2*hs+5.4,.6,3,0,6.45,0,0,P);b.box('plaster',2*hs+5,1.9,2.9,0,7.7,0,0,P);b.box('darkWood',2*hs+5.1,.22,3,0,8.7,0,0,P);
          for(const sz of[-1,1])b.box('roof',2*hs+6.4,.24,2.5,0,9.25,sz*1.05,0,P,sz*.5);b.box('roof',2*hs+6.6,.3,.5,0,9.85,0,0,P);
          for(let wv=-1;wv<=1;wv++)for(const sz of[-1,1])b.box('darkWood',1.1,.7,.08,wv*hs*.55,7.75,sz*1.47,0,P);
          /* 隅櫓 */
          for(const sx of li===0?[-1,1]:[1]){const ox=sx*(hs+4.6)/S3,qx=m[0]<CX0?CX0:m[0]>CX1?CX1:m[0],qy=m[1]<CY0?CY0:m[1]>CY1?CY1:m[1],nl=Math.hypot(m[0]-qx,m[1]-qy)||1,lx=m[0]+tx*ox-(m[0]-qx)/nl*16,ly=m[1]+ty2*ox-(m[1]-qy)/nl*16;
            if(lx<10||ly<10||lx>W-10||ly>HT-10||rdAt(lx,ly)<3.4||PADS.some(pd=>pd.sx&&Math.hypot(pd.sx-lx,pd.sy-ly)<30))continue;const gy=Y3(lx,ly);b.geo('stoneWarm',E3.stoneBaseGeo(3.6,3.6,3,3,1.1),X3(lx),gy,Z3(ly));
            const t=E3.buildKeep({x:0,z:0,y:0,tiers:[{w:2.7,d:2.7,h:1.25},{w:2,d:2,h:1}],ov:.42,rise:.42,up:.22,winScale:.65,topRise:.8,roofMat:EM.roof}),tg=new THREE.Group();tg.add(t.walls,t.roofs);tg.position.set(X3(lx),gy+1.1,Z3(ly));tg.updateMatrixWorld(true);
            tg.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&keyOf3.has(o.material))b.add(o.geometry.clone(),keyOf3.get(o.material),o.matrixWorld)})}}
        else{for(const sx of[-1,1])b.box('darkWood',.6,6.4,.6,sx*hs,3.2,0,0,P);b.box('darkWood',2*hs+2.4,.6,.7,0,6.1,0,0,P);for(const sz of[-1,1])b.box('roof',2*hs+2.8,.18,.95,0,6.62,sz*.4,0,P,sz*.5)}}});
    b.build(world)}
  /* 木・岩・町の 家：道から はなれた 所に。外がわには 多めに */
  {const b=new E3.Batch(),spots=[];let n=0;const free=(x,y)=>!PADS.some(p=>(p.sx&&Math.hypot(p.sx-x,p.sy-y)<34)||Math.hypot(p.x-x,p.y-y)<26);
    {const keyOf=new Map(Object.entries(EM).map(e=>[e[1],e[0]])),M4=new THREE.Matrix4(),E4=new THREE.Euler(),Q4=new THREE.Quaternion();
      const ok=(x,y,r)=>farFromRoad(x,y,r)&&!inCastle(x,y)&&free(x,y)&&LV.every(L=>Math.abs(cdist(x,y)-L[0])>r*.62)&&spots.every(q=>Math.hypot(q[0]-x,q[1]-y)>q[2]+r*.55);
      let hl=0;for(let i=0;i<1500&&hl<10;i++){const x=20+E3.rnd()*320,y=20+E3.rnd()*600,d=cdist(x,y);if(d>LV[1][0]||!ok(x,y,19))continue;hl++;spots.push([x,y,19]);const big=d<LV[0][0];
        E3.hipHall(world,{x:X3(x),z:Z3(y),y:Y3(x,y)-.05,w:big?4.4:3.6,d:big?2.8:2.3,h:1.5,ry:Math.atan2(BX-x,BY-y),wall:EM.plaster,roofMat:big?EM.roof:EM.terracotta,ov:.5,up:.2,eave:true})}
      let hn=0;const want=T.houses||30;for(let i=0;i<3000&&hn<want;i++){const x=12+E3.rnd()*336,y=12+E3.rnd()*616;if(cdist(x,y)<LV[1][0]||!ok(x,y,13))continue;hn++;spots.push([x,y,13]);
        const hb=new E3.Batch();E3.machiya(hb,0,0,0,hn);const hg=new THREE.Group();hb.build(hg);E4.set(0,Math.atan2(BX-x,BY-y)+(E3.rnd()-.5)*.5,0);M4.compose(new THREE.Vector3(X3(x),Y3(x,y)-.1,Z3(y)),Q4.setFromEuler(E4),new THREE.Vector3(1.2,1.2,1.2));
        for(const ch of hg.children){const kk=keyOf.get(ch.material);if(kk)b.add(ch.geometry,kk,M4)}}}
    for(let i=0;i<3200&&n<150;i++){const x=8+E3.rnd()*344,y=8+E3.rnd()*624;if(!farFromRoad(x,y,13)||inCastle(x,y)||!free(x,y)||spots.some(q=>Math.hypot(q[0]-x,q[1]-y)<q[2])||LV.some(L=>Math.abs(cdist(x,y)-L[0])<7))continue;n++;tree(b,x,y,.9+E3.rnd()*.7)}
    for(let i=0;i<300;i++){const x=-320+E3.rnd()*1000,y=-300+E3.rnd()*1240;if(x>-6&&x<W+6&&y>-6&&y<HT+6)continue;if(DIRS.some(d=>segD(x,y,d.x,d.y,d.x+d.ox*150,d.y+d.oy*150)<42))continue;tree(b,x,y,1.2+E3.rnd()*1.1)}
    for(let i=0,rn=0;i<600&&rn<(T.rocks||8);i++){const x=6+E3.rnd()*348,y=6+E3.rnd()*628;if(!farFromRoad(x,y,11)||inCastle(x,y)||!free(x,y))continue;rn++;const r=.5+E3.rnd()*.9,g=new THREE.IcosahedronGeometry(r,0);g.scale(1.3,.75+E3.rnd()*.4,1);b.geo(E3.rnd()<.5?'rock':'rockDark',g,X3(x),Y3(x,y)+r*.2,Z3(y),E3.rnd()*6)}
    const lan=[];for(const sx of[-1,1])E3.stoneLantern(b,lan,cst.x+sx*2.4,Y3(BX+sx*24,CY1+34),Z3(CY1+34));for(const p of PADS)if(p.sx)E3.stoneLantern(b,lan,X3(p.sx)+4.6,Y3(p.sx+29,p.sy+29),Z3(p.sy)+4.6);
    b.build(world);world.add(E3.lanternsMesh(lan))}
  /* 数字のマス（石の台）と、櫓・大筒の 立つ 石づみの 台 */
  for(const p of PADS){const col=p.type==='jin'?0x3a9c5c:p.type==='yumi'?0x3c76c8:0x8a6238,ed=p.type==='jin'?0x1c5a34:p.type==='yumi'?0x1c3f78:0x4a2f18,py=Y3(p.x,p.y);
    const a=new THREE.Mesh(new THREE.BoxGeometry(5.7,.7,4.3),new THREE.MeshStandardMaterial({color:ed,roughness:.8}));a.material.userData.own=1;a.position.set(X3(p.x),py-.22,Z3(p.y));a.receiveShadow=true;world.add(a);
    const t=new THREE.Mesh(new THREE.BoxGeometry(5.1,.7,3.7),new THREE.MeshStandardMaterial({color:col,roughness:.6}));t.material.userData.own=1;t.position.set(X3(p.x),py-.16,Z3(p.y));t.receiveShadow=true;world.add(t);
    if(p.sx){const sy=Y3(p.sx,p.sy);world.add(E3.mesh(E3.stoneBaseGeo(7.8,7.8,6.4,6.4,TWH+.9),EM.stoneWarm,X3(p.sx),sy-.9,Z3(p.sy)));world.add(E3.mesh(E3.boxGeo(6.4,.08,6.4),EM.gravel,X3(p.sx),sy+TWH,Z3(p.sy)))}}}

/* ---- 櫓と大筒（レベルで 姿が かわる） ---- */
const mIron=new THREE.MeshStandardMaterial({color:0x23262e,metalness:.7,roughness:.38}),mGoldI=new THREE.MeshStandardMaterial({color:0xe2b23c,metalness:.85,roughness:.3});
let tw=[],twG=null;const TWH=2.6;
function mkTower(p){const g=new THREE.Group(),lv=p.lv;g.position.set(X3(p.sx),Y3(p.sx,p.sy)+TWH+.04,Z3(p.sy));
  if(p.type==='yagura'){const h=2.4+lv*.35,s=1+lv*.07;g.scale.setScalar(s*1.35);
    for(const a of[[-1,-1],[1,-1],[-1,1],[1,1]]){const l=E3.mesh(E3.boxGeo(.24,h,.24),EM.darkWood,a[0]*.85,h/2,a[1]*.85);l.rotation.z=-a[0]*.07;l.rotation.x=a[1]*.07;g.add(l)}
    for(const a of[0,1]){const br=E3.mesh(E3.boxGeo(2.5,.1,.1),EM.darkWood,0,h*.28,a?.85:-.85);br.rotation.z=.5;g.add(br);const b2=E3.mesh(E3.boxGeo(.1,.1,2.5),EM.darkWood,a?.85:-.85,h*.28,0);b2.rotation.x=.5;g.add(b2)}
    g.add(E3.mesh(E3.boxGeo(2.3,.16,2.3),EM.darkWood,0,h*.55,0));g.add(E3.mesh(E3.boxGeo(2.7,.2,2.7),EM.darkWood,0,h,0));
    for(const a of[[-1.3,0,.1,2.7],[1.3,0,.1,2.7],[0,-1.3,2.7,.1],[0,1.3,2.7,.1]])g.add(E3.mesh(E3.boxGeo(a[2],.5,a[3]),EM.darkWood,a[0],h+.35,a[1]));
    const k=E3.buildKeep({x:0,z:0,y:h+.1,tiers:lv>=3?[{w:2,d:2,h:1.1},{w:1.4,d:1.4,h:.9}]:[{w:1.9,d:1.9,h:1.2}],ov:.5,rise:.45,up:.22,winScale:.7,topRise:.85,roofMat:lv>=4?EM.gold:EM.roofRed});g.add(k.walls,k.roofs);
    if(lv>=2)nobori(g,1.25,h+.2,1.25,.5)}
  else{const n=lv>=5?3:lv>=3?2:1,s=1+lv*.08,B=lv>=4?mGoldI:mIron;g.scale.setScalar(s*1.35);
    for(let i=0;i<n;i++){const z=(i-(n-1)/2)*1.5,q=new THREE.Group();q.position.z=z;g.add(q);q.add(E3.mesh(E3.boxGeo(2.1,.42,1),EM.darkWood,-.1,.5,0));q.add(E3.mesh(E3.boxGeo(1.2,.3,.8),EM.darkWood,-.9,.3,0));
      const bar=E3.mesh(new THREE.CylinderGeometry(.3,.38,2.5,14),B,.35,1,0);bar.rotation.z=-Math.PI/2+.16;q.add(bar);
      for(const u of[1.56,.6,-.5]){const mz=E3.mesh(new THREE.CylinderGeometry(.42,.42,.16,14),B,u,1+u*.16,0);mz.rotation.z=-Math.PI/2+.16;q.add(mz)}
      for(const w of[-.56,.56]){const wh=E3.mesh(new THREE.CylinderGeometry(.5,.5,.14,14),EM.darkWood,-.2,.5,w);wh.rotation.x=Math.PI/2;q.add(wh);const hb=E3.mesh(new THREE.CylinderGeometry(.14,.14,.2,8),B,-.2,.5,w);hb.rotation.x=Math.PI/2;q.add(hb)}}}
  return g}

/* ---- うごく もの：立て札の兵、影、矢、弾、小判、光 ---- */
const texOf=new Map(),_m=new THREE.Matrix4(),_p=new THREE.Vector3(),_q=new THREE.Quaternion(),_s=new THREE.Vector3(),_e=new THREE.Euler(),_c=new THREE.Color(),QI=new THREE.Quaternion();
function mkBB(cap){const geo=new THREE.PlaneGeometry(1,1);geo.translate(0,.5,0);const m=new THREE.InstancedMesh(geo,new THREE.MeshBasicMaterial({alphaTest:.5,side:THREE.DoubleSide,toneMapped:false,transparent:true}),cap);m.frustumCulled=false;m.count=0;m.renderOrder=2;scene.add(m);
  const gh=new THREE.InstancedMesh(geo,new THREE.MeshBasicMaterial({alphaTest:.2,side:THREE.DoubleSide,toneMapped:false,transparent:true,opacity:.45,color:0x9fd4ff,depthFunc:THREE.GreaterDepth,depthWrite:false}),cap);gh.instanceMatrix=m.instanceMatrix;gh.frustumCulled=false;gh.count=0;gh.renderOrder=1.5;scene.add(gh);m.userData.gh=gh;return m}
function useTex(m,cvs){if(m.userData.src===cvs)return;let t=texOf.get(cvs);if(!t){t=new THREE.CanvasTexture(cvs);t.colorSpace=THREE.SRGBColorSpace;texOf.set(cvs,t)}m.material.map=t;m.material.needsUpdate=true;m.userData.gh.material.map=t;m.userData.gh.material.needsUpdate=true;m.userData.src=cvs;m.userData.asp=cvs.width/cvs.height}
function put(m,x,y,hpx,flip,lift){if(m.count>=m.instanceMatrix.count)return;const h=hpx*.115;_p.set(X3(x),Y3(x,y)+(lift||0),Z3(y));_s.set(h*m.userData.asp*(flip?-1:1),h,1);_m.compose(_p,cam3.quaternion,_s);m.setMatrixAt(m.count++,_m)}
const bbFoe=mkBB(900),bbMid=mkBB(320),bbNin=mkBB(40),bbHero=mkBB(1),bbAshi=mkBB(140),bbTep=mkBB(12),bbYumi=mkBB(12),bbMus=mkBB(8),BBS=[bbFoe,bbMid,bbNin,bbHero,bbAshi,bbTep,bbYumi,bbMus];
function mkInst(geo,mat,cap,order){const m=new THREE.InstancedMesh(geo,mat,cap);m.frustumCulled=false;m.count=0;m.setColorAt(0,_c.set(0xffffff));if(order)m.renderOrder=order;scene.add(m);return m}
const shGeo=new THREE.CircleGeometry(1,14);shGeo.rotateX(-Math.PI/2);
const iShadow=mkInst(shGeo,new THREE.MeshBasicMaterial({color:0x1a1408,transparent:true,opacity:.3,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),1500,1);
const iBox=mkInst(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({roughness:.7}),700);iBox.castShadow=true;
const iGlow=mkInst(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({toneMapped:false}),1400);
const iBall=mkInst(new THREE.SphereGeometry(1,12,9),new THREE.MeshStandardMaterial({roughness:.4,metalness:.3}),80);
const iFx=mkInst(new THREE.SphereGeometry(1,14,10),new THREE.MeshBasicMaterial({transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}),260,3);
const coinGeo=new THREE.CylinderGeometry(.34,.34,.09,14);coinGeo.rotateX(Math.PI/2);
const iCoin=mkInst(coinGeo,new THREE.MeshStandardMaterial({color:0xf3c53f,metalness:.85,roughness:.3}),420);
const INST=[iShadow,iBox,iGlow,iBall,iFx,iCoin];
function inst(m,x,y,z,sx,sy,sz,yaw,col,pitch){if(m.count>=m.instanceMatrix.count)return;_p.set(x,y,z);_s.set(sx,sy,sz);if(yaw||pitch){_e.set(0,yaw||0,pitch||0);_q.setFromEuler(_e)}else _q.copy(QI);_m.compose(_p,_q,_s);m.setMatrixAt(m.count,_m);if(col!=null)m.setColorAt(m.count,_c.set(col));m.count++}
const shadow=(x,y,r)=>inst(iShadow,X3(x),Y3(x,y)+.09,Z3(y),r,1,r*.8);
const aura=new THREE.Mesh(new THREE.RingGeometry(.82,1,40),new THREE.MeshBasicMaterial({transparent:true,opacity:.95,toneMapped:false,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}));aura.rotation.x=-Math.PI/2;aura.renderOrder=1;scene.add(aura);
const goalM=new THREE.Mesh(new THREE.RingGeometry(.7,.95,32),new THREE.MeshBasicMaterial({color:0xf0c75e,transparent:true,opacity:.9,toneMapped:false,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}));goalM.rotation.x=-Math.PI/2;goalM.renderOrder=1;scene.add(goalM);

/* ---- カメラ：指2本（または ボタン・Q/E・右ドラッグ）で 回す、つまんで 寄る ---- */
const DMIN=34,DMAX=250,CAM={yaw:0,pitch:.9,dist:70,tx:0,tz:0,hold:0,zoomHold:0,intro:0,g:null};
function camRot(ix,iy){const cs=Math.cos(CAM.yaw),sn=Math.sin(CAM.yaw);return[ix*cs+iy*sn,-ix*sn+iy*cs]}
const scrRight=(dx,dy)=>dx*Math.cos(CAM.yaw)-dy*Math.sin(CAM.yaw);
function fit(){const s=$('#stage'),w=Math.max(50,s.clientWidth),h=Math.max(50,s.clientHeight),d=Math.min(2,window.devicePixelRatio||1);ren.setSize(w,h,false);cam3.aspect=w/h;cam3.updateProjectionMatrix();cv.width=Math.round(w*d);cv.height=Math.round(h*d);cv.style.width=w+'px';cv.style.height=h+'px';cv._w=w;cv._h=h;cv._d=d}
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),gpl=new THREE.Plane(new THREE.Vector3(0,1,0),0),hitV=new THREE.Vector3();
function toCanvas(e){const r=cv.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height*2-1));ray.setFromCamera(ndc,cam3);let lx=G?G.hero.x:180,ly=G?G.hero.y:320;
  for(let i=0;i<5;i++){gpl.constant=-Y3(lx,ly);if(!ray.ray.intersectPlane(gpl,hitV))break;lx=hitV.x/S3+180;ly=hitV.z/S3+320}return[lx,ly,1.5]}
{const st=$('#stage'),pts=new Map();let gest=false,g0=null,rdrag=null;
  const two=()=>{const a=[...pts.values()];return{ang:Math.atan2(a[1].y-a[0].y,a[1].x-a[0].x),d:Math.hypot(a[1].x-a[0].x,a[1].y-a[0].y)}};
  st.addEventListener('pointerdown',e=>{if(state!=='play')return;if(e.pointerType==='mouse'){if(e.button===2){rdrag={x:e.clientX,y:e.clientY};e.stopPropagation();e.preventDefault()}return}
    pts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pts.size>=2){gest=true;g0=two();joy=null;inp.x=0;inp.y=0;e.stopPropagation()}else if(gest)e.stopPropagation()},true);
  st.addEventListener('pointermove',e=>{if(rdrag&&e.pointerType==='mouse'){CAM.yaw-=(e.clientX-rdrag.x)*.008;CAM.pitch=Math.max(.45,Math.min(1.35,CAM.pitch+(e.clientY-rdrag.y)*.005));rdrag={x:e.clientX,y:e.clientY};e.stopPropagation();return}
    if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(gest){e.stopPropagation();if(pts.size>=2){const t=two();let da=t.ang-g0.ang;if(da>Math.PI)da-=TAU;if(da<-Math.PI)da+=TAU;CAM.yaw-=da;CAM.dist=Math.max(DMIN,Math.min(DMAX,CAM.dist*g0.d/Math.max(20,t.d)));g0=t}}},true);
  const up=e=>{if(e.pointerType==='mouse'){if(rdrag){rdrag=null;e.stopPropagation()}return}pts.delete(e.pointerId);if(gest){e.stopPropagation();if(pts.size===0)gest=false}};
  st.addEventListener('pointerup',up,true);st.addEventListener('pointercancel',up,true);st.addEventListener('contextmenu',e=>e.preventDefault());
  st.addEventListener('wheel',e=>{if(state!=='play')return;CAM.dist=Math.max(DMIN,Math.min(DMAX,CAM.dist*(e.deltaY>0?1.1:.91)));e.preventDefault()},{passive:false});
  document.querySelectorAll('#camui button').forEach(b=>{const on=e=>{e.preventDefault();e.stopPropagation();const k=b.dataset.c;if(k==='l')CAM.hold=1;else if(k==='r')CAM.hold=-1;else CAM.zoomHold=k==='in'?-1:1},off=()=>{CAM.hold=0;CAM.zoomHold=0};
    b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointerleave',off);b.addEventListener('pointercancel',off)})}

const prjV=new THREE.Vector3();
function prj(x,y,h){prjV.set(X3(x),Y3(x,y)+(h||0),Z3(y)).project(cam3);return[(prjV.x+1)/2*cv._w,(1-prjV.y)/2*cv._h,prjV.z<1]}
function rrect(k,x,y,w,h,r){k.beginPath();k.roundRect(x,y,w,h,r)}
let last3=0;
function draw(){const now=performance.now(),dt=Math.min(.05,(now-last3)/1000||0);last3=now;const g=G,play=state==='play'&&g;
  if(!CUR)useMap(MAPS[0]);if(built!==CUR)build3d(CUR);
  if(twG!==g||!play){for(const t of tw)if(t&&t.obj)scene.remove(t.obj);tw=[];twG=g}
  $('#camui').hidden=!play;
  /* カメラ */
  if(play){const H=g.hero;if(CAM.g!==g){CAM.g=g;CAM.intro=0;CAM.yaw=0;CAM.pitch=.9;CAM.tx=X3(H.x);CAM.tz=Z3(H.y);CAM.dist=cam3.aspect<.8?138:cam3.aspect<1.2?112:94;introName=3.2}
    CAM.intro=Math.min(1,CAM.intro+dt/2.6);CAM.yaw+=(CAM.hold+(keys.q?1:0)-(keys.e?1:0))*1.6*dt;CAM.dist=Math.max(DMIN,Math.min(DMAX,CAM.dist*(1+CAM.zoomHold*.9*dt)));
    const far=Math.min(1,Math.max(0,(CAM.dist-60)/90)),wh=.7-.3*far,fx=X3(H.x)*wh+cst.x*(1-wh),fz=Z3(H.y)*wh+cst.z*(1-wh),a=Math.min(1,dt*3.2);CAM.tx+=(fx-CAM.tx)*a;CAM.tz+=(fz-CAM.tz)*a;if(introName>0)introName-=dt}
  else{CAM.g=null;CAM.yaw+=dt*.12;CAM.tx=cst.x;CAM.tz=cst.z+2}
  {const q=play?1-Math.pow(1-CAM.intro,3):1,yaw=CAM.yaw+(1-q)*1.5,d=play?CAM.dist*(1+(1-q)*.7):84,pt=play?CAM.pitch:.5,sh=play&&g.shake>0?(Math.random()-.5)*.5:0,gy=Y3(CAM.tx/S3+180,CAM.tz/S3+320);
    cam3.position.set(CAM.tx+Math.sin(yaw)*Math.cos(pt)*d+sh,gy+Math.sin(pt)*d+sh,CAM.tz+Math.cos(yaw)*Math.cos(pt)*d);cam3.lookAt(CAM.tx,play?gy+1.5:HC3+(keepTop-HC3)*.45,CAM.tz);cam3.updateMatrixWorld()}
  for(const m of BBS)m.count=0;for(const m of INST)m.count=0;aura.visible=false;goalM.visible=false;
  if(play&&ART.ok){const H=g.hero,col=g.st.col,t=g.t,E=ART.foe(col),Bs=ART.boss(col);
    useTex(bbFoe,E);useTex(bbMid,Bs);useTex(bbNin,ART.foe('#23202b'));useTex(bbHero,ART.hero);useTex(bbAshi,g.solLv>=6?ART.ashiG:ART.ashi);useTex(bbTep,ART.teppo);useTex(bbYumi,ART.yumi);useTex(bbMus,ART.musha);
    /* 櫓・大筒 */
    g.pads.forEach((p,i)=>{if(!p.sx)return;let o=tw[i];if(!o||o.lv!==p.lv){if(o&&o.obj)scene.remove(o.obj);o=tw[i]={lv:p.lv,obj:p.lv>0?mkTower(p):null};if(o.obj)scene.add(o.obj)}if(o.obj&&p.type==='ozutsu')o.obj.rotation.y=-p.ang});
    /* 敵 */
    for(const o of g.en){const tx=BX-o.x,ty=BY-o.y,tl=Math.hypot(tx,ty)||1,fl=scrRight(tx,ty)>0,ph=t*10*(o.cav?1.5:1)+(o.ph||0),bob=Math.abs(Math.sin(ph))*.22,pu=o.fl>0?1.12:1,yaw=-Math.atan2(ty,tx),wx=X3(o.x),wz=Z3(o.y),gy=Y3(o.x,o.y);
      if(o.boss){put(bbMid,o.x,o.y,62*pu,fl,Math.abs(Math.sin(t*5))*.25);shadow(o.x,o.y,1.5);continue}
      shadow(o.x,o.y,o.cav?1.1:o.big||o.mid?.75:.55);
      if(o.can){const kk=Math.max(0,1-(t-(o.fire||-9))/.25);inst(iBox,wx,gy+.45,wz,1.9,.45,1,yaw,0x5b3b26);inst(iBox,wx+tx/tl*(.5-kk*.4),gy+1,wz+ty/tl*(.5-kk*.4),2.4,.55,.55,yaw,col,.16);put(bbFoe,o.x-tx/tl*13,o.y-ty/tl*13,25,fl,0);
        if(kk>0)inst(iFx,wx+tx/tl*1.9,gy+1.3,wz+ty/tl*1.9,.5+kk*.7,.5+kk*.7,.5+kk*.7,0,_c.setRGB(kk,.8*kk,.4*kk).getHex());continue}
      let lift=bob;if(o.cav){inst(iBox,wx,gy+.85,wz,2.2,.85,.7,yaw,0x7a4a26);inst(iBox,wx+tx/tl*1.2,gy+1.45,wz+ty/tl*1.2,.8,.55,.42,yaw,0x6b3f20,.7);inst(iBox,wx-tx/tl*1.2,gy+.95,wz-ty/tl*1.2,.5,.12,.12,yaw,0x2a1a10,-.6);
        for(const a of[-.75,.75])for(const b of[-.22,.22])inst(iBox,wx+tx/tl*a-ty/tl*b,gy+.3+Math.abs(Math.sin(ph+a*3))*.14,wz+ty/tl*a+tx/tl*b,.16,.6,.16,yaw,0x4a2c16);lift=1.05+bob*.6}
      put(o.mid||o.big?bbMid:o.nin?bbNin:bbFoe,o.x,o.y,(o.h||27)*pu,fl,lift);
      if(o.shd)inst(iBox,wx+tx/tl*.62,gy+1.05+bob,wz+ty/tl*.62,.16,1.9,1.05,yaw,0xcdb964)}
    /* 自軍 */
    for(const s of g.sol){shadow(s.x,s.y,.55);put(bbAshi,s.x,s.y,26+g.solLv*.6,(s.f?1:-1)*Math.cos(CAM.yaw)>0,Math.abs(Math.sin(s.ph))*.2)}
    for(const a of g.al){const L=a.lv||0,sz=30+L*.9;shadow(a.x,a.y,.65);if(a.t==='m')put(bbMus,a.x,a.y,sz+12,(a.f?1:-1)*Math.cos(CAM.yaw)>0,Math.abs(Math.sin(a.ph||0))*.22);else put(a.t==='y'?bbYumi:bbTep,a.x,a.y,a.t==='y'?sz-2:sz,scrRight(a.ax,a.ay)>0,0)}
    if(H.dead<=0){shadow(H.x,H.y,.8);if(!(H.inv>0&&((t*10)|0)%2))put(bbHero,H.x,H.y,46+H.lv*1.7,scrRight(H.ax,H.ay)<0,H.mv?Math.abs(Math.sin(H.walk))*.28:0);
      aura.visible=true;const rr=1.5+H.lv*.14+Math.sin(t*6)*(H.lv>=2?.12:0);aura.position.set(X3(H.x),Y3(H.x,H.y)+.12,Z3(H.y));aura.scale.setScalar(rr);aura.material.color.set(H.lv>=4?0xff783c:H.lv>=2?0x78c8ff:0xf0c75e)}
    if(g.goal&&H.dead<=0){goalM.visible=true;goalM.position.set(X3(g.goal[0]),Y3(g.goal[0],g.goal[1])+.14,Z3(g.goal[1]));goalM.scale.setScalar(1+.25*Math.sin(t*8))}
    /* 矢・玉・弾・小判 */
    for(const a of g.ar){const L=a.lvl||0,yw=-Math.atan2(a.vy,a.vx),gy=Y3(a.x,a.y);if(a.gun)inst(iGlow,X3(a.x),gy+1.5,Z3(a.y),1.1,.16,.16,yw,0xffd27a);else inst(iGlow,X3(a.x-a.vx*.02),gy+(a.big?2.4:1.5),Z3(a.y-a.vy*.02),L>=4?3.2:L>=2?2.6:2.1,L>=4?.2:.13,L>=4?.2:.13,yw,L>=4?0xff8a3c:L>=2?0x8fe0ff:0xfff7e0)}
    for(const a of g.ea)inst(iGlow,X3(a.x-a.vx*.03),Y3(a.x,a.y)+1.5,Z3(a.y-a.vy*.03),2.2,.17,.17,-Math.atan2(a.vy,a.vx),0xff4a3a);
    for(const b of g.balls){if(b.t<0)continue;const p=b.t/b.T,r=.34+(b.lv||1)*.05;inst(iBall,X3(b.x),Y3(b.x,b.y)+.8+Math.sin(p*Math.PI)*5,Z3(b.y),r,r,r,0,(b.lv||1)>=4?0xffb347:0x1c1a16);shadow(b.x,b.y,.4)}
    for(const b of g.eb){const p=b.t/b.T;inst(iBall,X3(b.x),Y3(b.x,b.y)+.8+Math.sin(p*Math.PI)*6,Z3(b.y),.45,.45,.45,0,0xc0261a);shadow(b.x,b.y,.45)}
    g.cn.forEach((k,i)=>inst(iCoin,X3(k.x),Y3(k.x,k.y)+.55+Math.sin(t*5+i)*.12,Z3(k.y),1,1,1,t*4+i));
    /* 光と けむり、たおれて とぶ 敵 */
    for(const f of g.fx){if(f.k==='t'||f.k==='w')continue;const p=f.d?1-f.t/f.d:0,gy=Y3(f.x,f.y);
      if(f.k==='x'){const R=f.R*S3*(.5+.8*p),v=1-p;inst(iFx,X3(f.x),gy+R*.5,Z3(f.y),R,R*.8,R,0,_c.setRGB(v,.62*v,.2*v).getHex());inst(iFx,X3(f.x),gy+.15,Z3(f.y),R*1.15,.05,R*1.15,0,_c.setRGB(.3*v,.14*v,.04*v).getHex())}
      else if(f.k==='r'){const R=f.R*S3*(.3+.7*p),q=f.col.split(','),v=(1-p)*.55;inst(iFx,X3(f.x),gy+.15,Z3(f.y),R,.05,R,0,_c.setRGB(q[0]/255*v,q[1]/255*v,q[2]/255*v).getHex())}
      else if(f.k==='p'){const R=.3+(.25-f.t)*2.4,v=Math.min(.7,f.t*2.4);inst(iFx,X3(f.x),gy+.9,Z3(f.y),R,R,R,0,_c.setRGB(v,v*.95,v*.85).getHex())}
      else if(f.k==='s'){const v=f.t/.12*.5;inst(iFx,X3(f.x),gy+.18,Z3(f.y),1.5,.05,1.5,0,_c.setRGB(v,v,v).getHex())}
      else if(f.k==='d')put(f.m?bbMid:bbFoe,f.x+f.vx*p,f.y,(f.h||27)*(1-p*p),scrRight(f.fl?1:-1,0)>0,Math.sin(p*Math.PI)*2.6)}}
  for(const m of BBS){m.instanceMatrix.needsUpdate=true;m.userData.gh.count=m.count}for(const m of INST){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true}
  ren.render(scene,cam3);overlay(play?g:null)}

/* ---- 上に かさねる 文字と しるし ---- */
function overlay(g){const k=c,w=cv._w,h=cv._h;k.setTransform(cv._d,0,0,cv._d,0,0);k.clearRect(0,0,w,h);if(!g){k.fillStyle='rgba(14,23,41,.28)';k.fillRect(0,0,w,h);return}
  const H=g.hero,t=g.t,BR='"Yuji Syuku","Yu Mincho",serif';k.textAlign='center';k.textBaseline='middle';
  for(const p of g.pads){const q=prj(p.x,p.y,.3);if(!q[2])continue;const mx=p.lv>=MAXLV,x=q[0],y=q[1],can=!mx&&g.coins>=p.cost-p.paid;
    if(!mx&&p.paid>0){k.fillStyle='rgba(216,165,63,.9)';rrect(k,x-20,y+9,40*Math.min(1,p.paid/p.cost),5,2);k.fill();k.strokeStyle='rgba(14,23,41,.7)';k.lineWidth=1;rrect(k,x-20,y+9,40,5,2);k.stroke()}
    k.font='bold 17px sans-serif';k.lineWidth=4;k.strokeStyle='rgba(14,23,41,.85)';const num=mx?'極':String(Math.ceil(p.cost-p.paid));k.strokeText(num,x,y);k.fillStyle=can?'#ffe9a0':'#fff7e0';k.fillText(num,x,y);
    k.font='12px '+BR;const lb=p.name+(p.lv?' '+p.lv:''),lw=k.measureText(lb).width+10;k.fillStyle=p.type==='jin'?'rgba(28,90,52,.9)':p.type==='yumi'?'rgba(28,63,120,.9)':'rgba(14,23,41,.75)';rrect(k,x-lw/2,y-27,lw,15,4);k.fill();k.fillStyle='#fff7e0';k.fillText(lb,x,y-19);
    if(can){const s=.5+.5*Math.sin(t*7);k.strokeStyle='rgba(255,236,150,'+(.4+.5*s).toFixed(2)+')';k.lineWidth=2;k.beginPath();k.ellipse(x,y+2,30+s*4,17+s*3,0,0,TAU);k.stroke()}
    if(p.type==='jin'&&!mx&&g.base.hp<g.base.max*.5){const b=Math.abs(Math.sin(t*6))*4;k.fillStyle='#e2503d';k.beginPath();k.arc(x+lw/2+10,y-20-b,8,0,TAU);k.fill();k.fillStyle='#fff';k.font='bold 13px sans-serif';k.fillText('!',x+lw/2+10,y-19.5-b)}
    if(p.dw>0&&p.dw<.45&&!mx){k.strokeStyle='#fff';k.lineWidth=3;k.lineCap='round';k.beginPath();k.arc(x,y,24,-Math.PI/2,-Math.PI/2+TAU*p.dw/.45);k.stroke()}}
  {prjV.set(cst.x,keepTop+.8,cst.z).project(cam3);const x=Math.max(60,Math.min(w-60,(prjV.x+1)/2*w)),y=Math.max(14,(1-prjV.y)/2*h),r=Math.max(0,g.base.hp/g.base.max);k.fillStyle=g.base.hit>0?'rgba(150,30,20,.9)':'rgba(14,23,41,.82)';rrect(k,x-56,y-9,112,18,5);k.fill();k.fillStyle='#fff7e0';k.font='11px '+BR;k.fillText('城',x-46,y);
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
  if(introName>0&&g.wave===0){k.globalAlpha=Math.min(1,introName*1.5);k.font='22px '+BR;const nm=THM.name,lw=k.measureText(nm).width+36;k.fillStyle='rgba(14,23,41,.78)';rrect(k,w/2-lw/2,h*.3-20,lw,40,8);k.fill();k.fillStyle='#f0c75e';k.fillText(nm,w/2,h*.3+1);k.globalAlpha=1}
  if(joy){const r=cv.getBoundingClientRect(),x=joy.x0-r.left,y=joy.y0-r.top;k.strokeStyle='rgba(255,255,255,.55)';k.lineWidth=2;k.beginPath();k.arc(x,y,45,0,TAU);k.stroke();k.fillStyle='rgba(255,255,255,.45)';k.beginPath();k.arc(x+inp.x*45,y+inp.y*45,17,0,TAU);k.fill()}}

/* 試すための 取っ手 */
window.__t3={g:()=>G,cur:()=>CUR,ren,CAM,M:()=>M,start(s,mi){window.__force=mi;newGame(s);window.__force=null;state='play';showCard()},check(){const out=[];for(const m of MAPS){useMap(m);const bad=[];m.dirs.forEach((d,i)=>{const c=cellOf(d.x,d.y);if(blocked[c]||dist[c]>=1e9)bad.push('dir'+i)});PADS.forEach((p,i)=>{if(blk(p.x,p.y)||dist[cellOf(p.x,p.y)]>=1e9)bad.push('pad'+i);if(p.sx&&!blk(p.sx,p.sy))bad.push('site'+i)});if(blk(m.hero[0],m.hero[1]))bad.push('hero');let far=0;m.dirs.forEach(d=>{far=Math.max(far,dist[cellOf(d.x,d.y)])});out.push(m.id+':'+(bad.join(',')||'ok')+':'+far)}return out.join(' ')},step(n){for(let i=0;i<n&&!G.over;i++)update(1/30)},err:null};addEventListener('error',e=>{window.__t3.err=String(e.message)});
fit();showCard();loadArt();requestAnimationFrame(loop);
