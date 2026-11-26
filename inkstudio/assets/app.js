/* =========================================================
   墨研工坊 · 原型逻辑
   ========================================================= */

/* ---------- 视图路由 ---------- */
const VIEWS = ['login','select','quiz','profile'];
function goto(e, name){
  if (e) e.preventDefault();
  VIEWS.forEach(v=>{
    document.querySelector(`[data-view="${v}"]`).hidden = (v !== name);
  });
  window.scrollTo({top:0, behavior:'instant'});
  if (name === 'quiz') mountQuiz();
  if (name === 'profile') renderProfile();
  renderAppNav();
  stripFullWidthBrackets(document.body);
}
// 初始视图
goto(null, 'login');

/* ---------- 今天日期 ---------- */
(function(){
  const el = document.getElementById('today');
  if (!el) return;
  const d = new Date();
  const w = ['日','一','二','三','四','五','六'][d.getDay()];
  el.textContent = `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} · 周${w}`;
})();

/* ---------- 选择页：学校 & 专业 ---------- */
const STATE = { school:'', major:'' };
const PRACTICE_KEY = 'inkstudio.practice.records';
const ARGUMENT_KEY = 'inkstudio.argument.library';
const MISTAKE_KEY = 'inkstudio.mistake.items';

function practiceRecords(){
  try { return JSON.parse(localStorage.getItem(PRACTICE_KEY) || '[]'); }
  catch { return []; }
}

function savePracticeRecords(records){
  localStorage.setItem(PRACTICE_KEY, JSON.stringify(records.slice(0, 200)));
}

function recordPractice(action, item){
  const records = practiceRecords();
  records.unshift({
    time: Date.now(),
    type: Q.type,
    title: item?.title || item?.prompt?.join('') || '填空题',
    action
  });
  savePracticeRecords(records);
}

