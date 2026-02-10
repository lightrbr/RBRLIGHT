const fmtEUR = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

let DATA = [];
let LAST_QUERY = '';

const el = (id) => document.getElementById(id);

function normalize(s){
  return (s || '').toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
}

function hasUrl(s){
  return /^https?:\/\//i.test((s||'').trim());
}

function initials(name){
  const words = (name||'').split(/\s+/).filter(Boolean);
  if (!words.length) return '★';
  return (words[0][0] + (words[1]?.[0]||'')).toUpperCase();
}

function scoreItem(item, q){
  if(!q) return 0;
  const hay = normalize([item.item, item.product, item.details, item.media].join(' '));
  const terms = q.split(/\s+/).filter(Boolean);
  let score = 0;
  for(const t of terms){
    if(hay.includes(t)) score += 10;
    // bonus if it matches code or start of product
    if(normalize(item.item).includes(t)) score += 25;
    if(normalize(item.product).startsWith(t)) score += 12;
  }
  return score;
}

function render(list){
  const grid = el('grid');
  grid.innerHTML = '';

  el('count').textContent = `${list.length} prodotti`;

  for(const it of list){
    const card = document.createElement('article');
    card.className = 'card';

    const thumb = document.createElement('div');
    thumb.className = 'thumb';

    // Photo: if it's a URL or a relative file (assets/..), show it; otherwise placeholder.
    const photo = (it.photo||'').trim();
    if(photo && (hasUrl(photo) || photo.startsWith('assets/'))){
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.alt = it.product || it.item || 'Foto prodotto';
      img.src = photo;
      thumb.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'ph';
      ph.textContent = initials(it.product || it.item);
      thumb.appendChild(ph);
    }

    const body = document.createElement('div');
    body.className = 'card-body';

    const top = document.createElement('div');
    top.className = 'card-top';

    const left = document.createElement('div');
    left.innerHTML = `<div class="name">${escapeHtml(it.product || '—')}</div>
                      <div class="code">${escapeHtml(it.item || '')}</div>`;

    const right = document.createElement('div');
    right.className = 'pills';
    right.appendChild(pill(it.price != null ? fmtEUR.format(it.price) : 'Prezzo n.d.', it.price != null ? '' : 'muted'));
    right.appendChild(pill(it.quantity != null ? `Q.tà: ${it.quantity}` : 'Q.tà: n.d.', it.quantity != null ? '' : 'muted'));

    top.appendChild(left);
    top.appendChild(right);

    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'Apri scheda';
    btn.addEventListener('click', () => openDialog(it));
    actions.appendChild(btn);

    body.appendChild(top);
    body.appendChild(actions);

    card.appendChild(thumb);
    card.appendChild(body);
    grid.appendChild(card);
  }
}

function pill(text, extraClass=''){
  const s = document.createElement('span');
  s.className = `pill ${extraClass}`.trim();
  s.textContent = text;
  return s;
}

function escapeHtml(str){
  return (str||'').toString()
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

function openDialog(it){
  el('dlgTitle').textContent = it.product || '—';
  el('dlgCode').textContent = it.item || '';
  el('dlgPrice').textContent = it.price != null ? fmtEUR.format(it.price) : 'Prezzo n.d.';
  el('dlgQty').textContent = it.quantity != null ? `Q.tà: ${it.quantity}` : 'Q.tà: n.d.';

  el('dlgDetails').textContent = it.details || '—';

  // media
  const m = (it.media||'').trim();
  const wrap = el('dlgMediaWrap');
  if(m){
    wrap.style.display = '';
    el('dlgMedia').textContent = m;
  }else{
    wrap.style.display = 'none';
  }

  // image
  const photo = (it.photo||'').trim();
  const box = el('dlgImg');
  box.innerHTML = '';
  if(photo && (hasUrl(photo) || photo.startsWith('assets/'))){
    const img = document.createElement('img');
    img.alt = it.product || it.item || 'Foto prodotto';
    img.src = photo;
    box.appendChild(img);
  }else{
    const ph = document.createElement('div');
    ph.className = 'ph';
    ph.textContent = initials(it.product || it.item);
    box.appendChild(ph);
  }

  el('dlg').showModal();
}

function applyFilters(){
  const qRaw = el('q').value || '';
  const q = normalize(qRaw.trim());
  LAST_QUERY = q;

  const onlyWithPrice = el('onlyWithPrice').checked;
  const sort = el('sort').value;

  let list = DATA.slice();

  if(q){
    list = list
      .map(it => ({...it, _score: scoreItem(it, q)}))
      .filter(it => it._score > 0);
  }

  if(onlyWithPrice){
    list = list.filter(it => it.price != null);
  }

  // sorting
  if(sort === 'az'){
    list.sort((a,b) => (a.product||'').localeCompare(b.product||'', 'it', {sensitivity:'base'}));
  } else if(sort === 'za'){
    list.sort((a,b) => (b.product||'').localeCompare(a.product||'', 'it', {sensitivity:'base'}));
  } else if(sort === 'priceAsc'){
    list.sort((a,b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  } else if(sort === 'priceDesc'){
    list.sort((a,b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
  } else { // relevance
    if(q){
      list.sort((a,b) => (b._score||0) - (a._score||0));
    } else {
      // default: by code
      list.sort((a,b) => (a.item||'').localeCompare(b.item||'', 'it', {numeric:true, sensitivity:'base'}));
    }
  }

  render(list);
}

async function init(){
  const res = await fetch('./data.json', {cache:'no-store'});
  DATA = await res.json();

  // basic cleanup: drop completely empty rows
  DATA = DATA.filter(x => (x.item||x.product||x.details||x.media||x.photo));

  el('q').addEventListener('input', applyFilters);
  el('sort').addEventListener('change', applyFilters);
  el('onlyWithPrice').addEventListener('change', applyFilters);
  el('reset').addEventListener('click', () => {
    el('q').value = '';
    el('sort').value = 'relevance';
    el('onlyWithPrice').checked = false;
    applyFilters();
  });

  applyFilters();
}

init();
