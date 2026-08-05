/* حاسبة معدل البكالوريا الجزائرية 2027 — منطق التطبيق (JavaScript) */
// ============================================================
// القسم 1: البيانات — الشعب، المعاملات، والمواد الاختيارية
// ============================================================
const BRANCH_STATUS = {
  "علوم تجريبية":"جديد",
  "رياضيات":"جديد",
  "هندسة":"جديد",
  "تسيير واقتصاد":"جديد",
  "لغات أجنبية":"جديد",
  "آداب وفلسفة":"جديد",
  "فنون":"جديد"
};

// جميع المعاملات أدناه مطابقة حرفيًا للجداول الرسمية للسنة الثالثة ثانوي
// (تم التحقق من مجموع كل شعبة مقابل "المجموع" الرسمي في كل جدول).
// مادتا التربية البدنية والأمازيغية مستثناتان من هذه القوائم لأنهما
// اختياريتان وتُعالَجان بشكل منفصل أدناه.
const BRANCHES = {
  "علوم تجريبية": [
    ["علوم الطبيعة والحياة",6],["رياضيات",5],["علوم فيزيائية",4],
    ["لغة إنجليزية",3],["لغة عربية",2],
    ["تاريخ",2],["علوم إسلامية",2]
  ],
  "رياضيات": [
    ["رياضيات",8],["علوم فيزيائية",6],["إعلام آلي",3],
    ["لغة إنجليزية",3],["علوم الطبيعة والحياة",2],
    ["تاريخ",2],["علوم إسلامية",2]
  ],
  "هندسة": [
    ["تكنولوجيا",7],["رياضيات",5],["علوم فيزيائية",4],
    ["إعلام آلي",3],["لغة إنجليزية",3],
    ["تاريخ",2],["علوم إسلامية",2]
  ],
  "لغات أجنبية": [
    ["لغة اسبانية، ألمانية، إيطالية",6],
    ["لغة إنجليزية",4],["لغة فرنسية",4],["لغة عربية",2],
    ["تاريخ وجغرافيا",2],["علوم إسلامية",2]
  ],
  "آداب وفلسفة": [
    ["لغة عربية",7],["فلسفة",6],["تاريخ وجغرافيا",4],
    ["لغة إنجليزية",3],["لغة فرنسية",2],
    ["علوم إسلامية",2]
  ],
  "فنون": [
    ["فنون 1",6],["فنون 2",5],["لغة عربية",4],
    ["لغة إنجليزية",2],["لغة فرنسية",2],
    ["تاريخ وجغرافيا",2],["علوم إسلامية",2]
  ],
  "تسيير واقتصاد": [
    ["تسيير محاسبي ومالي",6],["اقتصاد ومناجمنت",4],
    ["رياضيات",3],["لغة إنجليزية",3],["تاريخ وجغرافيا",3],
    ["قانون",2],["لغة عربية",2],["علوم إسلامية",2]
  ]
};

const TAMAZIGHT_COEF = {
  "علوم تجريبية":2, "آداب وفلسفة":3, "لغات أجنبية":2, "فنون":3,
  "تسيير واقتصاد":2, "default":2
};
const TAMAZIGHT_AVAILABLE = {
  "علوم تجريبية":true, "تسيير واقتصاد":true,
  "آداب وفلسفة":true, "لغات أجنبية":true, "فنون":true,
  "رياضيات":false, "هندسة":false
};
// التربية البدنية والرياضية: اختيارية لكل الشعب، معاملها 1 في جميع الجداول
const PE_COEF = 1;

// ============================================================
// القسم 2: الحالة العامة للتطبيق (State)
// ============================================================
let currentBranch = "علوم تجريبية";
let marks = {};
let includeTamazight = false, tamazightMark = "";
let includePE = false, peMark = "";