function readStore(key, fallback){
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

function writeStore(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

function argumentItems(){
  return readStore(ARGUMENT_KEY, [
    {
      id: 'seed-tradition-1',
      theme: '传统文化',
      point: '传统文化不是符号复古，而是造物观与当代设计方法的转译。',
      evidence: '故宫文创通过纹样、色彩和器物语义的再设计，使传统资源进入年轻人的日常消费与审美经验。',
      time: Date.now() - 86400000
    },
    {
      id: 'seed-tech-1',
      theme: '科技设计',
      point: '科技设计的价值不止于效率提升，更在于重构人与信息、环境和服务的关系。',
      evidence: '智能家居、可穿戴设备和无障碍交互都说明技术需要通过设计转化为可理解、可信任的体验。',
      time: Date.now() - 43200000
    }
  ]);
}

function saveArgumentItems(items){ writeStore(ARGUMENT_KEY, items.slice(0, 300)); }

function mistakeItems(){ return readStore(MISTAKE_KEY, []); }
function saveMistakeItems(items){ writeStore(MISTAKE_KEY, items.slice(0, 200)); }

function itemIdentity(item){
  return `${Q.custom ? 'custom' : 'bank'}-${Q.type}-${Q.idx}-${itemTitle(item)}`;
}

function itemTitle(item){
  if (!item) return '未命名题目';
  return item.title || item.prompt?.join('') || '填空题';
}

function isMistakeItem(item){
  const id = itemIdentity(item);
  return mistakeItems().some(m=>m.id === id);
}

function toggleCurrentMistake(){
  const item = currentItem();
  const id = itemIdentity(item);
  const list = mistakeItems();
  const idx = list.findIndex(m=>m.id === id);
  if (idx >= 0) list.splice(idx, 1);
  else list.unshift({
    id,
    type: Q.type,
    title: itemTitle(item),
    source: Q.custom ? '自定义题目' : '题库练习',
    time: Date.now()
  });
  saveMistakeItems(list);
  renderQuiz();
}

function bindPicker(group){
  const list = document.querySelector(`[data-group="${group}"]`);
  if (!list) return;
  list.addEventListener('click', e=>{
    const btn = e.target.closest('.opt');
    if (!btn) return;
    list.querySelectorAll('.opt').forEach(b=>b.classList.remove('is-on'));
    btn.classList.add('is-on');
    STATE[group] = btn.dataset.value;
    syncSelect();
  });
}
bindPicker('school');
bindPicker('major');

function syncSelect(){
  document.querySelectorAll('[data-bind="school-out"]').forEach(el=> el.textContent = STATE.school || '—');
  document.querySelectorAll('[data-bind="major-out"]').forEach(el=> el.textContent = STATE.major  || '—');
  const sh = document.querySelector('[data-bind="school-hint"]');
  const mh = document.querySelector('[data-bind="major-hint"]');
  if (sh) sh.textContent = STATE.school ? '一 · 已选定' : '未选择';
  if (mh) mh.textContent = STATE.major  ? '二 · 已选定' : '未选择';

  const ready = STATE.school && STATE.major;
  const btn = document.getElementById('confirmSelect');
  if (btn) btn.disabled = !ready;
  const receipt = document.querySelector('.receipt');
  if (receipt) {
    receipt.classList.toggle('is-ready', !!ready);
    const stamp = receipt.querySelector('.receipt__stamp');
    if (stamp) stamp.textContent = ready ? '可进入' : '待确认';
  }
}

/* =========================================================
   题库
   ========================================================= */
const BANK = {
  fill: [
    {
      prompt: ['1919 年，建筑师 ', '___', ' 在德国魏玛创立了包豪斯学校，提出"艺术与技术新统一"。'],
      answer: ['格罗皮乌斯', 'Walter Gropius', 'Gropius'],
      source: '《世界现代设计史》· 王受之 · 中国青年出版社'
    },
    {
      prompt: ['现代主义设计的三大基本原则是：功能主义、', '___', '、以及为大众服务的民主主义立场。'],
      answer: ['理性主义', '减少主义', '理性'],
      source: '考研真题 · 浙江工业大学 2022'
    },
    {
      prompt: ['"形式追随功能（Form follows function）"是由美国建筑师 ', '___', ' 提出的设计主张。'],
      answer: ['沙利文', '路易斯·沙利文', 'Louis Sullivan'],
      source: '考研真题 · 浙江理工大学 2021'
    },
    {
      prompt: ['北宋 ', '___', ' 所著《营造法式》是中国古代最完整的官修建筑技术专著。'],
      answer: ['李诫', '李明仲'],
      source: '中国设计史纲'
    },
    {
      prompt: ['乌尔姆设计学院（HfG Ulm）由 ', '___', '、马克斯·比尔等人创立，发展出系统化设计方法。'],
      answer: ['英格·肖尔', 'Inge Scholl', '肖尔'],
      source: '世界现代设计史 · 第 9 章'
    }
  ],

  term: [
    {
      title: '阿尔瓦·阿尔托 / Alvar Aalto',
      meta: '北欧现代主义 · 名词解释 · 8 分',
      hint: [
        '从三方面构建答案：1) 身份与时代；2) 设计语言关键词（有机、木材、人本）；3) 代表作与影响。',
        '建议先点出"北欧现代主义代表人物"作为锚定句，再展开案例。',
        '案例可选：帕米欧疗养院（1932）、玛利亚别墅（1939）、Stool 60 凳子（1933）、Savoy 花瓶（1936）。'
      ],
      answer: [
        '阿尔瓦·阿尔托（Alvar Aalto，1898—1976），芬兰建筑师、家具与玻璃器皿设计师，北欧人情化现代主义（Human Modernism）的奠基者。',
        '其设计在恪守现代主义功能理性的同时，强调有机形态、自然材料（尤其是弯曲木）与对人体感受的关怀，使冷峻的国际式语言获得温度与地域性。',
        '代表作包括帕米欧疗养院（Paimio Sanatorium, 1932）及其同名扶手椅、玛利亚别墅（Villa Mairea, 1939）、Stool 60（1933）与 Savoy 花瓶（1936）。',
        '他对现代主义的"软化"开辟了从功能至上向人本主义的转向，对北欧设计、有机设计乃至当代可持续设计产生深远影响。'
      ],
      points: ['国别身份', '风格关键词', '代表作', '设计史意义']
    },
    {
      title: '装饰艺术运动 / Art Deco',
      meta: '20 世纪装饰风格 · 8 分',
      hint: [
        '时间地点：1920—1930 年代，发源于法国巴黎，影响美国并风靡全球。',
        '语言特征：几何化、对称、阶梯式构成、金属与漆木等高级材质。',
        '与新艺术、现代主义的关系：是对前者的几何化反动，又区别于后者的彻底功能主义。'
      ],
      answer: [
        'Art Deco 是 1920—1930 年代源于法国、流行于欧美的装饰风格，得名于 1925 年巴黎"现代装饰艺术与工业艺术国际博览会"。',
        '其语言特征为几何化、对称性、阶梯式与放射状构成，常用奢华材料（漆、金属、象牙、宝石）与异国元素（埃及、玛雅、东亚）。',
        '相对于新艺术运动的有机曲线，它走向几何与机械；相对于包豪斯式现代主义，它仍保留装饰与象征。',
        '代表作有克莱斯勒大厦（1930）、帝国大厦顶部装饰、上海和平饭店等，是机器时代奢华消费文化的视觉表征。'
      ],
      points: ['时间地点', '形式特征', '材料与象征', '与相邻流派的关系']
    },
    {
      title: '通用设计 / Universal Design',
      meta: '当代设计观念 · 6 分',
      hint: [
        '定义：罗纳德·梅斯（Ronald Mace）于 1985 年提出。',
        '七大原则：公平、灵活、简洁直观、信息可感、容错、低体力、合适的尺度。',
        '与无障碍设计（Accessible Design）的区别：通用设计面向所有人，无障碍设计面向特定人群。'
      ],
      answer: [
        '通用设计（Universal Design）由美国建筑师罗纳德·梅斯于 1985 年提出，主张产品、环境与服务在设计之初即应面向最广泛的使用人群，无需额外适配或专门改造。',
        '其七项原则包括：公平使用、灵活使用、简单直观、信息可感、容错性、低体力消耗、合适的尺度与空间。',
        '与"无障碍设计"主要服务于残障群体不同，通用设计强调"全人群可用"，将差异视为设计的常态条件。',
        '它对公共建筑、交互产品与服务系统的当代实践产生持续影响，是包容性设计与可持续设计的重要前提。'
      ],
      points: ['提出者与年代', '七大原则', '与无障碍设计的区别', '当代意义']
    },
    {
      title: '青花瓷',
      meta: '中国设计史 · 6 分',
      hint: [
        '起源与成熟：唐代发端，元代景德镇成熟，明清达到高峰。',
        '工艺：白瓷胎 + 钴料绘画 + 透明釉 + 高温一次烧成。',
        '文化意义：海上贸易的输出品，影响伊斯兰世界与欧洲陶瓷工艺。'
      ],
      answer: [
        '青花瓷是以钴料在瓷胎上绘制纹样，再施透明釉、于 1300°C 左右高温一次烧成的釉下彩瓷器，呈现白地蓝花的视觉效果。',
        '其工艺萌芽于唐代巩县窑，至元代景德镇趋于成熟，明永乐、宣德与清康熙朝达到艺术高峰。',
        '青花瓷不仅是中国陶瓷史的代表性品类，更通过海上丝绸之路远销西亚与欧洲，深刻影响了伊兹尼克陶器与代尔夫特蓝陶。',
        '在设计史视角下，它是材料工艺、绘画程式与跨文化贸易共同塑造的造物典范。'
      ],
      points: ['工艺定义', '历史阶段', '美学语言', '跨文化影响']
    },
    {
      title: '迪特·拉姆斯 / Dieter Rams',
      meta: '德国功能主义 · 8 分',
      hint: [
        '身份：博朗（Braun）首席设计师 1961—1995，乌尔姆学院系统化方法的延续者。',
        '名言："Weniger, aber besser（少，却更好）"。',
        '十条原则：创新、有用、美观、易懂、不张扬、诚实、耐久、严谨、环保、尽可能少。'
      ],
      answer: [
        '迪特·拉姆斯（Dieter Rams，1932— ），德国工业设计师，1961—1995 年任博朗公司首席设计师，是 20 世纪后期功能主义最重要的代表人物。',
        '他延续了乌尔姆设计学院的系统化方法，将"少，却更好"作为核心信条，使博朗产品成为战后工业设计的标杆。',
        '他提出的"优良设计十条原则"——创新、有用、美观、易懂、不张扬、诚实、耐久、严谨细节、环保友好、尽可能少——成为当代工业设计与界面设计的伦理标尺，对苹果公司乔纳森·伊夫一代产生直接影响。',
        '其作品 T3 收音机、SK 4 电唱机、606 万用置物架等，至今被视为功能主义美学的范式。'
      ],
      points: ['身份与机构', '设计哲学', '十条原则', '当代影响']
    }
  ],

  short: [
    {
      title: '简述"形式追随功能"的来源、含义与当代争议。',
      meta: '简答 · 12 分 · 建议 8 分钟',
      hint: [
        '提出者与时间：路易斯·沙利文，《高层办公建筑的艺术化思考》(1896)，原句"Form ever follows function"。',
        '原意：建筑形态应源自其内在使用目的与自然规律，而非附加装饰。',
        '后续传播：被现代主义建筑师（柯布西耶、密斯）简化为口号，常误读为"功能完全决定形式"。',
        '当代争议：后现代主义（文丘里、詹克斯）的反思；体验设计、文化象征对"形式"的再定义。'
      ],
      answer: [
        '"形式追随功能"由美国建筑师路易斯·沙利文在 1896 年《高层办公建筑的艺术化思考》一文中提出，原句为"Form ever follows function"，意指建筑形态应由其内在使用目的与自然法则生发而出，而非由外加的历史装饰决定。',
        '20 世纪现代主义运动将其简化为口号，柯布西耶、密斯·凡·德·罗等人据此发展出去装饰、几何化、标准化的国际式语言，使该原则成为现代设计的伦理基础。',
        '然而，这一口号在传播中常被误读为"功能完全决定形式"。沙利文本人强调的是"生发"关系，而非机械对应；其学生赖特更将其改写为"形式与功能合一"。',
        '后现代主义提出反思：文丘里《建筑的复杂性与矛盾性》指出装饰与符号的不可或缺，詹克斯论证了象征与文化对形式的塑造作用。当代体验设计与情感化设计则把"功能"概念从效用扩展至意义与体验，使形式与功能的关系成为多维而非线性的命题。'
      ],
      points: ['出处与原意', '现代主义的传播与简化', '后现代的反思', '当代再阐释']
    },
    {
      title: '试述包豪斯的教学体系及其对中国设计教育的影响。',
      meta: '简答 · 12 分',
      hint: [
        '三阶段：预科（基础课）→ 作坊训练（双导师制）→ 建筑综合。',
        '关键人物：伊顿、康定斯基、克利、纳吉、阿尔伯斯、格罗皮乌斯。',
        '中国线索：1980 年代后构成主义教学引入；广州美院、中央工艺、清华美院"三大构成"课程。'
      ],
      answer: [
        '包豪斯的教学体系由格罗皮乌斯于 1919 年确立，由"预科（Vorkurs）—作坊训练—建筑综合"三阶段构成。',
        '预科以伊顿、纳吉、阿尔伯斯主持，训练学生对材料、形态、色彩的直觉与分析；作坊课程实施"双导师制"，由艺术家与工匠共同指导，打破纯艺术与工艺的二分；最高阶段则汇入建筑这一综合性总体艺术。',
        '该体系奠定了现代设计教育的方法论：以基础造型为根、以工作坊为身、以综合实践为冠。',
        '在中国，1980 年代改革开放后，包豪斯通过香港、日本中转传入大陆，催生了广州美院、中央工艺美院、清华美院等校的"三大构成"（平面、色彩、立体）基础课程，成为今日设计学科的通用入门体系；当代国内对包豪斯的研究亦从形式层面深入到社会与工艺哲学层面，持续影响中国设计教育改革。'
      ],
      points: ['三阶段体系', '关键人物', '中国传播路径', '当代影响']
    },
    {
      title: '比较新艺术运动与装饰艺术运动的异同。',
      meta: '简答 · 10 分',
      hint: [
        '同：均为现代主义之前的过渡风格；均强调装饰；均跨建筑、平面、产品多领域。',
        '异：时间、形态语言（曲线 vs 几何）、技术态度（手工 vs 机器）、文化象征。'
      ],
      answer: [
        '相同点：两者皆为现代主义之前的国际性装饰风格，都强调装饰在器物与建筑中的核心地位，并跨建筑、家具、平面、首饰多领域展开。',
        '相异点：时间上，新艺术运动盛行于 1890—1910 年，装饰艺术运动盛行于 1920—1930 年，恰好分处一战前后。',
        '形态语言上，新艺术取法植物与自然，强调流动曲线与有机生长；装饰艺术则走向几何化、对称与阶梯状构成，呼应机器时代的速度与秩序。',
        '技术态度上，新艺术延续工艺美术运动对手工的执着，反对工业批量；装饰艺术则拥抱新材料（铬、铝、塑料）与工业制造，但仍保留奢华装饰。',
        '在文化象征上，前者寄托世纪末欧洲的浪漫与神秘主义，后者表征两次大战之间欧美都市资产阶级的现代消费想象。'
      ],
      points: ['时间分期', '形式语言', '技术态度', '文化语境']
    },
    {
      title: '简述格式塔心理学对视觉传达设计的影响。',
      meta: '简答 · 10 分',
      hint: [
        '基础原理：整体大于部分之和；接近、相似、闭合、连续、共同命运等组织原则。',
        '应用层面：logo 设计的负形利用、信息层级、海报构图、UI 视觉分组。'
      ],
      answer: [
        '格式塔心理学诞生于 20 世纪初的德国，主张"整体大于部分之和"，并归纳出接近、相似、闭合、连续、共同命运、图—底关系等知觉组织原则。',
        '在视觉传达设计中，这些原则提供了科学化的视觉组织依据：接近与相似原则用于建立信息分组与视觉层级；闭合与图—底关系成为标志设计中负形利用的理论基础（如 FedEx 箭头、WWF 熊猫）；连续与共同命运原则指导动态海报与界面动效中的运动叙事。',
        '在当代 UI 与信息设计中，格式塔原则与认知负荷理论结合，用以解释为何良好的分组与对齐能显著降低用户的扫视成本，使其成为从平面构图到交互设计皆不可绕开的底层视觉语法。'
      ],
      points: ['理论概述', '核心原则', '设计应用', '当代意义']
    },
    {
      title: '简述工艺美术运动的背景、主张与历史局限。',
      meta: '简答 · 10 分',
      hint: [
        '背景：英国维多利亚时代工业制品粗劣、装饰过度；1851 年水晶宫博览会暴露问题。',
        '主张：莫里斯、拉斯金；回归手工艺、艺术与工艺合一、自然主题。',
        '局限：反工业立场使产品昂贵，无法服务大众，矛盾于其社会主义初衷。'
      ],
      answer: [
        '工艺美术运动兴起于 19 世纪后半叶的英国，针对维多利亚时代工业批量产品的粗劣装饰、以及艺术与工艺的分裂状态。1851 年伦敦水晶宫博览会上华而不实的产品集中暴露了这些问题，成为运动的直接导火索。',
        '在拉斯金的理论与莫里斯的实践下，运动主张回归中世纪手工艺传统，恢复设计师与工匠的统一身份，反对纯装饰、推崇取自自然的有机纹样，并希望通过美的器物改良工人阶级的生活。',
        '其历史局限在于：手工生产成本高昂，所谓"为大众的艺术"实际上只能服务于上层中产阶级，违背了莫里斯的社会主义理想；同时其反工业立场无法应对机器时代的根本变革。',
        '尽管如此，运动确立了"设计应同时关怀美与社会"的伦理传统，为新艺术运动、德意志制造联盟乃至包豪斯的诞生奠定了基础。'
      ],
      points: ['历史背景', '核心主张', '代表人物', '局限与遗产']
    }
  ],

  essay: [
    {
      title: '试论中国传统造物观对当代设计的启示。',
      meta: '论述 · 25 分 · 建议 25 分钟 · 不少于 800 字',
      hint: [
        '抓四个传统命题：1) 天人合一；2) 器以载道；3) 制器尚象；4) 工巧之美。',
        '当代映射：可持续设计、地域性设计、情感化设计、用户体验设计。',
        '结构建议：起（问题提出）→ 承（四大造物观逐点阐述）→ 转（与当代设计三组对照）→ 合（中国式现代化设计的可能路径）。',
        '论证一定要落到具体案例（朱炳仁铜器 / 品物流形 / 杨明洁等当代设计师；故宫文创、上下品牌）。'
      ],
      answer: [
        '当代设计正面对可持续危机、文化同质化与体验空洞化的多重挑战，回望中国传统造物观，可以为之提供深刻而具体的思想资源。',
        '其一，"天人合一"的整体宇宙观。《考工记》提出"天有时，地有气，材有美，工有巧，合此四者，然后可以为良"，明确将造物视为人与自然秩序的共振。这一观念与当代可持续设计、循环经济与生物设计高度共鸣——前者从材料伦理走向系统伦理，后者从局部优化走向整体平衡。',
        '其二，"器以载道"的器物伦理。中国传统视器物为承载礼制、思想与日常哲学的载体，而非孤立的消费对象。这一思想直接呼应当代"产品即叙事"、品牌即价值观的命题，提醒设计师在功能之外注入文化与伦理的厚度。故宫文创、上下品牌的成功，皆是"器以载道"在当代消费语境下的转译。',
        '其三，"制器尚象"的造型方法。从《周易·系辞》"观物取象"到明清家具的简练比例，传统造物善于在自然与人工之间提炼意象，而非简单模拟。这种"以象写意"的方法对当代信息可视化、品牌符号设计与产品语义学具有方法论意义，使设计语言摆脱单纯的视觉装饰，走向意义生成。',
        '其四，"工巧之美"的工艺立场。从《天工开物》对工艺细节的尊重，到当代景德镇、龙泉青瓷的复兴，中国传统始终将工匠精神视为造物的灵魂。这一立场可与当代慢设计、地方性设计相结合，对抗全球化批量生产对差异的抹平。设计师品物流形对竹工艺的当代转化，正是"工巧之美"在今日的延伸。',
        '当然，传统造物观并非可以原样照搬。其与当代设计的对话，必须经过现代性的批判性筛选——剥离其等级、礼教的旧形式，保留其整体性、伦理性与材料智慧的核心。当代中国设计的真正出路，不是表层的"中国风"符号，而是在四大造物观与现代设计方法之间建立结构性对话，发展出一种既根植中国土壤、又面向人类共同挑战的设计语言。',
        '综上，中国传统造物观提供的，是一种"以人合天、以物载道、以象造形、以工立美"的整体设计哲学。它对当代设计的启示，不仅在于风格，更在于方法与伦理。'
      ],
      points: ['四大造物观的把握', '当代议题对照', '案例与论据', '辩证而非套用']
    }
  ]
};

/* =========================================================
   答题视图
   ========================================================= */
const Q = {
  type: 'fill',
  idx: 0,
  custom: false,
  searching: false,
  recommended: false,
  searchKeyword: '',
  searchIdx: 2,
  answered: {},   // key: type+idx
  miss: {}        // key: type+idx -> true
};

const SEARCH_RESULTS = [
  {
    type: 'essay',
    label: '论述题（热点型）',
    title: '论述可持续设计在“碳中和”背景下的发展。',
    meta: '论述 · 热点型 · 25 分',
    hint: ['先界定可持续设计与碳中和的关系。', '从材料、生产、消费和系统服务四个层面展开。', '结合绿色设计、循环经济和社会责任案例。'],
    answer: ['可持续设计是在产品、环境、服务与社会系统中综合考虑资源消耗、环境影响和长期社会价值的设计方法。', '在碳中和背景下，它要求设计从末端装饰转向全生命周期管理，包括低碳材料选择、可回收结构、节能制造和可持续消费引导。', '设计师需要将绿色理念转化为具体策略，如模块化维修、循环包装、共享服务和行为引导。', '因此，可持续设计不仅是形式风格，更是连接技术、产业与公众生活方式的系统性方法。'],
    points: ['概念界定', '碳中和背景', '全生命周期', '案例与策略'],
    fromSearch: true
  },
  {
    type: 'essay',
    label: '论述题（热点型）',
    title: '2024 年我国在生态环境保护方面持续加强政策引导和投入，如基本建立生态环境分区管控制度。请结合设计学谈谈绿色发展对设计的影响。',
    meta: '论述 · 热点型 · 25 分',
    hint: ['从政策语境切入。', '联系绿色设计、生态设计和服务设计。', '落到材料、制造、传播和消费。'],
    answer: ['绿色发展推动设计从单一产品美化转向系统性问题解决。', '在材料上强调低耗、可再生和可回收；在制造上强调节能减排；在传播上强调公众环保意识；在服务上强调共享与循环。', '设计师应把生态约束转化为创新条件，形成兼顾功能、审美与社会责任的设计方案。'],
    points: ['政策背景', '绿色设计', '生态系统', '社会责任'],
    fromSearch: true
  },
  {
    type: 'essay',
    label: '论述题（热点型）',
    title: '请你以可持续设计的角度谈谈“有计划废止制度”',
    meta: '论述 · 热点型 · 25 分',
    hint: ['先解释有计划废止制度。', '从消费主义和资源浪费角度批判。', '再提出可持续设计的替代路径。'],
    answer: ['“有计划废止制度”是通过人为缩短产品寿命、制造功能或审美过时来刺激消费的商业策略。', '从可持续设计角度看，它造成资源浪费、环境负担和消费伦理问题，与全生命周期设计理念相冲突。', '可持续设计应强调耐用性、可维修、模块化升级、材料回收和情感持久性，使产品价值从快速替换转向长期使用。', '因此，对有计划废止制度的反思，正体现了当代设计从商业刺激走向生态责任和社会伦理的转向。'],
    points: ['有计划废止', '消费主义批判', '生命周期', '可维修与循环'],
    fromSearch: true
  },
  {
    type: 'term',
    label: '名词解释',
    title: '可持续设计',
    meta: '名词解释 · 8 分',
    hint: ['定义要包含环境、资源和社会责任。', '补充全生命周期、循环经济等关键词。', '可举绿色包装、模块化产品等例子。'],
    answer: ['可持续设计是指在产品、视觉、空间和服务设计中，综合考虑环境影响、资源利用效率、社会公平和长期价值的设计理念与方法。', '它强调从材料获取、生产制造、运输使用到回收再利用的全生命周期控制，减少能源消耗和环境负担。', '其关键词包括绿色设计、生态设计、循环经济、可维修、可回收和低碳生活方式。', '它代表了当代设计从单纯满足消费需求转向承担生态责任和社会责任的重要趋势。'],
    points: ['定义', '全生命周期', '循环经济', '当代意义'],
    fromSearch: true
  },
  {
    type: 'fill',
    label: '填空题',
    prompt: ['可持续设计强调在产品全生命周期中兼顾环境、资源与 ', '___', ' 责任。'],
    answer: ['社会', '社会责任'],
    source: '可持续设计专题',
    fromSearch: true
  }
];

const CUSTOM = {
  fill: { title: '', answer: ['自定义答案'] },
  term: { title: '' },
  short: { title: '' },
  essay: { title: '' }
};

function startLibraryMode(){
  Q.custom = false;
  Q.searching = false;
  Q.recommended = false;
  Q.idx = 0;
  goto(null, 'quiz');
}

function startCustomMode(){
  Q.custom = true;
  Q.searching = false;
  Q.recommended = false;
  Q.idx = 0;
  Object.values(CUSTOM).forEach(item=> item.title = '');
  goto(null, 'quiz');
}

function setQuizMode(mode){
  const normalized = mode === true ? 'custom' : mode === false ? 'library' : mode;
  Q.custom = normalized === 'custom';
  Q.searching = normalized === 'search';
  Q.recommended = normalized === 'recommend';
  Q.idx = 0;
  if (Q.custom || Q.searching) Object.values(CUSTOM).forEach(item=> item.title = '');
  if (Q.searching) Q.searchKeyword = '';
  if (Q.recommended) Q.type = 'fill';
  syncModeToggle();
  syncQuizTabs();
  renderQuiz();
  renderAppNav();
}

function syncModeToggle(){
  const mode = Q.recommended ? 'recommend' : Q.searching ? 'search' : Q.custom ? 'custom' : 'library';
  document.querySelectorAll('.mode-toggle').forEach(btn=>{
    btn.classList.toggle('is-on', btn.dataset.mode === mode);
  });
  document.querySelectorAll('[data-practice-head]').forEach(el=>{
    el.hidden = Q.searching;
  });
  document.querySelectorAll('[data-practice-title]').forEach(el=>{
    el.textContent = Q.recommended ? '根据画像推荐练习' : '开始答题';
  });
  document.querySelectorAll('[data-practice-mode]').forEach(el=>{
    el.hidden = !Q.recommended;
  });
  document.querySelectorAll('[data-practice-profile-note]').forEach(el=>{
    el.hidden = !Q.recommended;
  });
  document.querySelectorAll('.quiztabs').forEach(el=>{
    el.hidden = Q.searching;
  });
  document.querySelectorAll('[data-recommend-panel]').forEach(el=>{
    el.hidden = true;
  });
}

function syncQuizTabs(){
  document.querySelectorAll('.quiztab').forEach(btn=>{
    btn.classList.toggle('is-on', btn.dataset.type === Q.type);
  });
  document.querySelectorAll('[data-recommend-type]').forEach(btn=>{
    btn.classList.toggle('is-on', btn.dataset.recommendType === Q.type);
  });
}

function setQuizType(type){
  Q.type = type;
  Q.idx = 0;
  syncQuizTabs();
  renderQuiz();
}

function setRecommendedType(type){
  Q.custom = false;
  Q.searching = false;
  Q.recommended = true;
  syncModeToggle();
  setQuizType(type);
}

function mountQuiz(){
  syncModeToggle();
  syncQuizTabs();
  // 题型 tab
  document.querySelectorAll('.quiztab').forEach(t=>{
    t.onclick = ()=>{
      setQuizType(t.dataset.type);
    };
  });
  renderQuiz();
}

function key(){ return `${Q.searching ? 'search' : Q.custom ? 'custom' : 'bank'}-${Q.type}-${Q.idx}`; }

function renderQuiz(){
  if (Q.searching) {
    const stage = document.getElementById('qstage');
    const hasSearched = !!Q.searchKeyword;
    const item = hasSearched ? currentItem() : null;
    stage.innerHTML = renderSearchMode() + (hasSearched ? (Q.type === 'fill' ? viewFill(item) : viewLong(item)) : '');
    if (hasSearched) {
      if (Q.type === 'fill') bindFill(item);
      else bindLong(item);
    }
    stripFullWidthBrackets(stage);
    return;
  }
  const list = getQuizList();
  if (Q.idx >= list.length) Q.idx = 0;
  const item = currentItem();
  const stage = document.getElementById('qstage');

  if (Q.type === 'fill') stage.innerHTML = modeBadgeHtml() + viewFill(item);
  else                   stage.innerHTML = modeBadgeHtml() + viewLong(item);

  // 绑定事件
  if (Q.type === 'fill') bindFill(item);
  else                   bindLong(item);
  stripFullWidthBrackets(stage);
}

function renderSearchMode(){
  const results = searchResults();
  const hasSearched = !!Q.searchKeyword;
  return `
    <section class="question-search${hasSearched ? ' has-query' : ''}" aria-label="搜题模式">
      <form class="question-search__bar" onsubmit="searchQuestion(event)">
        <input id="questionSearchInput" type="search" value="${escapeHtml(Q.searchKeyword)}" placeholder="输入题目关键词，如：包豪斯、可持续设计" autocomplete="off" />
        <button type="submit">搜题</button>
      </form>
      ${hasSearched ? `<div class="question-search__meta">
        <span>关键词：${escapeHtml(Q.searchKeyword)}</span>
        <b>找到 ${results.length} 道题</b>
      </div>
      <div class="question-results" role="list" aria-label="匹配题目">
        ${results.map((item,index)=>`
          <button class="question-result${index === Q.searchIdx ? ' is-on' : ''}" type="button" role="listitem" onclick="selectSearchResult(${index})">
            <b class="question-result__type question-result__type--${item.type}">${escapeHtml(item.label || labelFor(item.type))}</b>
            <span>${escapeHtml(itemTitle(item))}</span>
          </button>
        `).join('')}
      </div>` : `<div class="question-search__empty">
        <b>输入关键词后，将自动匹配题库中的相关题目</b>
        <span>支持填空、名词解释、简答、论述等题型。可先试试：可持续设计</span>
      </div>`}
    </section>
  `;
}

function searchQuestion(event){
  event.preventDefault();
  const input = document.getElementById('questionSearchInput');
  const keyword = (input?.value || '').trim();
  if (!keyword) {
    input?.focus();
    return;
  }
  Q.searchKeyword = keyword;
  Q.searchIdx = 0;
  const item = currentItem();
  Q.type = item.type;
  renderQuiz();
}

function searchResults(){
  return SEARCH_RESULTS;
}

function selectSearchResult(index){
  Q.searchIdx = Math.max(0, Math.min(searchResults().length - 1, index));
  const item = currentItem();
  Q.type = item.type;
  Q.idx = 0;
  renderQuiz();
}

function modeBadgeHtml(){
  return '';
}

function getQuizList(){
  if (Q.searching) return [currentSearchItem()];
  return Q.custom ? [currentCustomItem()] : (BANK[Q.type] || []);
}

function currentItem(){
  if (Q.searching) return currentSearchItem();
  return Q.custom ? currentCustomItem() : (BANK[Q.type] || [])[Q.idx];
}

function currentSearchItem(){
  return searchResults()[Q.searchIdx] || searchResults()[0];
}

function currentCustomItem(){
  const base = CUSTOM[Q.type];
  const rawTitle = (base.title || '').trim();
  const title = rawTitle || `自定义${labelFor(Q.type)}题目`;
  const sample = (BANK[Q.type] || [])[0] || {};
  if (Q.type === 'fill') {
    const text = rawTitle ? (rawTitle.includes('___') ? rawTitle : `${rawTitle} ___`) : '___';
    return {
      prompt: splitCustomFillPrompt(text),
      answer: base.answer || ['自定义答案'],
      source: '自定义题目'
    };
  }
  return {
    title,
    meta: `${labelFor(Q.type)} · 自定义题目`,
    hint: sample.hint || ['先明确题干关键词。', '再分点展开论证。', '最后回到设计史意义或当代启示。'],
    answer: sample.answer || ['此处按题库模板生成参考答案结构。', '作答时请围绕自定义题干补充关键词、案例和意义。'],
    points: sample.points || ['概念准确', '结构完整', '案例支撑', '意义提升']
  };
}

function splitCustomFillPrompt(text){
  const parts = text.split('___');
  if (parts.length < 2) return [text, '___'];
  return parts.flatMap((part,i)=> i === parts.length - 1 ? [part] : [part, '___']).filter(Boolean);
}

function stripFullWidthBrackets(scope){
  if (!scope) return;
  const left = String.fromCharCode(0x3010);
  const right = String.fromCharCode(0x3011);
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue.includes(left) || node.nodeValue.includes(right)) {
      node.nodeValue = node.nodeValue.split(left).join('').split(right).join('');
    }
  }
}

