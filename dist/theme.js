(()=>{
 let theme='light';try{theme=localStorage.getItem('cluster-atlas-theme')==='dark'?'dark':'light';}catch{}
 const button=document.createElement('button');button.className='theme-toggle';
 const paint=()=>{document.documentElement.dataset.theme=theme;button.textContent=theme==='light'?'◐ Dark':'◑ Light';button.setAttribute('aria-label','Switch to '+(theme==='light'?'dark':'light')+' theme');button.setAttribute('aria-pressed',String(theme==='dark'));};
 button.onclick=()=>{theme=theme==='light'?'dark':'light';try{localStorage.setItem('cluster-atlas-theme',theme);}catch{}paint();};
 document.querySelector('header').append(button);paint();
})();
