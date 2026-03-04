(function(){
  'use strict';
  var overlay=document.getElementById('global-search-overlay');
  var input=document.getElementById('gs-input');
  var results=document.getElementById('gs-results');
  var btn=document.getElementById('nav-search-btn');
  if(!overlay||!input||!results)return;
  var products=null;
  var inSubdir=location.pathname.split('/').filter(Boolean).length>1||/\/products\//.test(location.pathname);
  var prefix=inSubdir?'../':'';

  function load(cb){
    if(products)return cb();
    var x=new XMLHttpRequest();
    x.open('GET',prefix+'products.json');
    x.onload=function(){try{products=JSON.parse(x.responseText)}catch(e){products=[]}cb()};
    x.onerror=function(){products=[];cb()};
    x.send();
  }

  var closeEl=document.getElementById('gs-close');

  function open(){overlay.classList.add('open');document.body.style.overflow='hidden';setTimeout(function(){input.focus()},100)}
  function close(){overlay.classList.remove('open');document.body.style.overflow='';input.value='';results.innerHTML=''}

  if(btn)btn.addEventListener('click',function(){load(open)});
  if(closeEl)closeEl.addEventListener('click',close);
  document.addEventListener('keydown',function(e){
    if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();load(open)}
    if(e.key==='Escape'&&overlay.classList.contains('open'))close();
  });
  overlay.addEventListener('click',function(e){if(e.target===overlay)close()});

  input.addEventListener('input',function(){
    var q=this.value.trim().toLowerCase();
    if(!q){results.innerHTML='<div class="gs-hint">Type to search plants & creations…</div>';return}
    if(!products||!products.length){results.innerHTML='<div class="gs-empty">No products available</div>';return}
    var matches=products.filter(function(p){
      return p.name.toLowerCase().indexOf(q)!==-1||(p.desc||'').toLowerCase().indexOf(q)!==-1||(p.category||'').toLowerCase().indexOf(q)!==-1
    }).slice(0,8);
    if(!matches.length){results.innerHTML='<div class="gs-empty">No results for "'+q.replace(/[<>&"]/g,'')+ '"</div>';return}
    results.innerHTML=matches.map(function(p){
      var href=prefix+'products/'+p.id+'.html';
      var img=prefix+(p.img||'assets/opt/placeholder.webp');
      return '<a href="'+href+'" class="gs-result-item"><img src="'+img+'" alt="" class="gs-result-img" loading="lazy"><div class="gs-result-info"><div class="gs-result-name">'+p.name+'</div><div class="gs-result-meta"><span>'+(p.price||'')+'</span><span>'+(p.category||'')+'</span></div></div></a>'
    }).join('');
  });

  var form=document.getElementById('newsletter-form');
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var email=form.querySelector('input[type="email"]').value.trim();
      if(!email)return;
      var key='malka_newsletter';var list;
      try{list=JSON.parse(localStorage.getItem(key))||[]}catch(x){list=[]}
      if(list.indexOf(email)!==-1){msg(form,'Already subscribed!','success');return}
      list.push(email);localStorage.setItem(key,JSON.stringify(list));
      form.querySelector('input[type="email"]').value='';
      msg(form,'Thank you for subscribing!','success');
    });
  }
  function msg(f,t,c){
    var m=f.parentElement.querySelector('.newsletter-msg');
    if(!m){m=document.createElement('p');m.className='newsletter-msg';f.parentElement.appendChild(m)}
    m.textContent=t;m.className='newsletter-msg newsletter-msg--'+c;
    setTimeout(function(){m.textContent=''},5000);
  }
})();