// حفظ واسترجاع العلامات تلقائيًا (localStorage) حتى لا تضيع عند تحديث الصفحة
const STORAGE_KEY = 'bacCalc2027_state';
function saveState(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentBranch, marks, includeTamazight, tamazightMark, includePE, peMark
    }));
  }catch(e){ /* التخزين غير متاح (وضع خاص مثلًا) — لا داعي لإيقاف التطبيق */ }
}
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return;
    const s = JSON.parse(raw);
    if(s.currentBranch && BRANCHES[s.currentBranch]) currentBranch = s.currentBranch;
    if(s.marks && typeof s.marks === 'object') marks = s.marks;
    includeTamazight = !!s.includeTamazight;
    tamazightMark = s.tamazightMark || '';
    includePE = !!s.includePE;
    peMark = s.peMark || '';
  }catch(e){ /* بيانات محفوظة تالفة — نبدأ بحالة فارغة بأمان */ }
}

// ============================================================
// القسم 3: مراجع عناصر الصفحة (DOM references)
// ============================================================
const picker = document.getElementById('branchPicker');
const cardsWrap = document.getElementById('cardsWrap');
const avgVal = document.getElementById('avgVal');
const ringFg = document.getElementById('ringFg');
const verdict = document.getElementById('verdict');
const verdictSub = document.getElementById('verdictSub');
const sumCoefEl = document.getElementById('sumCoef');
const sumPtsEl = document.getElementById('sumPts');
const percentLabelEl = document.getElementById('percentLabel');
const branchNameLabel = document.getElementById('branchNameLabel');
const gradeBadge = document.getElementById('gradeBadge');
const progressFill = document.getElementById('progressFill');
const progressLabel = document.getElementById('progressLabel');
const progressCount = document.getElementById('progressCount');
const missingBanner = document.getElementById('missingBanner');
const resultCard = document.querySelector('.result');
let wasComplete = false; // يتتبع ما إذا كان المعدل مكتملاً في آخر استدعاء لـ compute()، لتشغيل حركة الظهور مرة واحدة فقط

// ============================================================
// القسم 4: دوال العرض (Render) — رسم الواجهة من البيانات
// ============================================================
function renderPicker(){
  picker.innerHTML = '';
  Object.keys(BRANCHES).forEach(name=>{
    const status = BRANCH_STATUS[name];
    const b = document.createElement('button');
    b.className = 'chip' + (name===currentBranch ? ' active':'');
    b.innerHTML = `<span class="dot ${status==='جديد'?'new':'old'}"></span>${name}`;
    b.title = status==='جديد' ? 'معاملات محدّثة (الإصلاح الجديد)' : 'معاملات 2026 الحالية - بانتظار الجدول الجديد';
    b.onclick = ()=>{
      currentBranch = name; marks = {};
      includeTamazight=false; tamazightMark='';
      includePE=false; peMark='';
      renderPicker(); renderCards(); compute();
    };
    picker.appendChild(b);
  });
}

function allFieldOrder(){
  // ترتيب التنقل التلقائي بين الحقول: المواد الإجبارية ثم الاختيارية المفعّلة
  const order = BRANCHES[currentBranch].map(s => s[0]);
  if(includePE) order.push('__pe__');
  if(TAMAZIGHT_AVAILABLE[currentBranch] && includeTamazight) order.push('__tz__');
  return order;
}

function focusNext(currentKey){
  const order = allFieldOrder();
  const idx = order.indexOf(currentKey);
  if(idx > -1 && idx < order.length - 1){
    const nextKey = order[idx+1];
    const sel = nextKey === '__pe__' ? '#peMark' : (nextKey === '__tz__' ? '#tamazightMark' : `input[data-subject="${CSS.escape(nextKey)}"]`);
    const el = document.querySelector(sel);
    if(el) el.focus();
  }
}

// ============================================================
// القسم 5: أدوات مساعدة — رسائل التنبيه والتحقق من صحة العلامة
// ============================================================
let toastTimer;
function showToast(msg, type){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' '+type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> t.classList.remove('show'), 2200);
}