function labelFor(t){ return ({fill:'填空',term:'名词解释',short:'简答',essay:'论述'})[t]; }

function jumpQ(i){ Q.idx = i; renderQuiz(); }
function prevQ(){ Q.idx = Math.max(0, Q.idx-1); renderQuiz(); }
function nextQ(){ const len = getQuizList().length; Q.idx = Math.min(len-1, Q.idx+1); renderQuiz(); }

/* ----- 填空题视图 ----- */
function viewFill(item){
  const editablePrompt = Q.custom || (Q.searching && !item.fromSearch);
  const promptHtml = editablePrompt ? customFillPromptHtml() : item.prompt.map(seg=>{
    if (seg === '___') return `<input class="fill-blank" id="fillInput" aria-label="填空答案" />`;
    return escapeHtml(seg);
  }).join('');
  const mistakeOn = isMistakeItem(item);
  return `
    <section class="fill-card">
      <div class="fill-prompt${editablePrompt ? ' fill-prompt--custom' : ''}">${promptHtml}</div>
      <div class="fill-result" id="fillResult" aria-live="polite"></div>
      <div class="fill-actions">
        <button class="btn btn--primary" id="fillSubmit" type="button" onclick="checkFill(currentItem())">提交作答</button>
        <button class="btn btn--ghost" type="button" onclick="revealAnswer()">查看答案</button>
        <button class="btn btn--ghost mistake-toggle${mistakeOn ? ' is-on' : ''}" type="button" onclick="toggleCurrentMistake()">${mistakeOn ? '已收藏' : '加入收藏'}</button>
      </div>
    </section>
    ${quizNavHtml()}
  `;
}

