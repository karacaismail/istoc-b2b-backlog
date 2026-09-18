<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Application, Assets, Container, Graphics, isMobile, NineSliceSprite, Rectangle, Text, type Texture } from 'pixi.js'
import { Button } from '@pixi/ui'
import { capacity, NAMES, TEAM_COLORS, selectedCards, planCheck } from '../game/model'
import type { GameState } from '../game/model'
const props=defineProps<{ state: GameState; activeTeam: number }>()
const emit=defineEmits<{team:[index:number]; remove:[id:string]; reveal:[]; drop:[id:string]}>()
type Target={id:string;label:string;x:number;y:number;w:number;h:number;pressed?:boolean;action:()=>void}
const host=ref<HTMLDivElement|null>(null), targets=ref<Target[]>([]), failed=ref(false), ready=ref(false)
let app: Application|undefined, observer:ResizeObserver|undefined, texture:Texture|undefined, disposed=false, frame=0
const ink=0x152e2b, cream=0xfff8e8, gold=0xf5d38a
function label(parent:Container,text:string,x:number,y:number,size=16,fill=cream,align:'left'|'center'='center',width?:number){
 const t=new Text({text,style:{fontFamily:'Arial, sans-serif',fontSize:size,fontWeight:'600',fill,align,wordWrap:!!width,wordWrapWidth:width,breakWords:false,lineHeight:size*1.3}})
 t.anchor.set(align==='center'?.5:0,.5);t.position.set(x,y);parent.addChild(t);return t
}
function shape(parent:Container,x:number,y:number,w:number,h:number,color:number,r=12,stroke?:number){
 const g=new Graphics().roundRect(x,y,w,h,r).fill(color);if(stroke!==undefined)g.stroke({color:stroke,width:2});parent.addChild(g);return g
}
function compass(parent:Container,x:number,y:number,r:number,fill=gold){
 const g=new Graphics().circle(x,y,r).stroke({color:fill,width:1,alpha:.5}).circle(x,y,r*.78).stroke({color:fill,width:1,alpha:.35})
 g.poly([x,y-r*.86,x+r*.2,y,x,y+r*.86,x-r*.2,y]).fill({color:fill,alpha:.9})
 g.poly([x-r*.86,y,x,y-r*.2,x+r*.86,y,x,y+r*.2]).fill({color:fill,alpha:.4});parent.addChild(g)
}
function pawn(parent:Container,x:number,y:number,color:number,scale=1){
 const g=new Graphics().ellipse(x,y+25*scale,24*scale,7*scale).fill({color:0x051f1b,alpha:.3})
 g.moveTo(x-9*scale,y-5*scale).lineTo(x-22*scale,y+5*scale).lineTo(x-17*scale,y+13*scale).lineTo(x-11*scale,y+9*scale).lineTo(x-14*scale,y+24*scale).lineTo(x+14*scale,y+24*scale).lineTo(x+11*scale,y+9*scale).lineTo(x+17*scale,y+13*scale).lineTo(x+22*scale,y+5*scale).lineTo(x+9*scale,y-5*scale).closePath().fill(color).stroke({color:ink,width:2})
 g.circle(x,y-13*scale,11*scale).fill(color).stroke({color:ink,width:2});g.circle(x-3*scale,y-16*scale,3*scale).fill({color:0xffffff,alpha:.45});parent.addChild(g)
}
function interactive(parent:Container,target:Target){
 parent.eventMode='static';parent.cursor='pointer';parent.hitArea=new Rectangle(0,0,target.w,target.h)
 const button=new Button(parent);button.onPress.connect(target.action)
 // Pixi UI uses mouse events for desktop UAs; hybrid laptops still need touch/pen.
 if(!isMobile.any)parent.on('pointertap',event=>{if(event.pointerType!=='mouse')target.action()})
 button.onHover.connect(()=>{parent.y=target.y-3;app?.render()});button.onOut.connect(()=>{parent.y=target.y;app?.render()})
 targets.value.push(target)
}
function redraw(){
 if(!app||!host.value||disposed)return
 cancelAnimationFrame(frame);targets.value=[]
 const w=Math.max(260,host.value.clientWidth), mobile=w<620, h=props.state.phase===3?(mobile?490:360):(mobile?390:350)
 app.renderer.resize(w,h);host.value.style.height=`${h}px`
 for(const c of app.stage.removeChildren())c.destroy({children:true})
 const bg=new Graphics().roundRect(0,0,w,h,18).fill(0x1b413d).roundRect(10,10,w-20,h-20,12).stroke({width:1,color:0x62877b,alpha:.6})
 for(let x=26;x<w;x+=24)for(let y=26;y<h;y+=24)bg.circle(x,y,.7).fill({color:0xbcd3bb,alpha:.13})
 bg.moveTo(w*.14,h*.2).bezierCurveTo(w*.35,h*.8,w*.65,h*.05,w*.88,h*.8).stroke({width:1,color:0x9fb7a5,alpha:.16})
 app.stage.addChild(bg)
 const root=new Container();app.stage.addChild(root)
 const cap=capacity(props.state)
 if(props.state.phase===1||props.state.phase===2){
  const cw=mobile?Math.min(132,(w-44)/2):155,ch=mobile?100:112
  const positions=mobile?[[18,24],[w-cw-18,24],[18,h-ch-22],[w-cw-18,h-ch-22]]:[[30,30],[w-cw-30,30],[30,h-ch-30],[w-cw-30,h-ch-30]]
  positions.forEach(([x,y],i)=>{
   const seat=new Container();seat.position.set(x,y);root.addChild(seat)
   const isCapacity=props.state.phase===1,active=isCapacity&&props.activeTeam===i,color=parseInt(TEAM_COLORS[i].slice(1),16)
   if(isCapacity){
    shape(seat,0,4,cw,ch,0x0d2b29,16);shape(seat,0,0,cw,ch,active?0xecdab5:0x32574e,16,active?gold:0x678778)
    pawn(seat,30,34,color,.72);label(seat,NAMES[i],cw/2+20,28,16,active?ink:cream)
    label(seat,`${198-props.state.unavailable[i]} sa`,cw/2+20,52,18,active?ink:cream)
    label(seat,active?'SEÇİLİ':'EKİP TAŞI',cw/2,81,16,active?ink:cream)
    interactive(seat,{id:`team-${i}`,label:`${NAMES[i]} kapasitesini düzenle`,x,y,w:cw,h:ch,pressed:active,action:()=>emit('team',i)})
   }else{
    const has=props.state.votes[i]!==null
    shape(seat,0,5,cw,ch,0x0e2926,12);shape(seat,0,0,cw,ch,props.state.revealed?0xfff5df:has?0x234e46:0x254e47,12,has?gold:0x6e8b80)
    label(seat,NAMES[i],cw/2,19,16,props.state.revealed?ink:cream)
    if(props.state.revealed)label(seat,String(props.state.votes[i]),cw/2,57,38,ink)
    else {compass(seat,cw/2,57,19,has?gold:0x72948a);label(seat,has?'KİLİTLİ':'BEKLİYOR',cw/2,86,16,cream)}
   }
  })
  const cx=w/2,cy=h/2
  if(props.state.phase===1){
   root.addChild(new Graphics().circle(cx,cy, mobile?53:75).fill(0x16342f).stroke({color:gold,width:2}))
   label(root,'ODAK',cx,cy-24,16,gold);label(root,String(Math.round(cap.delivery)),cx,cy+3,mobile?32:42,cream);label(root,'saat / ay',cx,cy+30,16,cream)
   if(!mobile){compass(root,cx-130,cy,30);compass(root,cx+130,cy,30)}
  }else{
   const bw=mobile?178:234,bh=60,x=cx-bw/2,y=cy-bh/2,buttonRoot=new Container();buttonRoot.position.set(x,y);root.addChild(buttonRoot)
   if(texture){const nine=new NineSliceSprite({texture,leftWidth:12,rightWidth:12,topHeight:10,bottomHeight:14,width:bw,height:bh});buttonRoot.addChild(nine)}else shape(buttonRoot,0,0,bw,bh,gold)
   const all=props.state.votes.every(v=>v!==null)
   label(buttonRoot,props.state.revealed?'KARTLAR AÇIK':all?'KARTLARI AÇ':`${props.state.votes.filter(v=>v!==null).length} / 4 HAZIR`,bw/2,bh/2-3,16,ink)
   if(all&&!props.state.revealed)interactive(buttonRoot,{id:'reveal',label:'Masadaki dört kartı aç',x,y,w:bw,h:bh,action:()=>emit('reveal')})
  }
 }else if(props.state.phase===3){
  const p=planCheck(props.state),cols=mobile?2:4,gap=12,pad=mobile?22:30,slotW=(w-pad*2-gap*(cols-1))/cols,slotH=mobile?80:100
  label(root,'SPRİNT ALANI',w/2,32,16,gold)
  const selected=selectedCards(props.state)
  for(let i=0;i<8;i++){
   const x=pad+i%cols*(slotW+gap),y=58+Math.floor(i/cols)*(slotH+10),c=selected[i]
   if(c){
    const piece=new Container();piece.position.set(x,y);root.addChild(piece)
    shape(piece,0,4,slotW,slotH,0x0c2925,8);shape(piece,0,0,slotW,slotH,0xfff5df,8,p.over?0xcc7459:0xb5c7a3)
    label(piece,`${c.points} SP`,slotW/2,25,22,ink);label(piece,c.short,slotW/2,54,16,ink)
    interactive(piece,{id:`remove-${c.id}`,label:`${c.title} görevini sprintten çıkar`,x,y,w:slotW,h:slotH,action:()=>emit('remove',c.id)})
   }else{
    root.addChild(new Graphics().roundRect(x,y,slotW,slotH,8).stroke({color:0x789184,width:1,alpha:.7}));label(root,'+',x+slotW/2,y+slotH/2,26,0x93a99c)
   }
  }
  const trackY=h-46,trackW=w-pad*2,ratio=cap.budget>0?Math.min(p.points/cap.budget,1):p.points?1:0
  shape(root,pad,trackY,trackW,12,0x102e29,6)
  if(ratio)shape(root,pad,trackY,trackW*ratio,12,p.over?0xf4b8a4:gold,6)
  label(root,`${p.points} / ${cap.budget} SP · ${p.over?'KAPASİTE AŞILDI':'PLAN TAVANI'}`,w/2,h-16,16,cream)
 }else{
  const cx=w/2,cy=h/2-18
  compass(root,cx,cy,mobile?100:120,gold)
  const g=new Graphics()
  for(let i=0;i<7;i++){const angle=(i*15+130)*Math.PI/180;const x=cx+Math.cos(angle)*130,y=cy+Math.sin(angle)*110;g.ellipse(x,y,12,5).fill(0xb7ceb0);g.ellipse(2*cx-x,y,12,5).fill(0xb7ceb0)}
  root.addChild(g);shape(root,cx-66,cy-45,132,90,0xfff4d9,16);label(root,'SPRİNT',cx,cy-15,18,ink);label(root,`${planCheck(props.state).points} SP`,cx,cy+18,32,ink)
  label(root,'PLAN HAZIR',cx,h-66,24,cream);label(root,'Bir hedef. Bir takım. Bir artırım.',cx,h-35,16,cream)
 }
 app.render()
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
  const start=performance.now();const animate=(now:number)=>{if(disposed||!app)return;const p=Math.min((now-start)/220,1);root.alpha=.6+.4*p;root.y=(1-p)*7;app.render();if(p<1)frame=requestAnimationFrame(animate)};frame=requestAnimationFrame(animate)
 }
 ready.value=true
}
function handleDrop(e:DragEvent){e.preventDefault();const id=e.dataTransfer?.getData('text/plain');if(id)emit('drop',id)}
onMounted(async()=>{
 try{
  app=new Application();await app.init({width:300,height:390,backgroundAlpha:0,antialias:true,resolution:Math.min(devicePixelRatio||1,2),autoDensity:true,autoStart:false,preference:['webgl']})
  if(disposed){app.destroy(true,{children:true});return}
  app.canvas.setAttribute('aria-hidden','true');app.canvas.style.touchAction='pan-y';host.value?.prepend(app.canvas)
  try{texture=await Assets.load(`${import.meta.env.BASE_URL}game/kenney/button_rectangle_depth_flat.png`)}catch{/* Procedural view remains usable offline. */}
  if(disposed)return
  observer=new ResizeObserver(redraw);if(host.value)observer.observe(host.value);redraw()
 }catch{failed.value=true;ready.value=false}
})
watch(()=>[props.state,props.activeTeam],()=>redraw(),{deep:true,flush:'post'})
onBeforeUnmount(()=>{disposed=true;cancelAnimationFrame(frame);observer?.disconnect();if(app?.renderer)app.destroy(true,{children:true})})
</script>

<template>
 <div class="strategy-board" :class="{'board-fallback':failed}" @dragover.prevent @drop="handleDrop">
  <div ref="host" class="pixi-surface" :aria-label="`Oyun tahtası, aşama ${state.phase}`" role="group">
   <button v-for="target in targets" :key="target.id" class="board-key-target" :aria-label="target.label" :aria-pressed="target.pressed" :style="{left:target.x+'px',top:target.y+'px',width:target.w+'px',height:target.h+'px'}" @click="target.action">{{ target.label }}</button>
  </div>
  <div v-if="!ready&&!failed" class="board-loading" role="status">Oyun masası hazırlanıyor…</div>
  <div v-if="failed" class="board-loading"><p>Tahta çizimi bu cihazda açılamadı.</p><p>Aşağıdaki kartlarla oyunun bütün adımları kullanılabilir.</p></div>
 </div>
</template>
