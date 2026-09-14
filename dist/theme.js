(()=>{
 const media=matchMedia('(prefers-color-scheme: dark)');
 let preference='system';try{const saved=localStorage.getItem('cluster-atlas-theme');if(saved==='light'||saved==='dark')preference=saved;}catch{}
 const apply=()=>{const theme=preference==='system'?(media.matches?'dark':'light'):preference;document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;};
 apply();media.addEventListener('change',apply);
 const mount=()=>{const select=document.createElement('select');select.className='theme-toggle';select.setAttribute('aria-label','Color theme');select.innerHTML='<option value="system">System theme</option><option value="light">Light theme</option><option value="dark">Dark theme</option>';select.value=preference;select.onchange=()=>{preference=select.value;try{if(preference==='system')localStorage.removeItem('cluster-atlas-theme');else localStorage.setItem('cluster-atlas-theme',preference);}catch{}apply();};document.querySelector('header').append(select);};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
