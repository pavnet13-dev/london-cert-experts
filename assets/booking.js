(() => {
 const form=document.getElementById('booking-form');if(!form)return;
 const $=id=>document.getElementById(id),items=$('basket-items'),total=$('basket-total'),discount=$('discount-message'),msg=$('booking-message');
 const money=n=>'£'+n.toFixed(2);
 function render(){
  const b=window.LCE_readBasket();items.innerHTML='';
  if(!b.length)items.innerHTML='<div class="empty">Your basket is empty. Add a service from the services page.</div>';
  b.forEach(x=>{const d=document.createElement('div');d.className='basket-item';d.innerHTML='<span>'+x.name+'</span><span>'+money(x.price)+' <button type="button" aria-label="Remove '+x.name+'">×</button></span>';d.querySelector('button').onclick=()=>{window.LCE_writeBasket(b.filter(y=>y.id!==x.id));render()};items.appendChild(d)});
  const eligible=window.LCE_discount(b),subtotal=b.reduce((s,x)=>s+x.price,0);
  discount.classList.toggle('hidden',!eligible);
  discount.textContent=eligible?'10% multi-service discount applied to the guide-price estimate.':'10% off applies when you book at least two different services and one is EICR or Fire Risk Assessment.';
  total.textContent=money(window.LCE_total(b));
 }
 render();
 const cfg=window.LCE_CONFIG||{};
 const configured=cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY&&!cfg.SUPABASE_URL.includes('YOUR_')&&!cfg.SUPABASE_ANON_KEY.includes('YOUR_')&&window.supabase;
 form.addEventListener('submit',async e=>{
  e.preventDefault();const basket=window.LCE_readBasket();
  if(!basket.length){msg.textContent='Please add at least one service to your basket.';msg.classList.remove('hidden');return;}
  const data=Object.fromEntries(new FormData(form).entries());
  const discountApplied=window.LCE_discount(basket),subtotal=basket.reduce((s,x)=>s+x.price,0);
  const payload={customer_name:data.name,email:data.email,phone:data.phone,postcode:data.postcode,property_address:data.address,property_type:data.property_type,preferred_date:data.preferred_date||null,preferred_time:data.preferred_time||null,customer_type:data.customer_type,notes:data.notes,services:basket,estimated_total:window.LCE_total(basket),discount_applied:discountApplied,status:'received'};
  const button=form.querySelector('button[type=submit]');button.disabled=true;button.textContent='Sending…';
  try{
   if(configured){
    const client=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
    const {error}=await client.from('booking_requests').insert(payload);if(error)throw error;
    msg.textContent='Your booking request has been submitted. Our team will contact you to confirm availability and final pricing.';
   }else{
    const body=`New booking request%0AName: ${encodeURIComponent(data.name)}%0AEmail: ${encodeURIComponent(data.email)}%0APhone: ${encodeURIComponent(data.phone)}%0AAddress: ${encodeURIComponent(data.address+', '+data.postcode)}%0AServices: ${encodeURIComponent(basket.map(x=>x.name).join(', '))}%0AEstimated total: ${encodeURIComponent(money(window.LCE_total(basket)))}%0APreferred date/time: ${encodeURIComponent(data.preferred_date+' / '+data.preferred_time)}%0ANotes: ${encodeURIComponent(data.notes||'None')}`;
    location.href='mailto:info@londoncertexperts.co.uk?subject=Website%20booking%20request&body='+body;
    msg.textContent='Your email app should open with the booking request. Connect Supabase to store requests directly on the website.';
   }
   msg.classList.remove('hidden');if(configured){form.reset();window.LCE_writeBasket([]);render();}
  }catch(err){msg.textContent='We could not submit the request online. Please email info@londoncertexperts.co.uk. Details: '+(err.message||'Please try again.');msg.classList.remove('hidden');}
  finally{button.disabled=false;button.textContent='Send booking request →';}
 });
})();