// يحدد صلاحية العلامة المُدخلة دون تغيير القيمة التي كتبها المستخدم:
// 'empty' الحقل فارغ، 'invalid' خارج المدى 0-20، 'valid' علامة سليمة.
function getMarkState(raw){
  if(raw === '' || raw === undefined || raw === null) return 'empty';
  const v = parseFloat(raw);
  if(isNaN(v) || v < 0 || v > 20) return 'invalid';
  return 'valid';
}

// يربط حقل علامة بمنطق التحقق: يعرض تنبيهًا عند الدخول إلى حالة "غير صحيحة"
// (وليس عند كل ضغطة زر)، ولا يُعدّل القيمة المكتوبة أبدًا — القيم غير الصحيحة
// تُستبعد من الحساب فقط حتى يصححها المستخدم بنفسه.
function wireMarkValidation(input, card, onChange){
  let wasInvalid = false;
  input.addEventListener('input', e=>{
    const raw = e.target.value;
    const state = getMarkState(raw);
    input.classList.toggle('valid', state==='valid');
    input.classList.toggle('err', state==='invalid');
    if(card) card.classList.toggle('filled', state!=='empty');
    if(state==='invalid' && !wasInvalid){
      showToast('⚠️ العلامة يجب أن تكون بين 0 و 20', 'error');
    }
    wasInvalid = (state==='invalid');
    onChange(raw, state);
  });
}

function makeSubjectCard(name, coef){
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="card-left">
      <span class="subject-name">${name}</span>
      <span class="subject-pts" data-pts-for="${name}">—</span>
    </div>
    <div style="display:flex;align-items:center;gap:10px;">
      <span class="coef-pill">×${coef}</span>
      <div class="mark-field">
        <button type="button" class="field-clear" aria-label="مسح العلامة">×</button>
        <input type="number" inputmode="decimal" min="0" max="20" step="0.25" class="mark" data-subject="${name}" placeholder="أدخل العلامة">
      </div>
    </div>
  `;
  const inp = card.querySelector('input.mark');
  const ptsLabel = card.querySelector('.subject-pts');
  const clearBtn = card.querySelector('.field-clear');
  function updatePtsLabel(){
    if(getMarkState(inp.value) === 'valid'){
      ptsLabel.textContent = `= ${(parseFloat(inp.value)*coef).toFixed(2)} نقطة`;
    } else {
      ptsLabel.textContent = '—';
    }
  }
  function refreshClearBtn(){
    clearBtn.classList.toggle('show', inp.value !== '');
  }
  inp.value = marks[name] ?? '';
  if(inp.value !== '') card.classList.add('filled');
  updatePtsLabel();
  refreshClearBtn();
  wireMarkValidation(inp, card, (raw)=>{
    marks[name] = raw;
    updatePtsLabel();
    refreshClearBtn();
    compute();
  });
  clearBtn.addEventListener('click', ()=>{
    inp.value = '';
    inp.dispatchEvent(new Event('input'));
    inp.focus();
  });
  inp.addEventListener('keydown', e=>{
    if(e.key === 'Enter'){ e.preventDefault(); focusNext(name); }
  });
  return card;
}

function makeOptionalCard({key, title, sub, coef, checked, inputId, onToggle, onInput, currentVal}){
  const card = document.createElement('div');
  card.className = 'opt-card';
  card.innerHTML = `
    <div class="opt-head">
      <div>
        <div class="opt-title">${title} <span class="coef-pill">×${coef}</span></div>
        <div class="opt-sub">${sub}</div>
      </div>
      <label class="switch">
        <input type="checkbox" id="${key}-toggle" ${checked?'checked':''}>
        <span class="switch-track"></span>
      </label>
    </div>
    <div class="opt-body ${checked?'open':''}" id="${key}-body">
      <span class="opt-label-text">العلامة المحصّل عليها</span>
      <div class="mark-field">
        <button type="button" class="field-clear" aria-label="مسح العلامة">×</button>
        <input type="number" inputmode="decimal" min="0" max="20" step="0.25" class="mark" id="${inputId}" placeholder="أدخل العلامة">
      </div>
      <span class="subject-pts" id="${key}-pts">—</span>
    </div>
  `;
  const toggleInput = card.querySelector(`#${key}-toggle`);
  const body = card.querySelector(`#${key}-body`);
  const markInput = card.querySelector(`#${inputId}`);
  const ptsLabel = card.querySelector(`#${key}-pts`);
  const clearBtn = card.querySelector('.field-clear');
  markInput.value = currentVal;
  function updatePtsLabel(){
    if(getMarkState(markInput.value) === 'valid'){
      ptsLabel.textContent = `= ${(parseFloat(markInput.value)*coef).toFixed(2)} نقطة`;
    } else {
      ptsLabel.textContent = '—';
    }
  }
  function refreshClearBtn(){
    clearBtn.classList.toggle('show', markInput.value !== '');
  }
  updatePtsLabel();
  refreshClearBtn();

  toggleInput.addEventListener('change', e=>{
    onToggle(e.target.checked);
    body.classList.toggle('open', e.target.checked);
    if(e.target.checked){ setTimeout(()=> markInput.focus(), 320); }
    refreshClearBtn();
    compute();
  });

  clearBtn.addEventListener('click', ()=>{
    markInput.value = '';
    markInput.dispatchEvent(new Event('input'));
    markInput.focus();
  });

  markInput.addEventListener('keydown', e=>{
    if(e.key === 'Enter'){ e.preventDefault(); focusNext(key==='pe' ? '__pe__' : '__tz__'); }
  });
  wireMarkValidation(markInput, null, (raw)=>{
    onInput(raw);
    updatePtsLabel();
    refreshClearBtn();
    compute();
  });

  return card;
}

