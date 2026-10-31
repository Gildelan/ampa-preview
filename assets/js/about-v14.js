/* No autoplay, no remote dependencies, no duplicate slides. */
(()=>{'use strict';
 document.querySelectorAll('.ampa-about-carousel').forEach((root)=>{
  const track=root.querySelector('.ampa-about-track'),slides=Array.from(track?.children||[]);
  if(!track||slides.length<2)return;
  const controls=document.createElement('div');controls.className='ampa-about-controls';
  const previous=document.createElement('button'),next=document.createElement('button'),status=document.createElement('p');
  previous.type=next.type='button';previous.textContent='←';next.textContent='→';previous.setAttribute('aria-label','Fotografía anterior');next.setAttribute('aria-label','Fotografía siguiente');
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
  if(!track.id)track.id='ampa-about-track-'+Array.from(document.querySelectorAll('.ampa-about-track')).indexOf(track);
  previous.setAttribute('aria-controls',track.id);next.setAttribute('aria-controls',track.id);
  controls.append(previous,status,next);root.insertBefore(controls,track);
  let index=0,frame=0;
  const positions=()=>slides.map(slide=>slide.getBoundingClientRect().left-track.getBoundingClientRect().left+track.scrollLeft);
  const update=()=>{frame=0;const max=track.scrollWidth-track.clientWidth;const p=positions();index=p.reduce((best,x,i)=>Math.abs(x-track.scrollLeft)<Math.abs(p[best]-track.scrollLeft)?i:best,0);previous.disabled=track.scrollLeft<=3;next.disabled=track.scrollLeft>=max-3;const last=slides.reduce((v,s,i)=>s.getBoundingClientRect().left<track.getBoundingClientRect().right-5?i:v,index);status.textContent=(last>index?(index+1)+'–'+(last+1):String(index+1))+' de '+slides.length;};
  const move=(target)=>{const p=positions(),max=track.scrollWidth-track.clientWidth;track.scrollTo({left:Math.min(max,p[Math.max(0,Math.min(slides.length-1,target))]),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};
  previous.addEventListener('click',()=>move(index-1));next.addEventListener('click',()=>move(index+1));
  track.addEventListener('keydown',event=>{if(event.target!==track)return;const targets={ArrowLeft:index-1,ArrowRight:index+1,Home:0,End:slides.length-1};if(event.key in targets){event.preventDefault();move(targets[event.key]);}});
  track.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(update);},{passive:true});
  if('ResizeObserver' in window)new ResizeObserver(update).observe(track);else window.addEventListener('resize',update);
  update();
 });
})();
