(() => {
 const cfg=window.LCE_CONFIG||{},ready=cfg.SUPABASE_URL&&!cfg.SUPABASE_URL.includes('YOUR_')&&cfg.SUPABASE_ANON_KEY&&!cfg.SUPABASE_ANON_KEY.includes('YOUR_')&&window.supabase;
 const $=id=>document.getElementById(id),form=$('auth-form'),message=$('portal-message'),area=$('account-area');
 if(!ready){message.textContent='Client accounts need Supabase setup. Follow the SUPABASE-SETUP.md instructions included with this website.';message.classList.remove('hidden');form.querySelector('button').disabled=true;return;}
 const client=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);let mode='login';
 const show=(t)=>{message.textContent=t;message.classList.remove('hidden')};
 $('tab-login').onclick=()=>{mode='login';$('tab-login').classList.add('active');$('tab-signup').classList.remove('active');$('portal-heading').textContent='Sign in to your account'};
 $('tab-signup').onclick=()=>{mode='signup';$('tab-signup').classList.add('active');$('tab-login').classList.remove('active');$('portal-heading').textContent='Create your account'};
 async function loadBookings(user){area.classList.remove('hidden');form.classList.add('hidden');document.querySelector('.portal-tabs').classList.add('hidden');$('portal-heading').textContent='Welcome to your account';const target=$('my-bookings');target.textContent='Loading…';
  const {data,error}=await client.from('booking_requests').select('id,created_at,services,estimated_total,status,postcode').eq('user_id',user.id).order('created_at',{ascending:false});
  if(error){target.textContent='Could not load requests: '+error.message;return}
  if(!data.length){target.textContent='No booking requests are linked to this account yet.';return}
  target.innerHTML=data.map(b=>`<div class="basket-item"><span><b>${(b.services||[]).map(s=>s.name).join(', ')}</b><br><small>${new Date(b.created_at).toLocaleDateString('en-GB')} · ${b.postcode||''} · ${b.status}</small></span><b>£${Number(b.estimated_total||0).toFixed(2)}</b></div>`).join('');
 }
 form.addEventListener('submit',async e=>{e.preventDefault();const email=$('auth-email').value,password=$('auth-password').value;
  if(mode==='signup'){const {error}=await client.auth.signUp({email,password});if(error)show(error.message);else show('Account created. Check your email if confirmation is enabled, then sign in.');}
  else{const {data,error}=await client.auth.signInWithPassword({email,password});if(error)show(error.message);else loadBookings(data.user);}
 });
 $('signout').onclick=async()=>{await client.auth.signOut();location.reload()};
 client.auth.getSession().then(({data})=>{if(data.session)loadBookings(data.session.user)});
})();