function renderCards(){
  cardsWrap.innerHTML = '';
  const subjects = BRANCHES[currentBranch];
  subjects.forEach(([name, coef], i)=>{
    const c = makeSubjectCard(name, coef);
    c.style.animationDelay = (i*0.04)+'s';
    cardsWrap.appendChild(c);
  });

  // بطاقة التربية البدنية (اختيارية لكل الشعب)
  const peCard = makeOptionalCard({
    key:'pe',
    title:'تربية بدنية ورياضية',
    sub:'اختيارية — فعّلها فقط إذا اجتزت اختبارها',
    coef: PE_COEF,
    checked: includePE,
    inputId:'peMark',
    currentVal: peMark,
    onToggle:(v)=>{ includePE=v; if(!v){ peMark=''; } },
    onInput:(v)=>{ peMark=v; }
  });
  peCard.style.animationDelay = (subjects.length*0.04)+'s';
  cardsWrap.appendChild(peCard);

  // بطاقة الأمازيغية (اختيارية لبعض الشعب فقط)
  if(TAMAZIGHT_AVAILABLE[currentBranch]){
    const tzCard = makeOptionalCard({
      key:'tz',
      title:'لغة أمازيغية',
      sub:'ⓘ مادة اختيارية تُختبر في ولايات معينة فقط — إن لم تجتزها اتركها معطّلة.',
      coef: TAMAZIGHT_COEF[currentBranch] || TAMAZIGHT_COEF.default,
      checked: includeTamazight,
      inputId:'tamazightMark',
      currentVal: tamazightMark,
      onToggle:(v)=>{ includeTamazight=v; if(!v){ tamazightMark=''; } },
      onInput:(v)=>{ tamazightMark=v; }
    });
    tzCard.style.animationDelay = ((subjects.length+1)*0.04)+'s';
    cardsWrap.appendChild(tzCard);
  }
}

