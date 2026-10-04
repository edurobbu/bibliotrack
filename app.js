(() => {
  const STORE = 'biblioteca-in-fiore-v1';
  const samples = [
    {id:'sample-little-women',title:'Piccole donne',author:'Louisa May Alcott',pages:480,read:128,status:'reading',coverColor:'#e8c7b8',coverAccent:'#bd786b',flower:'✿'},
    {id:'sample-secret-garden',title:'Il giardino segreto',author:'Frances Hodgson Burnett',pages:320,read:96,status:'reading',coverColor:'#515b49',coverAccent:'#c4b17e',flower:'✿'},
    {id:'sample-room',title:'Una stanza tutta per sé',author:'Virginia Woolf',pages:160,read:42,status:'reading',coverColor:'#bd796b',coverAccent:'#f1d9c7',flower:'❀'}
  ];
  let books = loadBooks();
  let activeFilter = 'all';
  let timerDuration = 25 * 60;
  let secondsLeft = timerDuration;
  let timerInterval = null;
  let timerRunning = false;
  let activeBookId = null;
  let toastTimeout;
  const $ = s => document.querySelector(s);
  const bookGrid = $('#bookGrid');

  function loadBooks(){ try { const raw=localStorage.getItem(STORE); return raw ? JSON.parse(raw) : samples.slice(); } catch { return samples.slice(); } }
  function saveBooks(){ localStorage.setItem(STORE, JSON.stringify(books)); }
  function escapeHtml(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function percentage(book){return book.pages ? Math.min(100,Math.round((book.read/book.pages)*100)) : 0;}
  function statusText(s){return s==='done'?'Completato':s==='want'?'Da leggere':'In lettura';}
  function render(){
    const list=activeFilter==='all'?books:books.filter(b=>b.status===activeFilter);
    bookGrid.innerHTML=list.map(book=>{
      const pct=percentage(book), cover=book.coverId?`https://covers.openlibrary.org/b/id/${encodeURIComponent(book.coverId)}-M.jpg`:'';
      return `<article class="book-card" data-id="${escapeHtml(book.id)}"><span class="status-label ${book.status==='done'?'done':''}">${statusText(book.status)}</span><button class="book-menu" aria-label="Aggiorna ${escapeHtml(book.title)}" title="Aggiorna lettura">···</button><div class="cover-wrap"><div class="cover" style="background:linear-gradient(145deg,${escapeHtml(book.coverColor||'#e8c7b8')},${escapeHtml(book.coverAccent||'#f4e4d9')})">${cover?`<img src="${cover}" alt="Copertina di ${escapeHtml(book.title)}" style="width:100%;height:100%;object-fit:cover" onerror="this.remove()">`:''}<span class="cover-title">${escapeHtml(book.title)}</span><span class="cover-flower" aria-hidden="true">${escapeHtml(book.flower||'✿')}</span></div></div><h3 class="book-title">${escapeHtml(book.title)}</h3><p class="book-author">${escapeHtml(book.author||'Autore non indicato')}</p><div class="progress-line" role="progressbar" aria-label="Progresso ${escapeHtml(book.title)}" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><div class="progress-fill" style="width:${pct}%"></div></div><div class="book-meta"><span>${Number(book.read)||0} / ${Number(book.pages)||'—'} pagine</span><span>${book.pages?pct+'%':''}</span></div></article>`;
    }).join('');
    $('#allCount').textContent=books.length;
    $('#emptyState').classList.toggle('hidden',list.length!==0);
    bookGrid.classList.toggle('hidden',list.length===0);
    updateStats();
  }
  function updateStats(){
    $('#statBooks').textContent=books.length;
    $('#statPages').textContent=books.reduce((n,b)=>n+(Number(b.read)||0),0).toLocaleString('it-IT');
    $('#statDone').textContent=books.filter(b=>b.status==='done').length;
  }
  function showToast(message){const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>t.classList.remove('show'),2600);}
  function setView(view){
    document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
    const stats=view==='stats';
    $('#searchInput').closest('.search-bar').classList.toggle('hidden',stats);
    $('#shelfTitle').closest('.section-heading-row').classList.toggle('hidden',stats);
    $('#shelfEyebrow').classList.toggle('hidden',stats);
    $('#filterRow').classList.toggle('hidden',stats);
    bookGrid.classList.toggle('hidden',stats||books.length===0);
    $('#emptyState').classList.toggle('hidden',stats||books.filter(b=>activeFilter==='all'||b.status===activeFilter).length>0);
    $('#searchResults').classList.add('hidden');
    $('#statsView').classList.toggle('hidden',!stats);
  }
  function setFilter(filter){activeFilter=filter;document.querySelectorAll('.chip').forEach(b=>b.classList.toggle('selected',b.dataset.filter===filter));$('#shelfTitle').textContent=filter==='all'?'La tua libreria':filter==='reading'?'Sto leggendo':filter==='want'?'Da leggere':'Completati';render();}
  function openBookDialog(){ $('#bookDialog').showModal(); $('#dialogResults').innerHTML=''; $('#dialogSearch').value=$('#searchInput').value.trim(); setTimeout(()=>$('#dialogSearch').focus(),50); }
  async function searchBooks(query,target){
    const q=query.trim(); if(!q)return;
    target.innerHTML='<p class="search-status">Cerco nei cataloghi…</p>';
    const fields='key,title,author_name,first_publish_year,number_of_pages_median,cover_i,isbn,publisher,edition_count';
    const makeUrl=(base,params)=>`${base}?${new URLSearchParams(params)}`;
    const requests=[
      fetch(makeUrl('https://openlibrary.org/search.json',{q,limit:'12',fields})).then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>(data.docs||[]).map(d=>({id:`ol-${d.key}`,key:d.key,title:d.title,authors:d.author_name||[],year:d.first_publish_year||null,pages:d.number_of_pages_median||0,isbn:(d.isbn||[])[0]||null,publisher:(d.publisher||[])[0]||null,coverId:d.cover_i||null,coverUrl:d.cover_i?`https://covers.openlibrary.org/b/id/${encodeURIComponent(d.cover_i)}-M.jpg`:null,source:'Open Library',editionCount:d.edition_count||0}))),
      fetch(makeUrl('https://openlibrary.org/search.json',{author:q,limit:'12',fields})).then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>(data.docs||[]).map(d=>({id:`ol-${d.key}`,key:d.key,title:d.title,authors:d.author_name||[],year:d.first_publish_year||null,pages:d.number_of_pages_median||0,isbn:(d.isbn||[])[0]||null,publisher:(d.publisher||[])[0]||null,coverId:d.cover_i||null,coverUrl:d.cover_i?`https://covers.openlibrary.org/b/id/${encodeURIComponent(d.cover_i)}-M.jpg`:null,source:'Open Library',editionCount:d.edition_count||0}))),
      fetch(makeUrl('https://www.googleapis.com/books/v1/volumes',{q,printType:'books',maxResults:'12',orderBy:'relevance'})).then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>(data.items||[]).map(d=>googleRecord(d))),
      fetch(makeUrl('https://www.googleapis.com/books/v1/volumes',{q:`inauthor:${q}`,printType:'books',maxResults:'12',orderBy:'relevance'})).then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>(data.items||[]).map(d=>googleRecord(d)))
    ];
    function googleRecord(d){
      const v=d.volumeInfo||{};const ids=v.industryIdentifiers||[];const image=v.imageLinks?.thumbnail||v.imageLinks?.smallThumbnail||null;
      return {id:`gb-${d.id}`,key:d.id,title:v.title||'Titolo non disponibile',authors:v.authors||[],year:v.publishedDate||null,pages:v.pageCount||0,isbn:ids.find(x=>x.type==='ISBN_13')?.identifier||ids.find(x=>x.type==='ISBN_10')?.identifier||null,publisher:v.publisher||null,coverUrl:image?image.replace(/^http:/,'https:'):null,coverId:null,source:'Google Books',editionCount:0};
    }
    try{
      const settled=await Promise.allSettled(requests);let records=[];
      for(const result of settled)if(result.status==='fulfilled')records.push(...result.value);
      const merged=[];const seen=new Map();
      for(const item of records){
        const isbn=(item.isbn||'').replace(/[^0-9X]/gi,'').toUpperCase();
        const fallback=`${item.title.toLowerCase().replace(/[^a-z0-9à-ÿ]/gi,'')}|${item.authors.join('|').toLowerCase()}`;
        const identity=isbn?`isbn:${isbn}`:`title:${fallback}`;
        const existing=seen.get(identity);
        if(!existing){seen.set(identity,item);merged.push(item);continue;}
        existing.coverUrl=item.coverUrl||existing.coverUrl;
        existing.coverId=item.coverId||existing.coverId;
        existing.pages=existing.pages||item.pages;
        existing.isbn=existing.isbn||item.isbn;
        existing.publisher=existing.publisher||item.publisher;
        existing.year=existing.year||item.year;
        existing.authors=existing.authors.length?existing.authors:item.authors;
        existing.source=existing.source.includes(item.source)?existing.source:`${existing.source} + ${item.source}`;
      }
      records=merged.slice(0,24);
      if(!records.length){target.innerHTML='<p class="search-status">Non ho trovato risultati nei cataloghi. Puoi inserirlo manualmente.</p>';return;}
      target.innerHTML=(target===$('#searchResults')?'<h3 class="search-results-heading">Risultati dai cataloghi</h3>':'')+records.map((d,i)=>{
        const detail=[d.authors.slice(0,2).join(', ')||'Autore non indicato',d.year,d.publisher,d.pages?`${d.pages} pagine`:null,d.isbn?`ISBN ${d.isbn}`:null].filter(Boolean).join(' · ');
        const img=d.coverUrl||'';
        return `<div class="${target===$('#searchResults')?'search-result':'dialog-result'}"><div class="result-cover placeholder">${img?`<img src="${escapeHtml(img)}" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.textContent='✿'">`:'✿'}</div><div class="result-info"><p class="result-title">${escapeHtml(d.title)}</p><p class="result-detail">${escapeHtml(detail)}</p><p class="result-source">${escapeHtml(d.source)}${d.editionCount>1?' · '+d.editionCount+' edizioni':''}</p></div><button type="button" class="result-add" data-result="${i}">Aggiungi</button></div>`;
      }).join('');
      target.querySelectorAll('.result-add').forEach(btn=>btn.addEventListener('click',()=>{
        const d=records[Number(btn.dataset.result)];
        if(d.isbn&&books.some(b=>(b.isbn||'').replace(/[^0-9X]/gi,'').toUpperCase()===d.isbn.replace(/[^0-9X]/gi,'').toUpperCase())){showToast('Questa edizione è già nella tua libreria.');return;}
        const colors=[['#e6c2b4','#f5e2d6'],['#59604d','#c4b27e'],['#bd796b','#f1d9c7'],['#c6ad9e','#f3e8dc']];
        const color=colors[Math.floor(Math.random()*colors.length)];
        books.unshift({id:`book-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,key:d.key,provider:d.source,title:d.title,author:d.authors.join(', '),pages:Number(d.pages)||0,read:0,status:'want',coverId:d.coverId||null,coverUrl:d.coverUrl||null,year:d.year||null,isbn:d.isbn||null,publisher:d.publisher||null,coverColor:color[0],coverAccent:color[1],flower:['✿','❀','✾'][Math.floor(Math.random()*3)]});
        saveBooks();render();$('#bookDialog').close();$('#searchInput').value='';$('#searchResults').classList.add('hidden');setFilter('all');setView('library');showToast('Libro aggiunto alla libreria.');
      }));
    }catch{target.innerHTML='<p class="search-status">La ricerca online non è disponibile al momento. Controlla la connessione o inserisci il libro manualmente.</p>';}
  }
  function openProgress(id){const book=books.find(b=>b.id===id);if(!book)return;activeBookId=id;$('#progressTitle').textContent=book.title;$('#progressMeta').textContent=[book.author||'Autore non indicato',book.year,book.publisher,book.isbn?`ISBN ${book.isbn}`:''].filter(Boolean).join(' · ')+(book.pages?` · ${book.pages} pagine`:'');$('#pageInput').value=book.read||0;$('#pageInput').max=book.pages||'';$('#statusSelect').value=book.status;$('#progressDialog').showModal();setTimeout(()=>$('#pageInput').focus(),50);}
  bookGrid.addEventListener('click',e=>{const card=e.target.closest('.book-card');if(card)openProgress(card.dataset.id);});
  $('#saveProgress').addEventListener('click',()=>{const b=books.find(x=>x.id===activeBookId);if(!b)return;const value=Math.max(0,Number($('#pageInput').value)||0);b.read=b.pages?Math.min(value,Number(b.pages)):value;b.status=$('#statusSelect').value;if(b.pages&&b.read>=b.pages){b.status='done';b.read=b.pages;}saveBooks();render();$('#progressDialog').close();showToast('Progresso aggiornato.');});
  $('#removeBook').addEventListener('click',()=>{books=books.filter(b=>b.id!==activeBookId);saveBooks();render();$('#progressDialog').close();showToast('Libro rimosso dalla libreria.');});
  $('#addBookBtn').addEventListener('click',openBookDialog);$('#emptySearch').addEventListener('click',openBookDialog);$('#quickSearch').addEventListener('click',openBookDialog);
  $('#dialogSearchBtn').addEventListener('click',()=>searchBooks($('#dialogSearch').value,$('#dialogResults')));
  $('#dialogSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();searchBooks(e.target.value,$('#dialogResults'));}});
  $('#searchInput').addEventListener('keydown',e=>{if(e.key==='Enter'){searchBooks(e.target.value,$('#searchResults'));$('#searchResults').classList.remove('hidden');}});
  $('#searchInput').addEventListener('input',e=>{if(!e.target.value.trim())$('#searchResults').classList.add('hidden');});
  $('#filterBtn').addEventListener('click',()=>{$('#filterRow').classList.toggle('hidden');});
  $('#manualToggle').addEventListener('click',()=>$('#manualForm').classList.toggle('hidden'));
  $('#manualForm').addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const pages=Math.max(0,Number(fd.get('pages'))||0);books.unshift({id:`manual-${Date.now()}`,title:String(fd.get('title')).trim(),author:String(fd.get('author')).trim(),pages,read:fd.get('status')==='done'?pages:0,status:fd.get('status'),coverColor:'#ddc0b3',coverAccent:'#f3e1d7',flower:'✿'});saveBooks();render();e.currentTarget.reset();$('#bookDialog').close();setFilter('all');setView('library');showToast('Libro aggiunto alla libreria.');});
  document.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>setFilter(b.dataset.filter)));
  document.querySelectorAll('.nav-link').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
  document.querySelectorAll('.duration').forEach(b=>b.addEventListener('click',()=>{if(timerRunning)return;document.querySelectorAll('.duration').forEach(x=>x.classList.remove('active'));b.classList.add('active');timerDuration=Number(b.dataset.minutes)*60;secondsLeft=timerDuration;updateTimer();}));
  function updateTimer(){const mins=Math.floor(secondsLeft/60),secs=secondsLeft%60;$('#timerDisplay').textContent=`${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;const ratio=secondsLeft/timerDuration;$('#ringProgress').style.strokeDashoffset=String(653.45*(1-ratio));$('#startLabel').textContent=timerRunning?'Pausa':(secondsLeft===timerDuration?'Avvia':'Riprendi');$('#timerCaption').textContent=secondsLeft===0?'bravissima, pausa meritata':'il tuo tempo di lettura';}
  $('#timerStart').addEventListener('click',()=>{if(timerRunning){clearInterval(timerInterval);timerRunning=false;updateTimer();return;}if(secondsLeft===0){secondsLeft=timerDuration;}timerRunning=true;updateTimer();timerInterval=setInterval(()=>{secondsLeft=Math.max(0,secondsLeft-1);updateTimer();if(secondsLeft===0){clearInterval(timerInterval);timerRunning=false;updateTimer();showToast('Sessione completata. È tempo di una pausa.');if('Notification'in window&&Notification.permission==='granted')new Notification('Sessione di lettura completata',{body:'È tempo di una pausa.'});}},1000);});
  $('#timerReset').addEventListener('click',()=>{clearInterval(timerInterval);timerRunning=false;secondsLeft=timerDuration;updateTimer();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&timerRunning)updateTimer();});
  setFilter('all');updateTimer();
})();
