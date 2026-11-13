export function paintImpostor(color, depth, {width=30,height=9,kind='building',bays=7}={}) {
  const c=color.getContext('2d');
  const d=depth.getContext('2d');
  const w=color.width,h=color.height;
  c.clearRect(0,0,w,h);
  d.clearRect(0,0,w,h);
  function shape(points,fill,z) {
    for(const [context,paint] of [[c,fill],[d,`rgb(${z},${z},${z})`]]) {
      context.beginPath();
      points.forEach((point,index)=>context[index?'lineTo':'moveTo'](point[0]*w,point[1]*h));
      context.closePath();context.fillStyle=paint;context.fill();
    }
  }
  function rect(x,y,rw,rh,fill,z) {shape([[x,y],[x+rw,y],[x+rw,y+rh],[x,y+rh]],fill,z);}
  if(kind==='tree') {
    rect(0.48,0.35,0.04,0.58,'#5b5945',115);
    const layers=[{x:0.5,y:0.39,rx:0.36,ry:0.3,fill:'#385b49',z:140},{x:0.44,y:0.34,rx:0.3,ry:0.24,fill:'#527657',z:180},{x:0.48,y:0.26,rx:0.25,ry:0.16,fill:'#749068',z:205}];
    for(const layer of layers) {
      const points=[];
      for(let i=0;i<44;i++) {const a=i*Math.PI*2/44;const r=1+0.09*Math.sin(a*7)+0.06*Math.cos(a*11);points.push([layer.x+Math.cos(a)*layer.rx*r,layer.y+Math.sin(a)*layer.ry*r]);}
      shape(points,layer.fill,layer.z);
    }
    return {kind,illustration:true,width,height};
  }
  rect(0.13,0.79,0.74,0.09,'#8d927f',180);
  rect(0.17,0.4,0.66,0.4,'#806856',105);
  rect(0.18,0.46,0.64,0.31,'#584c44',85);
  for(let i=0;i<=bays;i++)rect(0.18+i*0.64/bays-0.008,0.42,0.016,0.37,'#a27e59',155);
  shape([[0.09,0.43],[0.15,0.4],[0.29,0.17],[0.7,0.17],[0.85,0.4],[0.91,0.43],[0.87,0.47],[0.13,0.47]],'#a98b49',225);
  shape([[0.16,0.42],[0.31,0.2],[0.69,0.2],[0.84,0.42]],'#bda467',210);
  rect(0.29,0.155,0.42,0.018,'#d3bc83',235);
  rect(0.1,0.45,0.8,0.022,'#665e43',240);
  for(let i=1;i<18;i++) {const x=0.18+i*0.64/18;shape([[x,0.22],[x+0.004,0.22],[x+0.025,0.42],[x+0.021,0.42]],'rgba(82,76,53,0.22)',214);}
  return {kind,illustration:true,width,height,bays,bays_verified:false};
}
