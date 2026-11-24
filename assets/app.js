(() => {
 const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('.main-nav');
 if(toggle&&nav) toggle.addEventListener('click',()=>{nav.classList.toggle('open');toggle.setAttribute('aria-expanded',nav.classList.contains('open'));});
 const y=document.getElementById('year');if(y)y.textContent=new Date().getFullYear();
 const CATALOG={
  eicr:{name:'EICR Inspection',price:90,category:'electrical'},
  'fire-alarm':{name:'Fire Alarm Certification',price:60,category:'fire'},
  'emergency-lighting':{name:'Emergency Lighting',price:50,category:'fire'},
  epc:{name:'Energy Performance Certificate',price:80,category:'other'},
  fra:{name:'Fire Risk Assessment',price:90,category:'fire'},
  'gas-safety':{name:'Gas Safety Certificate',price:60,category:'other'},
  'pat-testing':{name:'PAT Testing',price:40,category:'electrical'}
 };
 const read=()=>{try{return JSON.parse(localStorage.getItem('lceBasket')||'[]')}catch{return []}};
 const write=x=>localStorage.setItem('lceBasket',JSON.stringify(x));
 window.LCE_CATALOG=CATALOG;window.LCE_readBasket=read;window.LCE_writeBasket=write;
 window.LCE_addService=(id)=>{if(!CATALOG[id])return;let b=read();if(!b.some(x=>x.id===id))b.push({id,...CATALOG[id]});write(b);};
 window.LCE_discount=b=>b.length>=2&&b.some(x=>x.id==='eicr'||x.id==='fra');
 window.LCE_total=b=>{let n=b.reduce((s,x)=>s+x.price,0);return window.LCE_discount(b)?n*.9:n};
 const params=new URLSearchParams(location.search),wanted=params.get('service');
 if(wanted&&CATALOG[wanted])window.LCE_addService(wanted);
})();