function bindFill(item){
  const input = document.getElementById('fillInput');
  if (!input) return;
  input.focus();
  input.addEventListener('keydown', e=>{
    if (e.keyCode === 13){
      e.preventDefault();
      checkFill(item);
    }
  });
}

function checkFill(item){
  const input = document.getElementById('fillInput');
  if (!input) return;
  const val = (input.value || '').trim();
  if (!val) { input.focus(); return; }
  const ok = item.answer.some(a => a.replace(/\s/g,'') === val.replace(/\s/g,''));
  input.classList.toggle('is-right', ok);
  input.classList.toggle('is-wrong', !ok);

  Q.answered[key()] = true;
  Q.miss[key()] = !ok;
  recordPractice(ok ? '提交正确' : '提交错误', item);

  const result = document.getElementById('fillResult');
  result.className = `fill-result is-open ${ok ? 'is-right' : 'is-wrong'}`;
  result.innerHTML = `${ok ? '正确' : '错误'}。答案：${item.answer.join(' / ')}`;
}

/* ----- 名词/简答/论述 共用视图 ----- */
function viewLong(item){
  const active = 'answer';
  const mistakeOn = isMistakeItem(item);
  return `
    <article class="long-stage">
      ${longTitleHtml(item)}

      <nav class="crumbtabs" aria-label="答题步骤">
        <button class="crumbtab is-on" type="button" data-panel="answer" onclick="switchLongPanel('answer')">我先作答</button>
        <button class="crumbtab" type="button" data-panel="hint" onclick="switchLongPanel('hint')">解题思路</button>
        <button class="crumbtab" type="button" data-panel="ref" onclick="switchLongPanel('ref')">参考答案</button>
      </nav>

      <section class="long-panel is-on" data-long-panel="${active}">
        <div class="answerbox">
          <div class="answerbox__lab">
            <span>作答区</span>
            <span id="wc">0 字</span>
          </div>
          <textarea id="longInput" placeholder="${placeholderFor(Q.type)}"></textarea>
          <div class="answerbox__bar">
            <button class="btn btn--ghost mistake-toggle${mistakeOn ? ' is-on' : ''}" type="button" onclick="toggleCurrentMistake()">${mistakeOn ? '已收藏' : '加入收藏'}</button>
            <button class="btn btn--ghost" type="button" onclick="switchLongPanel('hint')">查看思路</button>
            <button class="btn btn--primary" type="button" onclick="aiGrade()">提交 · 智能评分</button>
          </div>
        </div>
        <div class="reveal" id="reveal-grade">
          <div id="gradeBody"></div>
        </div>
      </section>

      <section class="long-panel" data-long-panel="hint">
        ${renderHintModules(item)}
      </section>

      <section class="long-panel" data-long-panel="ref">
        ${renderReferenceAnswer(item)}
      </section>
    </article>
    ${quizNavHtml()}
  `;
}

function customFillPromptHtml(){
  const placeholder = Q.searching ? '输入要搜索的填空题目或关键词' : '请输入填空题目，用 ___ 表示填空位置';
  return `
    <textarea class="custom-question-input custom-question-input--fill" aria-label="${Q.searching ? '搜题关键词' : '自定义填空题题干'}" rows="2" placeholder="${placeholder}" oninput="updateCustomQuestion(this.value)">${escapeHtml(CUSTOM.fill.title)}</textarea>
    <input class="fill-blank" id="fillInput" aria-label="填空答案" />
  `;
}

function longTitleHtml(item){
  if (!Q.custom && (!Q.searching || item.fromSearch)) return `<h2 class="long-title">${escapeHtml(item.title)}</h2>`;
  const label = Q.searching ? '搜题关键词' : `自定义${labelFor(Q.type)}题目`;
  const placeholder = Q.searching ? `输入要搜索的${labelFor(Q.type)}题目或关键词` : `请输入${labelFor(Q.type)}题目`;
  return `<textarea class="long-title long-title--custom" aria-label="${label}" rows="2" placeholder="${placeholder}" oninput="updateCustomQuestion(this.value)">${escapeHtml(CUSTOM[Q.type].title)}</textarea>`;
}

function updateCustomQuestion(value){
  CUSTOM[Q.type].title = value;
  if (Q.type === 'fill') {
    return;
  }
}