// ============================================================
// القسم 6: منطق الحساب — المعادلة الرسمية لمعدل البكالوريا
// المعدل = مجموع (العلامة × المعامل) لكل مادة مُدخلة ÷ مجموع معاملاتها
// ============================================================
// يحدد التقدير النوعي (ممتاز/جيد جدًا/...) حسب سلم التقدير المعتمد جزائريًا
function getGradeTier(avg){
  if(avg >= 16) return {label:'ممتاز', cls:'success'};
  if(avg >= 14) return {label:'جيد جدًا', cls:'success'};
  if(avg >= 12) return {label:'جيد', cls:'primary'};
  if(avg >= 10) return {label:'مقبول', cls:'amber'};
  if(avg >= 8)  return {label:'دون المتوسط', cls:'danger'};
  return {label:'ضعيف', cls:'danger'};
}

function compute(){
  const subjects = BRANCHES[currentBranch];
  let sumCoef = 0, sumPts = 0, filled = 0;
  let totalFields = subjects.length + (includePE?1:0) + (TAMAZIGHT_AVAILABLE[currentBranch] && includeTamazight ? 1 : 0);
  const missingNames = [];

  subjects.forEach(([name, coef])=>{
    if(getMarkState(marks[name]) === 'valid'){
      const v = parseFloat(marks[name]);
      sumCoef += coef;
      sumPts += v * coef;
      filled++;
    } else {
      missingNames.push(name);
    }
  });

  if(includePE){
    if(getMarkState(peMark) === 'valid'){
      const v = parseFloat(peMark);
      sumCoef += PE_COEF;
      sumPts += v * PE_COEF;
      filled++;
    } else {
      missingNames.push('تربية بدنية ورياضية');
    }
  }

  if(TAMAZIGHT_AVAILABLE[currentBranch] && includeTamazight){
    const coef = TAMAZIGHT_COEF[currentBranch] || TAMAZIGHT_COEF.default;
    if(getMarkState(tamazightMark) === 'valid'){
      const v = parseFloat(tamazightMark);
      sumCoef += coef;
      sumPts += v * coef;
      filled++;
    } else {
      missingNames.push('لغة أمازيغية');
    }
  }

  // progress
  const pct = totalFields > 0 ? Math.round((filled/totalFields)*100) : 0;
  progressFill.style.width = pct + '%';
  progressLabel.textContent = pct + '%';
  progressCount.textContent = `${filled} من ${totalFields} مواد`;

  if(missingNames.length > 0 && filled > 0){
    missingBanner.className = 'missing-banner show';
    missingBanner.innerHTML = `⚠️ لم تُدخل بعد علامات: <b>${missingNames.join('، ')}</b> — لن يظهر المعدل النهائي حتى تكتمل جميع المواد.`;
  } else {
    missingBanner.className = 'missing-banner';
    missingBanner.textContent = '';
  }

  branchNameLabel.textContent = `شعبة: ${currentBranch}`;
  sumCoefEl.textContent = `المعاملات: ${sumCoef || '—'}`;
  sumPtsEl.textContent = `النقاط: ${sumCoef ? sumPts.toFixed(2) : '—'}`;
  percentLabelEl.textContent = `النسبة: ${sumCoef ? Math.round((sumPts/sumCoef/20)*100)+'%' : '—'}`;

  const circumference = 314;

  // الحالة 1: لا شيء أُدخل بعد
  if(filled === 0){
    avgVal.textContent = '--';
    ringFg.style.stroke = '#D1D5DB';
    ringFg.style.strokeDashoffset = circumference;
    verdict.textContent = 'أدخل علاماتك';
    verdict.style.color = 'var(--ink-soft)';
    verdictSub.textContent = 'ابدأ بإدخال العلامات في الأعلى وسيظهر معدلك بعد إكمال جميع المواد';
    gradeBadge.className = 'grade-badge';
    gradeBadge.textContent = '';
    lastResult = null;
    wasComplete = false;
    saveState();
    return;
  }

  // الحالة 2: الإدخال جارٍ لكنه غير مكتمل — لا يُحسب المعدل النهائي بعد
  if(filled < totalFields){
    const remaining = totalFields - filled;
    avgVal.textContent = pct + '%';
    ringFg.style.stroke = 'var(--amber)';
    ringFg.style.strokeDashoffset = circumference - (circumference*(pct/100));
    verdict.textContent = '⏳ لم يكتمل الإدخال بعد';
    verdict.style.color = 'var(--amber)';
    verdictSub.textContent = `أدخل علامة ${remaining} ${remaining===1?'مادة':'مواد'} متبقية لعرض معدلك النهائي.`;
    gradeBadge.className = 'grade-badge';
    gradeBadge.textContent = '';
    lastResult = null;
    wasComplete = false;
    saveState();
    return;
  }

  // الحالة 3: جميع المواد أُدخلت — يُحسب ويُعرض المعدل النهائي
  if(!wasComplete){
    resultCard.classList.remove('reveal');
    void resultCard.offsetWidth; // إعادة تشغيل الحركة حتى لو تكررت نفس الحالة
    resultCard.classList.add('reveal');
  }
  wasComplete = true;

  const avg = sumPts / sumCoef;
  avgVal.textContent = avg.toFixed(2);
  const ratio = Math.max(0, Math.min(1, avg/20));
  ringFg.style.strokeDashoffset = circumference - (circumference*ratio);

  const tier = getGradeTier(avg);
  gradeBadge.className = 'grade-badge show ' + tier.cls;
  gradeBadge.textContent = tier.label;

  if(avg >= 10){
    ringFg.style.stroke = 'var(--success)';
    verdict.style.color = 'var(--success)';
    if(avg >= 18){ verdict.textContent = 'تفوق استثنائي! 🌟'; verdictSub.textContent = 'معدل رائع جدًا — أنت من الأوائل، واصل هذا المستوى!'; }
    else if(avg >= 16){ verdict.textContent = 'امتياز! 🎉'; verdictSub.textContent = 'أداء ممتاز، معدلك يفتح لك أبواب التخصصات المرغوبة.'; }
    else if(avg >= 14){ verdict.textContent = 'جيد جدًا 👏'; verdictSub.textContent = 'أنت قريب جدًا من التميز، دفعة أخيرة ويصبح ممتازًا.'; }
    else { verdict.textContent = 'ناجح(ة) بإذن الله ✅'; verdictSub.textContent = 'المعدل يفوق أو يساوي 10/20 — مبروك مسبقًا!'; }
  } else {
    ringFg.style.stroke = 'var(--danger)';
    verdict.style.color = 'var(--danger)';
    if(avg >= 8){ verdict.textContent = 'قريب جدًا من النجاح'; verdictSub.textContent = 'فرق بسيط يفصلك عن 10/20 — بمجهود إضافي ستتجاوزه بإذن الله.'; }
    else { verdict.textContent = 'دون معدل النجاح'; verdictSub.textContent = 'لا تفقد الأمل، لا يزال أمامك وقت للمراجعة والتحسّن.'; }
  }

  lastResult = { branch: currentBranch, avg: avg.toFixed(2), sumPts: sumPts.toFixed(2), sumCoef, pass: avg>=10, percent: Math.round((avg/20)*100), tier: tier.label };
  saveState();
}

// ============================================================
// القسم 7: أزرار الإجراءات — إعادة تعيين / نسخ النتيجة / مشاركة
// ============================================================
let lastResult = null;

// تبديل الوضع الليلي/النهاري، مع حفظ التفضيل ليُطبَّق تلقائيًا في المرات القادمة
const THEME_KEY = 'bacCalc2027_theme';
const themeToggleBtn = document.getElementById('themeToggle');
function applyThemeIcon(){
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
  themeToggleBtn.title = isDark ? 'الوضع النهاري' : 'الوضع الليلي';
}
themeToggleBtn.addEventListener('click', ()=>{
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if(isDark){
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem(THEME_KEY, 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem(THEME_KEY, 'dark');
  }
  applyThemeIcon();
});
applyThemeIcon();

document.getElementById('resetBtn').addEventListener('click', ()=>{
  marks = {}; includeTamazight = false; tamaz