function escapeHtml(value){
  return String(value ?? '').replace(/[&<>"']/g, ch=>({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[ch]);
}

function renderReferenceAnswer(item){
  if (Q.type === 'short') return renderShortReferenceAnswer(item);
  if (Q.type === 'essay') return renderEssayReferenceAnswer(item);
  const versions = termAnswerVersions(item);
  return `
    <div class="answer-versions">
      ${answerVersion('基础版', '简洁、考场够用，适合快速背诵', versions.base)}
      ${answerVersion('延伸版', '更完整，加入背景、代表作、影响，适合高分答案', versions.extended)}
      ${answerVersion('记忆版', '用更好记的结构、口诀、分点，方便背诵', versions.memory)}
    </div>
  `;
}

function renderShortReferenceAnswer(item){
  const versions = shortAnswerVersions(item);
  return `
    <div class="answer-versions answer-versions--short">
      ${answerVersion('基础版', '结构清楚，适合考场稳定作答', versions.base)}
      ${answerVersion('高分版', '增加背景、对比和影响，拉开分数', versions.high)}
      ${answerVersion('记忆版', '压缩成可背诵的答题模板', versions.memory)}
    </div>
  `;
}

function renderEssayReferenceAnswer(item){
  return `
    <div class="essay-answer">
      ${essayAnswerSegments(item).map((seg,i)=>`
        <section class="essay-answer__seg essay-answer__seg--${i+1}">
          <h3>${seg.title}</h3>
          <p><b>论点：</b>${seg.point}</p>
          <p><b>论据：</b>${seg.evidence}</p>
        </section>
      `).join('')}
    </div>
  `;
}

function answerVersion(title, note, paragraphs){
  return `
    <section class="answer-version">
      <h3>${title}</h3>
      <span>${note}</span>
      <div>${paragraphs.map(p=>`<p>${p}</p>`).join('')}</div>
    </section>
  `;
}

function termAnswerVersions(item){
  const title = item.title.replace(/\s*\/.*$/, '').trim();
  const answer = item.answer || [];
  const points = item.points || [];
  return {
    base: [
      `${title}是设计史中的重要名词。作答时需先说明其基本身份、时代背景或概念来源。`,
      `其次概括其核心特征：${points.slice(0, 2).join('、') || '形式特征与设计主张'}。最后点明其对设计史或当代设计的影响。`
    ],
    extended: answer.length ? answer : [
      `${title}需要从定义、背景、代表作品和历史意义四个层面展开。`,
      `高分答案应补充相关人物、年代、风格特征，并与相邻设计运动或当代设计议题建立联系。`
    ],
    memory: memoryAnswer(item)
  };
}

function shortAnswerVersions(item){
  const title = item.title.replace(/[。？?]$/, '');
  const answer = item.answer || [];
  const points = item.points || [];
  return {
    base: answer.length ? answer.slice(0, 2) : [
      `${title}需要先说明概念或背景，再分点概括主要特征。`,
      `最后补充其设计史意义或当代启示，形成完整闭环。`
    ],
    high: answer.length ? answer : [
      `${title}应从背景、核心观点、代表案例和影响四个层面展开。`,
      `作答时加入对比关系和具体案例，能体现理论理解而不是简单背诵。`
    ],
    memory: [
      `口诀：先定位，后分点，再举例，末升华。`,
      `${title}按“${points.length ? points.join(' → ') : '背景 → 特征 → 案例 → 意义'}”记忆。`,
      `考场写法：一句总括 + 两到三点展开 + 一句意义收束。`
    ]
  };
}

function essayAnswerSegments(item){
  const answer = item.answer || [];
  return [
    {
      title: '论点一',
      point: answer[0] || '传统造物观强调器物与人的关系，能够为当代设计提供以人为本的价值基础。',
      evidence: answer[1] || '例如中国传统器物常从使用场景、材料特性和生活秩序出发，形成“因用制器”的设计逻辑。'
    },
    {
      title: '论点二',
      point: answer[2] || '传统造物观中的材料意识、整体观和节制精神，也能转化为当代可持续设计方法。',
      evidence: answer[3] || '例如当代产品、视觉和空间设计可借鉴传统工艺中的材料适配、结构简化和审美克制，回应资源、文化与社会需求。'
    }
  ];
}

function memoryAnswer(item){
  const points = item.points || [];
  const title = item.title.replace(/\s*\/.*$/, '').trim();
  return [
    `口诀：一定位，二特征，三案例，四意义。`,
    `${title}先背一句定位，再按“${points.length ? points.join(' → ') : '定义 → 特征 → 案例 → 意义'}”展开。`,
    `考场写法：是什么 + 有什么特点 + 举一个例子 + 为什么重要。`
  ];
}

function renderHintModules(item){
  const hint = normalizeHint(item);
  if (Q.type === 'short') return renderShortHintModules(item, hint);
  if (Q.type === 'essay') return renderEssayHintModules(item, hint);
  return `
    <div class="hint-modules">
      <section class="hint-card hint-card--keywords">
        <h3 class="hint-card__title">核心关联词</h3>
        ${keywordGroup('必须掌握', hint.keywords.must, 'red')}
        ${keywordGroup('重要关联', hint.keywords.important, 'yellow')}
        ${keywordGroup('延伸关联', hint.keywords.extend, 'blue')}
      </section>

      <section class="hint-card hint-card--timeline">
        <h3 class="hint-card__title">时间背景</h3>
        <ol class="hint-timeline">
          ${hint.timeline.map(t=>`
            <li>
              <strong>${t.time}</strong>
              <b>${t.title}</b>
              <p>${t.text}</p>
            </li>
          `).join('')}
        </ol>
      </section>

      <section class="hint-card hint-card--map">
        <h3 class="hint-card__title">思维导图</h3>
        <div class="mindmap">
          <div class="mindmap__col">
            ${mindNode('定义与起源', hint.map.leftTop)}
            ${mindNode('实施方法', hint.map.leftBottom)}
          </div>
          <div class="mindmap__center">${hint.map.center}</div>
          <div class="mindmap__col">
            ${mindNode('设计应用', hint.map.rightTop)}
            ${mindNode('考研看点', hint.map.rightBottom)}
          </div>
        </div>
        <div class="memory-chain">
          <b>答题记忆串联</b>
          <span>理解定义与起源</span><i>→</i><span>掌握设计应用场景</span><i>→</i><span>结合案例记忆考点</span>
        </div>
      </section>

      <section class="hint-card hint-card--tips">
        <h3 class="hint-card__title">高分小技巧</h3>
        <ol class="hint-tips">
          ${shortTips(item).map((tip,i)=>`<li><b>${i+1}</b><p>${tip}</p></li>`).join('')}
        </ol>
      </section>
    </div>
  `;
}

function renderShortHintModules(item, hint){
  return `
    <div class="hint-modules hint-modules--short">
      <section class="hint-card hint-card--analysis">
        <h3 class="hint-card__title">题目解析</h3>
        <ol class="short-analysis">
          ${shortAnalysisRows(item, hint).map((row,i)=>`
            <li>
              <b>${i+1}</b>
              <p>${row}</p>
            </li>
          `).join('')}
        </ol>
      </section>

      <section class="hint-card hint-card--map">
        <h3 class="hint-card__title">思维导图</h3>
        <div class="mindmap mindmap--short">
          <div class="mindmap__col">
            ${mindNode('核心概念', hint.map.leftTop)}
            ${mindNode('论证层次', hint.map.leftBottom)}
          </div>
          <div class="mindmap__center">${hint.map.center}</div>
          <div class="mindmap__col">
            ${mindNode('案例支撑', hint.map.rightTop)}
            ${mindNode('答题落点', hint.map.rightBottom)}
          </div>
        </div>
        <div class="memory-chain">
          <b>答题记忆串联</b>
          <span>提取关键词</span><i>→</i><span>搭建分点结构</span><i>→</i><span>补充案例与评价</span>
        </div>
      </section>

      <section class="hint-card hint-card--thinking">
        <h3 class="hint-card__title">答题思路</h3>
        <ol class="short-thinking">
          ${shortThinkingRows(item, hint).map((row,i)=>`
            <li>
              <b>${i+1}</b>
              <div>
                <h4>${row.title}</h4>
                <ul>${row.points.map(p=>`<li>${p}</li>`).join('')}</ul>
              </div>
            </li>
          `).join('')}
        </ol>
      </section>

      <section class="hint-card hint-card--tips">
        <h3 class="hint-card__title">高分小技巧</h3>
        <ol class="hint-tips">
          ${shortTips(item).map((tip,i)=>`<li><b>${i+1}</b><p>${tip}</p></li>`).join('')}
        </ol>
      </section>
    </div>
  `;
}

function shortAnalysisRows(item, hint){
  const points = item.points || [];
  const title = item.title.replace(/[。？?]$/, '');
  return [
    `关键词提取：${points.join('、') || hint.keywords.must.join('、')}`,
    `题目要求：围绕“${title}”展开，重点从概念、背景、特征、影响四个角度组织答案。`,
    `字数：300–400字。`,
    `格式要求：总分结构；先一句话总括，再分2–3点展开；分段清楚，序号清晰。`
  ];
}

function shortThinkingRows(item, hint){
  const hints = Array.isArray(item.hint) ? item.hint : [];
  return [
    { title: '理论背景与对比', points: [hints[0] || '先交代概念来源、时代背景或提出者。', '点明它与相邻概念、运动或观点的差异。'] },
    { title: '核心观点与展开', points: [hints[1] || '围绕核心观点分点展开。', '每一点都要有关键词、解释句和简单例证。'] },
    { title: '历史意义与影响', points: [hints[2] || '结尾回到设计史意义或当代启示。', '上升到教育、产业、审美或社会意义。'] }
  ];
}

function shortTips(item){
  return [
    '开头定性：第一句直接点明题目对象的时代、身份或核心主张。',
    '专业术语：必须使用教材关键词，体现理论深度。',
    '结尾升华：不要只停在定义，最后补一句设计史意义或当代启示。'
  ];
}

function renderEssayHintModules(item, hint){
  return `
    <div class="hint-modules hint-modules--essay">
      <section class="hint-card hint-card--essay-analysis">
        <h3 class="hint-card__title">审题分析</h3>
        <ul class="essay-analysis">
          ${essayAnalysisRows(item).map(row=>`<li><b>${row.title}：</b>${row.text}</li>`).join('')}
        </ul>
      </section>

      <section class="hint-card hint-card--essay-frame">
        <h3 class="hint-card__title">答题框架</h3>
        <ol class="essay-frame">
          ${essayFrameRows(item).map((row,i)=>`
            <li>
              <b>${i+1}</b>
              <div>
                <h4>${row.title}</h4>
                <ul>${row.points.map(p=>`<li>${p}</li>`).join('')}</ul>
              </div>
            </li>
          `).join('')}
        </ol>
      </section>

      <section class="hint-card hint-card--map">
        <h3 class="hint-card__title">思维导图</h3>
        <div class="mindmap mindmap--essay">
          <div class="mindmap__col">
            ${mindNode('传统命题', hint.map.leftTop)}
            ${mindNode('当代映射', hint.map.leftBottom)}
          </div>
          <div class="mindmap__center">${hint.map.center}</div>
          <div class="mindmap__col">
            ${mindNode('案例论据', hint.map.rightTop)}
            ${mindNode('总结升华', hint.map.rightBottom)}
          </div>
        </div>
        <div class="memory-chain">
          <b>答题记忆串联</b>
          <span>界定主题</span><i>→</i><span>分层论证</span><i>→</i><span>案例支撑</span><i>→</i><span>价值升华</span>
        </div>
      </section>

      <section class="hint-card hint-card--tips">
        <h3 class="hint-card__title">高分小技巧</h3>
        <ol class="hint-tips">
          ${essayTips(item).map((tip,i)=>`<li><b>${i+1}</b><p>${tip}</p></li>`).join('')}
        </ol>
      </section>

      <section class="hint-card hint-card--loss">
        <h3 class="hint-card__title">失分点</h3>
        <ul class="essay-loss">
          ${essayLossRows().map(row=>`<li>${row}</li>`).join('')}
        </ul>
      </section>
    </div>
  `;
}

function essayAnalysisRows(item){
  const title = item.title.replace(/[。？?]$/, '');
  return [
    { title: '核心考察点', text: `围绕“${title}”提炼核心关系、历史脉络与当代设计启示。` },
    { title: '答题方向', text: '先界定概念，再从理论、形式、社会背景、案例影响四个层面展开。' },
    { title: '注意点', text: '避免简单罗列；必须形成论证链，案例要跨领域，字数控制600–1000字。' }
  ];
}

function essayFrameRows(item){
  const hints = Array.isArray(item.hint) ? item.hint : [];
  return [
    { title: '基础结构', points: ['开篇点题：明确题干不是单点知识，而是要求建立关系。', '论述：按理论背景、核心观点、案例影响分层展开。', '总结升华：联系当代设计议题，形成判断。'] },
    { title: '段落展开', points: [hints[0] || '论点1：界定核心理论和时代背景。', hints[1] || '论点2：说明它与当代设计议题的关系。', hints[2] || '论点3：加入跨领域案例，证明观点。', hints[3] || '结尾：回到设计价值、社会意义或未来趋势。'] }
  ];
}

function essayTips(item){
  return [
    '对比表格化：在论述中暗含对比维度，如“理念—形式—社会背景”。',
    '案例跨界：优先使用产品、视觉、建筑或数字设计案例，体现知识迁移。',
    '理论升华：结尾引用教材概念或当代议题，体现论述深度。'
  ];
}

function essayLossRows(){
  return [
    '只罗列知识点，没有围绕题干建立论证关系。',
    '案例单一或泛泛而谈，缺少具体设计对象。',
    '结尾停留在描述层面，没有上升到设计规律或社会意义。'
  ];
}

function keywordGroup(label, words, tone){
  return `
    <div class="keyword-group keyword-group--${tone}">
      <h4>${label}</h4>
      <div>${words.map(w=>keywordChip(w)).join('')}</div>
    </div>
  `;
}

function keywordChip(word){
  return `
    <details class="keyword-chip">
      <summary>${word}</summary>
      <p>${keywordDetail(word)}</p>
    </details>
  `;
}

function keywordDetail(word){
  return `答题时说明“${word}”与题目概念的关系，并补一句它在设计史或考研评分中的作用。`;
}

function mindNode(title, items){
  return `
    <section class="mind-node">
      <h4>${title}</h4>
      ${items.map(item=>`<span>${item}</span>`).join('')}
    </section>
  `;
}

function normalizeHint(item){
  if (item.hint && !Array.isArray(item.hint)) return item.hint;
  const hints = item.hint || [];
  const points = item.points || [];
  const title = item.title.replace(/\s*\/.*$/, '').replace(/[《》“”"，。]/g, '');
  return {
    keywords: {
      must: [title, points[0] || '核心定义'],
      important: [points[1] || '历史背景', points[2] || '代表案例'],
      extend: [points[3] || '设计史意义', '当代应用']
    },
    timeline: [
      { time: '起源', title: '概念出现', text: hints[0] || '先交代概念的时代、人物或理论来源。' },
      { time: '发展', title: '观点成型', text: hints[1] || '说明核心主张如何形成，并关联设计史背景。' },
      { time: '影响', title: '进入考点', text: hints[2] || '结合代表作品、人物或方法，说明它为何重要。' }
    ],
    map: {
      center: title,
      leftTop: ['全称 / 定义', hints[0] || '概念来源'],
      leftBottom: ['核心主张', points[0] || '方法特点'],
      rightTop: [points[1] || '设计应用', points[2] || '代表案例'],
      rightBottom: [points[3] || '历史意义', '答题落点']
    },
    tips: [
      hints[0] || '开头先用一句话给出清晰定义，避免绕弯。',
      hints[1] || '中段必须出现教材关键词，并结合人物或作品。',
      hints[2] || '结尾上升到设计史意义或当代启示。'
    ]
  };
}

function quizNavHtml(){
  if (Q.custom) return '';
  return `
    <div class="quiz-nav">
      <button class="btn btn--ghost" type="button" onclick="prevQ()">← 上一题</button>
      <button class="btn btn--primary" type="button" onclick="nextQ()">下一题 →</button>
    </div>
  `;
}

function switchLongPanel(name){
  document.querySelectorAll('.crumbtab').forEach(btn=>{
    btn.classList.toggle('is-on', btn.dataset.panel === name);
  });
  document.querySelectorAll('[data-long-panel]').forEach(panel=>{
    panel.classList.toggle('is-on', panel.dataset.longPanel === name);
  });
  if (name === 'answer') {
    const ta = document.getElementById('longInput');
    if (ta) ta.focus();
  }
}

function placeholderFor(t){
  return ({
    term:  '在此输入你的名词解释。建议结构：身份/时代 → 风格关键词 → 代表作 → 设计史意义。',
    short: '在此输入你的简答。建议先列 3—4 个要点，再逐点展开。',
    essay: '在此输入你的论述。建议结构：起（问题提出）→ 承（核心论证）→ 转（反思与对照）→ 合（结论与意义）。不少于 800 字。'
  })[t] || '';
}

function bindLong(item){
  const ta = document.getElementById('longInput');
  const wc = document.getElementById('wc');
  if (!ta) return;
  ta.focus();
  ta.addEventListener('input', ()=>{
    wc.textContent = `${ta.value.length} 字`;
  });
}

function toggleReveal(name){
  const el = document.getElementById('reveal-'+name);
  if (!el) return;
  el.classList.toggle('is-open');
}

/* ----- 智能模拟评分 ----- */
function aiGrade(){
  const ta = document.getElementById('longInput');
  if (!ta) return;
  const len = (ta.value || '').trim().length;
  if (len < 20) {
    alert('你的作答还太短（< 20 字），先写一点再交给智能评分吧。');
    return;
  }
  const item = currentItem();
  const reveal = document.getElementById('reveal-grade');
  const body   = document.getElementById('gradeBody');
  reveal.classList.add('is-open');
  body.innerHTML = `
    <div class="panel panel--score" style="display:flex;align-items:center;gap:16px;">
      <span class="thinking"><i></i><i></i><i></i></span>
      <span>智能系统正在按考研评分标准批改 · 通常 3 秒内</span>
    </div>
  `;
  setTimeout(()=>{
    body.innerHTML = renderScore(item, ta.value);
    recordPractice('智能评分', item);
    Q.answered[key()] = true;
  }, 1400);
}

function renderScore(item, text){
  // 基于长度 + 关键词命中粗略打分（仅 mock）
  const full = 100;
  const points = item.points || ['内容','结构','论据','语言'];
  const ref = (item.answer||[]).join('');
  const hit = points.map(p=>{
    const score = Math.min(100, Math.round(40 + Math.random()*55 + Math.min(20, text.length/20)));
    return { name: p, score };
  });
  const total = Math.round(hit.reduce((s,h)=>s+h.score,0) / hit.length / 100 * full);

  // 命中关键词
  const kws = (ref.match(/[\u4e00-\u9fa5]{2,4}/g) || []).slice(0,40);
  const matched = kws.filter(k => text.includes(k)).slice(0,6);
  const missed  = kws.filter(k => !text.includes(k)).slice(0,6);

  return `
    <div class="panel panel--score">
      <div class="panel__head"><b>智能评分 · 模拟阅卷</b><span>评分标准 · 浙江省统考</span></div>
      <div class="score">
        <div class="score__num">${total}<em>/ ${full} 分</em></div>
        <div class="score__bars">
          ${hit.map(h=>`
            <div class="score__bar">
              <span>${h.name}</span>
              <span class="bar" style="--w:${h.score}%"></span>
              <i>${Math.round(h.score)}</i>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="grade-sections">
        ${gradeSection('评分说明', scoreExplanation(Q.type, total, full, matched, missed))}
        ${gradeSection('改进建议', improvementAdvice(Q.type, total / full, missed))}
        ${gradeSection('参考补充', referenceSupplement(item, missed))}
      </div>
    </div>
  `;
}

function gradeSection(title, paragraphs){
  return `
    <section class="grade-section">
      <h3>${title}</h3>
      ${paragraphs.map(p=>`<p>${p}</p>`).join('')}
    </section>
  `;
}

function scoreExplanation(type, total, full, matched, missed){
  const typeName = labelFor(type);
  return [
    `本题按${typeName}题型模拟阅卷，当前得分为 ${total} / ${full} 分。评分主要看概念准确度、结构完整度、论据支撑和语言表达。`,
    `已体现的关键词：${matched.length ? matched.join('、') : '暂未明显命中参考关键词'}。需要补足的关键词：${missed.length ? missed.join('、') : '暂无明显遗漏'}。`
  ];
}

function improvementAdvice(type, ratio, missed){
  const base = comment(type, ratio);
  const typed = {
    term: '名词解释要先给出一句清晰定位，再补充时间、人物、代表作和设计史意义。',
    short: '简答题建议使用“总括句 + 2 到 3 个分点 + 结尾意义”的结构，避免整段堆叙。',
    essay: '论述题要先提出明确观点，再用分段论据展开，最后回到当代设计启示。'
  }[type] || '先搭建答题骨架，再补充关键词和案例。';
  return [
    base,
    `${typed}${missed.length ? ` 优先补充：${missed.slice(0,3).join('、')}。` : ''}`
  ];
}

function referenceSupplement(item, missed){
  const answer = item.answer || [];
  const points = item.points || [];
  const supplement = answer.slice(0, 2).join(' ');
  return [
    `可参考补充方向：${points.length ? points.join('、') : '概念界定、背景、案例、意义'}。`,
    supplement || `如果答案偏短，可以补充教材中的核心概念、代表案例和一句设计史意义。${missed.length ? `相关关键词包括：${missed.slice(0,4).join('、')}。` : ''}`
  ];
}

function comment(type, ratio){
  if (ratio > .85) return '结构完整、要点齐备、语言准确。继续保持，可在论据细节与案例的具体性上再多打磨。';
  if (ratio > .65) return '主要框架到位，但部分得分点（如时间、人物、代表作）有缺失或表述笼统，建议结合参考答案逐点对照补强。';
  if (ratio > .40) return '答到了核心概念，但论证链条偏短，案例不足。建议先用三段式骨架重写，再补充 2 个具体作品/事件。';
  return '基本只触及题面，缺乏关键术语与论据。建议先看『思路』搭建骨架，再回到题型卡片复习相关章节后重答。';
}

let PROFILE_VIEW = 'home';

function setProfileView(name){
  PROFILE_VIEW = name;
  if (name === 'arguments') ARG_FILTER.adding = false;
  renderProfile();
  renderAppNav();
}

function openProfileHome(){
  PROFILE_VIEW = 'home';
  goto(null, 'profile');
}

function openReview(){
  PROFILE_VIEW = 'reviewHome';
  goto(null, 'profile');
}

function logoutAccount(){
  PROFILE_VIEW = 'home';
  Q.custom = false;
  Q.searching = false;
  Q.recommended = false;
  Q.idx = 0;
  goto(null, 'login');
}

function openKnowledge(){
  PROFILE_VIEW = 'reviewHome';
  goto(null, 'profile');
}

function activeArea(){
  if (document.querySelector('[data-view="quiz"]')?.hidden === false) return 'practice';
  if (document.querySelector('[data-view="profile"]')?.hidden === false) {
    if (PROFILE_VIEW === 'arguments') return 'knowledge';
    if (PROFILE_VIEW === 'reviewHome' || PROFILE_VIEW === 'analysis' || PROFILE_VIEW === 'mistakes' || PROFILE_VIEW === 'records') return 'review';
    return 'review';
  }
  return '';
}

function renderAppNav(){
  const active = activeArea();
  document.querySelectorAll('[data-appnav]').forEach(nav=>{
    nav.innerHTML = [
      { key: 'practice', label: '答题练习', action: "goto(null,'quiz')" },
      { key: 'review', label: '个人学习信息', action: 'openReview()' }
    ].map(item=>`
      <button class="appnav__item${active === item.key ? ' is-on' : ''}" type="button" onclick="${item.action}">
        <span class="appnav__label">${item.label}</span>
      </button>
    `).join('');
  });
}

function renderProfile(){
  const el = document.getElementById('profileSpace');
  if (!el) return;
  const records = practiceRecords();
  const mistakes = mistakeItems();
  const args = argumentItems();
  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekly = records.filter(r=>r.time >= weekStart).length;
  const counts = ['fill','term','short','essay'].map(type=>({
    type,
    label: labelFor(type),
    count: records.filter(r=>r.type === type).length
  }));
  const max = Math.max(1, ...counts.map(c=>c.count));
  const recent = records.slice(0, 15);
  const themes = Array.from(new Set(args.map(item=>item.theme).filter(Boolean)));
  const weakType = counts.reduce((weak, c)=> c.count < weak.count ? c : weak, counts[0]);
  el.innerHTML = `
    ${PROFILE_VIEW === 'analysis' || PROFILE_VIEW === 'mistakes' || PROFILE_VIEW === 'records' ? '<button class="profile-inline-back" type="button" onclick="setProfileView(\'reviewHome\')">返回学习信息首页</button>' : ''}
    ${PROFILE_VIEW === 'reviewHome' ? renderLearningHome({records, weekly, mistakes, weakType}) : ''}
    ${PROFILE_VIEW === 'analysis' ? renderAnalysisVault(records, weekly, counts, max, recent) : ''}
    ${PROFILE_VIEW === 'mistakes' ? renderMistakeVault(mistakes) : ''}
    ${PROFILE_VIEW === 'records' ? renderRecordsVault(records, recent) : ''}
    ${PROFILE_VIEW === 'arguments' ? renderArgumentVault(args) : ''}
    ${PROFILE_VIEW === 'home' ? renderProfileHome({records, weekly, mistakes, args, themes, weakType}) : ''}
  `;
  stripFullWidthBrackets(el);
}

function renderReviewTabs(){
  return `
    <nav class="review-tabs" aria-label="复盘分类">
      <button class="review-tab${PROFILE_VIEW === 'analysis' ? ' is-on' : ''}" type="button" onclick="setProfileView('analysis')">练习分析</button>
      <button class="review-tab${PROFILE_VIEW === 'mistakes' ? ' is-on' : ''}" type="button" onclick="setProfileView('mistakes')">题目收藏夹</button>
      <button class="review-tab${PROFILE_VIEW === 'records' ? ' is-on' : ''}" type="button" onclick="setProfileView('records')">答题记录</button>
    </nav>
  `;
}

function renderProfileHome(data){
  return `
    <section class="account-home" aria-label="账号主页">
      <article class="account-card">
        <div class="account-card__head">
          <div class="account-avatar" aria-hidden="true">良</div>
          <div>
            <h2>良</h2>
          </div>
        </div>
        <dl class="account-profile-list">
          <div><dt>学校</dt><dd>${STATE.school || '浙江工业大学'}</dd></div>
          <div><dt>专业</dt><dd>${STATE.major || '视觉传达设计'}</dd></div>
          <div><dt>剩余额度</dt><dd>86 次智能评分</dd></div>
        </dl>
      </article>

      <aside class="account-panel" aria-label="账号操作">
        <button type="button" onclick="setProfileView('reviewHome')">
          <span>个人学习信息</span>
          <b>${data.records.length || 39} 次有效练习</b>
        </button>
        <button type="button" onclick="setProfileView('mistakes')">
          <span>题目收藏夹</span>
          <b>${data.mistakes.length || 15} 道收藏</b>
        </button>
        <button type="button" onclick="setProfileView('records')">
          <span>过往答题记录</span>
          <b>${data.weekly || 9} 次本周完成</b>
        </button>
        <div class="account-logout-wrap">
          <button class="account-logout-button" type="button" onclick="logoutAccount()" aria-label="退出账号">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 8l4 4-4 4M19 12H8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"/><path d="M13 5a8 8 0 1 0 0 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>
            <span>退出</span>
          </button>
        </div>
      </aside>
    </section>
  `;
}

function renderLearningHome(data){
  const latestMistake = data.mistakes[0];
  return `
    <section class="profile-home profile-home--learning" aria-label="个人学习信息">
      <article class="profile-module profile-module--portrait">
        <p class="profile-card-no">01</p>
        <h2>学习画像</h2>
        <div class="module-metrics">
          <span><b>${data.records.length || 39}</b>有效练习</span>
          <span><b>68%</b>知识覆盖</span>
          <span><b>${data.weakType?.label || '2 个'}</b>待补强</span>
        </div>
        <button class="btn btn--primary" type="button" onclick="setProfileView('analysis')">查看画像</button>
      </article>

      <article class="profile-module profile-module--collection">
        <p class="profile-card-no">02</p>
        <h2>题目收藏夹</h2>
        <div class="module-metrics">
          <span><b>${data.mistakes.length || 15}</b>已收藏</span>
          <span><b>${latestMistake ? labelFor(latestMistake.type) : '论述题'}</b>最近收藏</span>
          <span><b>${data.records.filter(r=>r.action.includes('智能')).length || 12}</b>已评分</span>
        </div>
        <button class="btn btn--primary" type="button" onclick="setProfileView('mistakes')">查看收藏</button>
      </article>

      <article class="profile-module profile-module--records">
        <p class="profile-card-no">03</p>
        <h2>过往答题记录</h2>
        <div class="module-metrics">
          <span><b>${data.records.length || 37}</b>全部记录</span>
          <span><b>${data.weekly || 9}</b>本周完成</span>
          <span><b>${data.records[0] ? labelFor(data.records[0].type) : '简答题'}</b>最近题型</span>
        </div>
        <button class="btn btn--primary" type="button" onclick="setProfileView('records')">查看记录</button>
      </article>
    </section>
  `;
}

function renderRecordsVault(records, recent){
  return `
    <article class="profile-panel vault-panel profile-detail-panel">
      <div class="vault-head">
        <div>
          <h2>过往答题记录</h2>
        </div>
        <span>${records.length} 条</span>
      </div>
      <ol class="practice-list">
        ${recent.length ? recent.map(r=>`
          <li>
            <b>${labelFor(r.type)}</b>
            <span>${escapeHtml(r.title)}</span>
            <em>${r.action} · ${formatPracticeTime(r.time)}</em>
          </li>
        `).join('') : '<li class="is-empty"><span>暂无答题记录</span><em>完成一次提交后会出现在这里</em></li>'}
      </ol>
    </article>
  `;
}

function renderAnalysisVault(records, weekly, counts, max, recent){
  const radar = [
    { label: '知识掌握', score: 73 },
    { label: '审题能力', score: 72 },
    { label: '结构组织', score: 71 },
    { label: '表达能力', score: 76 },
    { label: '案例运用', score: 73 },
    { label: '复盘主动性', score: 66 }
  ];
  const typeDistribution = [
    { label: '论述题', count: 19, ratio: 49 },
    { label: '名词解释', count: 7, ratio: 18 },
    { label: '简答题', count: 8, ratio: 21 },
    { label: '填空题', count: 5, ratio: 13 }
  ];
  const strongKnowledge = [
    { title: '后现代主义设计', score: 77, meta: '西方设计史 · 已练 5 题' },
    { title: '国际多域设计', score: 75, meta: '西方设计史 · 已练 4 题' },
    { title: '中国传统工艺', score: 75, meta: '中国设计史 · 已练 4 题' }
  ];
  const weakKnowledge = [
    { title: '中国古代器物与家具', score: 70, meta: '中国设计史 · 已练 3 题' },
    { title: '可持续与绿色设计', score: 70, meta: '产品与工业设计 · 已练 5 题' },
    { title: '现代设计师与代表作品', score: '未覆盖', meta: '西方设计史 · 已练 0 题' }
  ];
  return `
    <article class="portrait-page">
      <header class="portrait-head">
        <div>
          <h2>学习画像</h2>
          <p>基于最近 39 次有效练习生成，下一步建议围绕中国古代器物与家具优先补强。</p>
        </div>
        <button type="button" onclick="setProfileView('reviewHome')">刷新</button>
      </header>

      <section class="portrait-progress" aria-label="练习进度">
        <strong>39 / 50</strong>
        <i><em style="--w:78%"></em></i>
        <span>距离下一次画像更新还需 11 次有效练习</span>
      </section>

      <section class="portrait-grid portrait-grid--top">
        <article class="portrait-section">
          <h3>六维能力雷达</h3>
          ${renderAbilityRadar(radar)}
        </article>
        <article class="portrait-section portrait-summary">
          <h3>一句话总结</h3>
          <p>当前画像基于 39 次有效练习生成，表述能力相对稳定，下一步建议围绕中国古代器物与家具需要优先补强展开。</p>
          <div>
            <span><b>优势</b>表述能力相对稳定</span>
            <span><b>待关注</b>中国古代器物与家具、可持续与绿色设计</span>
          </div>
        </article>
      </section>

      <section class="portrait-section">
        <h3>做过题目的题型分布</h3>
        <div class="portrait-type-list">
          ${typeDistribution.map(item=>`
            <div>
              <span>${item.label}</span>
              <i><em style="--w:${item.ratio}%"></em></i>
              <b>${item.ratio}%</b>
              <small>${item.count} 道</small>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="portrait-section">
        <h3>知识诊断仪表盘</h3>
        <div class="portrait-kpi">
          <span><b>75</b>掌握指数</span>
          <span><b>68%</b>知识覆盖率</span>
          <span><b>11</b>未覆盖知识点</span>
          <span><b>2</b>待补强知识点</span>
        </div>
        <div class="portrait-grid">
          <div class="portrait-knowledge portrait-knowledge--strong">
            <h4>优势知识点</h4>
            ${strongKnowledge.map(item=>portraitKnowledgeItem(item)).join('')}
          </div>
          <div class="portrait-knowledge portrait-knowledge--weak">
            <h4>待处理知识点</h4>
            ${weakKnowledge.map(item=>portraitKnowledgeItem(item)).join('')}
          </div>
        </div>
      </section>

      <section class="portrait-section portrait-plan">
        <h3>本轮训练处方</h3>
        <ol>
          <li><b>现代设计师与代表作品</b><span>未覆盖，建议先补 3 组代表人物与作品关系。</span><button type="button">补题目</button></li>
          <li><b>设计教育</b><span>建议用时间线整理关键学校与人物。</span><button type="button">补题目</button></li>
          <li><b>西方古典与历史风格</b><span>需要补充风格识别和代表案例。</span><button type="button">补题目</button></li>
        </ol>
      </section>
    </article>
  `;
}

function portraitKnowledgeItem(item){
  const score = typeof item.score === 'number' ? item.score : 0;
  return `
    <article>
      <div><b>${item.title}</b><strong>${item.score}</strong></div>
      <span>${item.meta}</span>
      <i><em style="--w:${score}%"></em></i>
    </article>
  `;
}

function practiceRadar(records){
  return ['fill','term','short','essay'].map(type=>{
    const typeRecords = records.filter(r=>r.type === type);
    const score = typeRecords.length
      ? Math.round(typeRecords.reduce((sum, record)=>sum + scorePracticeRecord(record), 0) / typeRecords.length)
      : 0;
    return { type, label: labelFor(type), score, count: typeRecords.length };
  });
}

function scorePracticeRecord(record){
  if (record.action.includes('提交正确')) return 100;
  if (record.action.includes('提交错误')) return 35;
  if (record.action.includes('智能评分')) return 75;
  if (record.action.includes('查看答案')) return 45;
  return 60;
}

function renderPracticeRadar(rows){
  const cx = 150;
  const cy = 150;
  const radius = 94;
  const rings = [25, 50, 75, 100];
  const points = rows.map((row, i)=>radarPoint(cx, cy, radius * row.score / 100, i, rows.length));
  const axis = rows.map((row, i)=>{
    const end = radarPoint(cx, cy, radius, i, rows.length);
    const label = radarPoint(cx, cy, radius + 30, i, rows.length);
    return { row, end, label };
  });
  const best = rows.reduce((a,b)=> b.score > a.score ? b : a, rows[0]);
  const weak = rows.reduce((a,b)=> b.score < a.score ? b : a, rows[0]);
  return `
    <div class="radar-wrap">
      <div class="radar-plate">
        <svg class="radar-chart" viewBox="0 0 300 300" role="img" aria-label="题型能力雷达图">
          ${rings.map(ring=>`<polygon class="radar-ring" points="${rows.map((_, i)=>{
            const p = radarPoint(cx, cy, radius * ring / 100, i, rows.length);
            return `${p.x},${p.y}`;
          }).join(' ')}" />`).join('')}
          ${axis.map(item=>`<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${item.end.x}" y2="${item.end.y}" />`).join('')}
          <polygon class="radar-area" points="${points.map(p=>`${p.x},${p.y}`).join(' ')}" />
          ${points.map(p=>`<circle class="radar-dot" cx="${p.x}" cy="${p.y}" r="4" />`).join('')}
          ${axis.map(item=>`<text class="radar-label" x="${item.label.x}" y="${item.label.y}">${item.row.label}</text>`).join('')}
        </svg>
      </div>
      <div class="radar-side">
        <div class="radar-summary">
          <span><b>优势</b>${best.score ? best.label : '暂无'}</span>
          <span><b>待加强</b>${weak.score ? weak.label : '暂无'}</span>
        </div>
        <div class="radar-bars">
          ${rows.map(row=>`
            <div class="radar-bar">
              <span>${row.label}</span>
              <i><em style="--w:${row.score}%"></em></i>
              <b>${row.score}</b>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderAbilityRadar(rows){
  const cx = 180;
  const cy = 180;
  const radius = 112;
  const rings = [25, 50, 75, 100];
  const points = rows.map((row, i)=>radarPoint(cx, cy, radius * row.score / 100, i, rows.length));
  const axis = rows.map((row, i)=>{
    const end = radarPoint(cx, cy, radius, i, rows.length);
    const label = radarPoint(cx, cy, radius + 34, i, rows.length);
    return { row, end, label };
  });
  return `
    <svg class="ability-radar" viewBox="0 0 360 360" role="img" aria-label="六维能力雷达图">
      ${rings.map(ring=>`<polygon class="radar-ring" points="${rows.map((_, i)=>{
        const p = radarPoint(cx, cy, radius * ring / 100, i, rows.length);
        return `${p.x},${p.y}`;
      }).join(' ')}" />`).join('')}
      ${axis.map(item=>`<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${item.end.x}" y2="${item.end.y}" />`).join('')}
      <polygon class="radar-area" points="${points.map(p=>`${p.x},${p.y}`).join(' ')}" />
      ${points.map(p=>`<circle class="radar-dot" cx="${p.x}" cy="${p.y}" r="4" />`).join('')}
      ${axis.map(item=>`<text x="${item.label.x}" y="${item.label.y}" text-anchor="middle" dominant-baseline="middle">${item.row.label}<tspan x="${item.label.x}" dy="14">${item.row.score}</tspan></text>`).join('')}
    </svg>
  `;
}

function radarPoint(cx, cy, r, i, total){
  const angle = -Math.PI / 2 + i * Math.PI * 2 / total;
  return { x: Math.round((cx + Math.cos(angle) * r) * 10) / 10, y: Math.round((cy + Math.sin(angle) * r) * 10) / 10 };
}

function renderMistakeVault(items){
  const sampleItems = [
    { id: 'sample-furniture', type: 'term', title: '明式家具的造型特征与设计价值', source: '题目收藏夹', time: Date.now() - 3600000 },
    { id: 'sample-bauhaus', type: 'short', title: '简述包豪斯“艺术与技术新统一”的历史意义', source: '题目收藏夹', time: Date.now() - 7200000 },
    { id: 'sample-green', type: 'essay', title: '结合案例论述绿色设计在当代产品设计中的实践路径', source: '题目收藏夹', time: Date.now() - 86400000 },
    { id: 'sample-craft', type: 'term', title: '工艺美术运动', source: '题目收藏夹', time: Date.now() - 172800000 },
    { id: 'sample-container', type: 'fill', title: '中国古代器物中的礼制观念与造物秩序', source: '题目收藏夹', time: Date.now() - 259200000 }
  ];
  const shown = items.length ? items : sampleItems;
  return `
    <article class="profile-panel vault-panel vault-panel--mistakes">
      <div class="vault-head">
        <div>
          <h2>题目收藏夹</h2>
        </div>
        <span>${shown.length} 题</span>
      </div>
      <ol class="vault-list mistake-list">
        ${shown.map(item=>`
          <li>
            <b>${labelFor(item.type)}</b>
            <div>
              <span>${escapeHtml(item.title)}</span>
              <em>${item.source} · ${formatPracticeTime(item.time)}</em>
            </div>
            <button class="mini-action" type="button" onclick="viewCollectedQuestion('${escapeHtml(item.id)}')">查看详情</button>
          </li>
        `).join('')}
      </ol>
    </article>
  `;
}

function viewCollectedQuestion(id){
  alert(`这里将打开收藏题目详情：${id}`);
}

const ARG_FILTER = { theme: '全部', search: '', adding: false };

function renderArgumentVault(items){
  const allThemes = Array.from(new Set(items.map(item=>item.theme).filter(Boolean)));
  const keyword = ARG_FILTER.search.trim().toLowerCase();
  const visibleThemes = keyword ? allThemes.filter(theme=>theme.toLowerCase().includes(keyword)) : allThemes;
  const themes = ['全部', ...visibleThemes];
  const current = themes.includes(ARG_FILTER.theme) ? ARG_FILTER.theme : '全部';
  ARG_FILTER.theme = current;
  const shown = current === '全部' ? items : items.filter(item=>item.theme === current);
  const formTheme = current === '全部' ? '' : current;
  return `
    <article class="profile-panel vault-panel vault-panel--arguments argument-vault">
      <div class="vault-head">
        <div>
          <h2>我的知识库</h2>
        </div>
        <span>${items.length} 条</span>
      </div>

      <div class="argument-workspace">
        <aside class="argument-tags" aria-label="论据主题标签">
          <div class="argument-sidebar__tools">
            <input class="argument-search" type="search" placeholder="搜索主题" value="${escapeHtml(ARG_FILTER.search)}" oninput="setArgumentSearch(this.value)" />
            <button class="argument-new" type="button" onclick="startNewArgument()">＋</button>
          </div>
          <div class="argument-tags__list" role="list">
            ${themes.map(theme=>`
              <button class="argument-tag${theme === current ? ' is-on' : ''}" type="button" onclick="setArgumentFilter('${escapeHtml(theme)}')">
                <span>${theme === '全部' ? '默认排序' : escapeHtml(theme)}</span>
                <i>${theme === '全部' ? items.length : items.filter(item=>item.theme === theme).length}</i>
              </button>
            `).join('') || '<div class="argument-tag-empty">暂无主题</div>'}
          </div>
        </aside>

        <section class="argument-main">
          ${ARG_FILTER.adding ? `<form class="argument-form" onsubmit="addArgument(event)">
            <div class="argument-form__head">
              <span>新增</span>
            </div>
            <label>
              <span>主题</span>
              <input id="argumentThemeInput" name="theme" value="${escapeHtml(formTheme)}" placeholder="如：传统文化 / 科技设计" required />
            </label>
            <label>
              <span>论点</span>
              <textarea name="point" rows="3" placeholder="写一句可以直接放进论述题的观点" required></textarea>
            </label>
            <label>
              <span>论据</span>
              <textarea name="evidence" rows="4" placeholder="补充案例、作品、人物、材料或时代背景" required></textarea>
            </label>
            <button class="btn btn--primary" type="submit">存入知识库</button>
          </form>` : ''}

          ${ARG_FILTER.adding ? '' : `<div class="argument-section-head">
            <div>
              <span>已保存</span>
              <b>${escapeHtml(current)}</b>
            </div>
            <em>${shown.length} 条</em>
          </div>

          <ol class="argument-card-list">
            ${shown.length ? shown.map(item=>`
              <li class="argument-card">
                <div class="argument-card__tag">${escapeHtml(item.theme)}</div>
                <div class="argument-card__body">
                  <section>
                    <h4>论点</h4>
                    <p>${escapeHtml(item.point)}</p>
                  </section>
                  <section>
                    <h4>论据</h4>
                    <p>${escapeHtml(item.evidence)}</p>
                  </section>
                </div>
                <div class="argument-card__foot">
                  <time>${formatPracticeTime(item.time)}</time>
                  <button class="mini-action" type="button" onclick="deleteArgument('${escapeHtml(item.id)}')">删除</button>
                </div>
              </li>
            `).join('') : `<li class="argument-empty"><b>暂无内容</b></li>`}
          </ol>`}
        </section>
      </div>
    </article>
  `;
}

function addArgument(e){
  e.preventDefault();
  const form = e.currentTarget;
  const item = {
    id: `arg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    theme: form.theme.value.trim(),
    point: form.point.value.trim(),
    evidence: form.evidence.value.trim(),
    time: Date.now()
  };
  if (!item.theme || !item.point || !item.evidence) return;
  const items = argumentItems();
  items.unshift(item);
  saveArgumentItems(items);
  ARG_FILTER.theme = item.theme;
  ARG_FILTER.adding = false;
  renderProfile();
}

function startNewArgument(){
  ARG_FILTER.theme = '全部';
  ARG_FILTER.adding = true;
  renderProfile();
  setTimeout(()=>document.getElementById('argumentThemeInput')?.focus(), 0);
}

function deleteArgument(id){
  saveArgumentItems(argumentItems().filter(item=>item.id !== id));
  renderProfile();
}

function setArgumentFilter(theme){
  ARG_FILTER.theme = theme;
  ARG_FILTER.adding = false;
  renderProfile();
}

function setArgumentSearch(value){
  ARG_FILTER.search = value;
  renderProfile();
  setTimeout(()=>{
    const input = document.querySelector('.argument-search');
    if (!input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, 0);
}

function deleteMistake(id){
  saveMistakeItems(mistakeItems().filter(item=>item.id !== id));
  renderProfile();
}

function formatPracticeTime(time){
  const d = new Date(time);
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  const hh = String(d.getHours()).padStart(2,'0');
  const mi = String(d.getMinutes()).padStart(2,'0');
  return `${mm}.${dd} ${hh}:${mi}`;
}

/* ----- 侧栏 ----- */
function sideFor(type, item){
  const mistakeOn = isMistakeItem(item);
  if (type === 'fill') {
    return `
      <h4>题型 · 填空</h4>
      <button class="btn btn--ghost btn--sm" onclick="checkFill(currentItem())"><span>提交作答</span><b>回车</b></button>
      <button class="btn btn--ghost btn--sm" onclick="document.getElementById('fillReveal').classList.add('is-open'); revealAnswer()"><span>直接看答案</span><b>看</b></button>
      <button class="btn btn--ghost btn--sm mistake-toggle${mistakeOn ? ' is-on' : ''}" onclick="toggleCurrentMistake()"><span>${mistakeOn ? '已收藏' : '加入收藏'}</span><b>✓</b></button>
      <p class="qside__note">
        填空题占总分 <b>10%</b><br/>
        本组共 ${getQuizList().length} 题<br/>
        节奏建议：每题 ≤ 1 分钟
      </p>
    `;
  }
  return `
    <h4>题型 · ${labelFor(type)}</h4>
    <button class="btn btn--ghost btn--sm" onclick="toggleReveal('hint')"><span>查看思路</span><b>思</b></button>
    <button class="btn btn--ghost btn--sm" onclick="toggleReveal('answer')"><span>参考答案</span><b>答</b></button>
    <button class="btn btn--ghost btn--sm mistake-toggle${mistakeOn ? ' is-on' : ''}" onclick="toggleCurrentMistake()"><span>${mistakeOn ? '已收藏' : '加入收藏'}</span><b>✓</b></button>
    <button class="btn btn--primary btn--sm" onclick="aiGrade()"><span>智能评分</span><b>↵</b></button>
    <p class="qside__note">
      ${type==='term' ? '名词解释占 <b>15%</b>' : type==='short' ? '简答题占 <b>30%</b>' : '论述题占 <b>40%</b>'}<br/>
      本题建议时长：${item.meta?.match(/\d+\s*分钟/)?.[0] || '8 分钟'}<br/>
      允许"先答再看 / 先看再答"两种模式
    </p>
  `;
}

function revealAnswer(){
  const item = currentItem();
  const result = document.getElementById('fillResult');
  if (!result) return;
  result.className = 'fill-result is-open';
  result.innerHTML = `答案：${item.answer.join(' / ')}`;
  recordPractice('查看答案', item);
}
