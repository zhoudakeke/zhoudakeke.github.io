"use strict";

const DB_NAME = "shilvpai-ai-prototype-v2";
const DB_VERSION = 1;
const SNAPSHOT_KEY = "app-snapshot";
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MIN_IMAGE_WIDTH = 480;
const MIN_IMAGE_HEIGHT = 640;
const GENERATION_DURATION_MS = 9000;
const PREVIEW_GENERATION_DURATION_MS = 5200;
const MAX_PREVIEW_REROLLS = 2;
const ITEM_RETRY_DURATION_MS = 4200;
const HOME_CASE_INTERVAL_MS = 5600;
const PAYMENT_RECOVERY_DURATION_MS = 1600;
const GENERATION_POINTS_COST = 60;
const PAYMENT_OFFER = Object.freeze({
  originalAmount: 19.9,
  memberAmount: 9.9,
  posterCount: 1,
  vlogCount: 1,
  pointsCost: GENERATION_POINTS_COST
});
// 快速回退：网址追加 customLayout=legacy 即可恢复“全部分类纵向展开”的旧版布局。
const COMPACT_CUSTOM_OPTIONS_ENABLED = new URLSearchParams(window.location.search).get("customLayout") !== "legacy";

const tdIcon = (name, size = 24) => `<t-icon class="t-icon t-icon-${name}" name="${name}" size="${size}px" aria-hidden="true"></t-icon>`;
const uid = prefix => `${prefix}-${Date.now().toString(36)}-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`;
const clone = value => JSON.parse(JSON.stringify(value));

const MEDIA = Object.freeze({
  homeHeroFixed: "../../assets/images/home-hero-fixed-olive.webp",
  homePlaceWestLake: "../../assets/images/home-place-west-lake.webp",
  homePlaceForbiddenCity: "../../assets/images/home-place-forbidden-city.webp",
  homePlaceHumbleAdministratorsGarden: "../../assets/images/home-place-humble-administrators-garden.webp",
  homePlaceWuzhen: "../../assets/images/home-place-wuzhen.webp",
  homePlaceJichangGarden: "../../assets/images/home-place-jichang-garden.webp",
  homePlaceGiantWildGoosePagoda: "../../assets/images/home-place-giant-wild-goose-pagoda.webp",
  westLakeEveningGoldPhotos: [
    "../../assets/images/places/west-lake-evening-gold/01.webp",
    "../../assets/images/places/west-lake-evening-gold/02.webp",
    "../../assets/images/places/west-lake-evening-gold/03.webp",
    "../../assets/images/places/west-lake-evening-gold/04.webp",
    "../../assets/images/places/west-lake-evening-gold/05.webp",
    "../../assets/images/places/west-lake-evening-gold/06.webp"
  ],
  inspirationSpringWaterCover: "../../assets/images/inspirations/spring-water-red-clothing/cover.webp",
  inspirationSpringWaterPhotos: [
    "../../assets/images/inspirations/spring-water-red-clothing/01.webp",
    "../../assets/images/inspirations/spring-water-red-clothing/02.webp",
    "../../assets/images/inspirations/spring-water-red-clothing/03.webp",
    "../../assets/images/inspirations/spring-water-red-clothing/04.webp",
    "../../assets/images/inspirations/spring-water-red-clothing/05.webp"
  ],
  inspirationFlowerShadowGardenPhotos: [
    "../../assets/images/inspirations/flower-shadow-garden/01.webp",
    "../../assets/images/inspirations/flower-shadow-garden/02.webp",
    "../../assets/images/inspirations/flower-shadow-garden/03.webp",
    "../../assets/images/inspirations/flower-shadow-garden/04.webp",
    "../../assets/images/inspirations/flower-shadow-garden/05.webp",
    "../../assets/images/inspirations/flower-shadow-garden/06.webp"
  ],
  inspirationMapleStreamShadowPhotos: [
    "../../assets/images/inspirations/maple-stream-shadow/01.webp",
    "../../assets/images/inspirations/maple-stream-shadow/02.webp",
    "../../assets/images/inspirations/maple-stream-shadow/03.webp",
    "../../assets/images/inspirations/maple-stream-shadow/04.webp",
    "../../assets/images/inspirations/maple-stream-shadow/05.webp"
  ],
  portraitNearGuide: "../../assets/images/minimal-person-half-body-tight-green.webp",
  portraitFullGuide: "../../assets/images/minimal-person-full-body-tight-green.webp",
  portraitNear: "../../样图/半身图.webp",
  portraitFull: "../../样图/全身图.webp",
  resultPhotos: [
    "../../样图/人物02-汉服静态写真合集/3x4-1080x1440/01-廊桥近景团扇.webp",
    "../../样图/人物02-汉服静态写真合集/3x4-1080x1440/02-暗廊立姿团扇.webp",
    "../../样图/人物02-汉服静态写真合集/3x4-1080x1440/03-暗廊侧身团扇.webp",
    "../../样图/人物02-汉服静态写真合集/3x4-1080x1440/04-竹园持画轴.webp",
    "../../样图/人物02-汉服静态写真合集/3x4-1080x1440/05-月洞门持扇.webp",
    "../../样图/人物02-汉服静态写真合集/3x4-1080x1440/06-竹林山石坐姿.webp",
    "../../样图/人物02-汉服静态写真合集/3x4-1080x1440/07-月洞门赏石.webp"
  ],
  resultVideo: "../../output/videos/hanfu-fanghua-beat-v4-fadeout.mp4"
});

const styleOptions = [
  { id: "moon-white", name: "月白飞仙", note: "月白襦裙 · 高髻花钿 · 玉色配饰", image: MEDIA.resultPhotos[0], recommended: true },
  { id: "red-palace", name: "宫墙朱砂", note: "朱砂礼服 · 云鬓金钗 · 明艳妆容", image: MEDIA.resultPhotos[1] },
  { id: "bamboo-green", name: "竹青云衫", note: "竹青长衫 · 素雅发冠 · 清透妆面", image: MEDIA.resultPhotos[5] },
  { id: "ink-gold", name: "墨金长歌", note: "墨金披帛 · 高束发髻 · 电影感配饰", image: MEDIA.resultPhotos[3] },
  { id: "peach-cloud", name: "桃粉云衫", note: "杏粉短衫 · 浅青长裙 · 花枝配饰", image: MEDIA.inspirationFlowerShadowGardenPhotos[0] },
  { id: "maple-indigo", name: "枫溪蓝黛", note: "蓝黛长裙 · 暖杏披帛 · 秋色配饰", image: MEDIA.inspirationMapleStreamShadowPhotos[3] },
  { id: "water-red", name: "绯衣照水", note: "绯红短袄 · 青灰长裙 · 水岸花饰", image: MEDIA.inspirationSpringWaterPhotos[0] },
  { id: "evening-gold", name: "晚照流金", note: "金黄长衫 · 柳绿披帛 · 晚照轻纱", image: MEDIA.westLakeEveningGoldPhotos[0] }
];

const hairOptions = [
  { id: "cloud-high-bun", name: "唐·模版2", note: "花饰高髻 · 清透桃妆", image: "../../assets/images/grooming/tang-template-2.png", recommended: true },
  { id: "double-ring-bun", name: "唐·模版1", note: "红花环髻 · 朱唇花钿", image: "../../assets/images/grooming/tang-template-1.png" },
  { id: "low-cloud-bun", name: "战国·白玉簪", note: "白玉发簪 · 柔和淡妆", image: "../../assets/images/grooming/warring-states-white-jade.png" },
  { id: "high-ponytail", name: "宋·花钗", note: "花钗盘髻 · 温婉妆容", image: "../../assets/images/grooming/song-floral-hairpin.png" }
];

const maleHairOptions = [
  {
    "id": "male-song-scholar",
    "name": "宋·书韵",
    "note": "男款妆发",
    "gender": "male",
    "image": "./assets/grooming/male/male-song-scholar.png"
  },
  {
    "id": "male-song-tea",
    "name": "宋·清茗",
    "note": "男款妆发",
    "gender": "male",
    "image": "./assets/grooming/male/male-song-tea.png"
  },
  {
    "id": "male-swordsman",
    "name": "侠客·竹影",
    "note": "男款妆发",
    "gender": "male",
    "image": "./assets/grooming/male/male-swordsman.png"
  }
];

function hairOptionsForDraft(draft) {
  return draft?.gender === "male" ? maleHairOptions : hairOptions;
}

const makeupOptions = [
  { id: "clear-flower", name: "清透花钿", note: "清透底妆 · 桃色唇妆 · 小花钿", image: "../../output/makeup-templates/series/03-blue-huadian-pink-makeup.webp", recommended: true },
  { id: "cinnabar-palace", name: "朱砂宫妆", note: "暖色眼妆 · 朱砂红唇 · 明艳花钿", image: "../../output/makeup-templates/series/01-red-blossom-makeup.webp" },
  { id: "mist-brow", name: "烟岚黛眉", note: "雾感黛眉 · 柔和腮红 · 低饱和唇色", image: "../../output/makeup-templates/series/02-pale-blossom-pink-makeup.webp" },
  { id: "gold-evening", name: "金粉晚妆", note: "金色眼饰 · 红棕唇色 · 电影感轮廓", image: "../../output/makeup-templates/series/04-peach-coral-makeup.webp" }
];

const clothingOptions = styleOptions.map(item => ({ ...item }));

const sceneOptions = [
  { id: "watertown", name: "江南水乡", note: "柔光水岸 · 白墙黛瓦", image: "../../output/imagegen/江南水乡-高清3x4.webp", recommended: true },
  { id: "bamboo", name: "竹林山石", note: "青竹疏影 · 山石坐景", image: MEDIA.resultPhotos[5] },
  { id: "moon-gate", name: "月洞门庭", note: "庭院层次 · 午后侧光", image: MEDIA.resultPhotos[4] },
  { id: "dark-corridor", name: "暗廊流光", note: "深色廊柱 · 戏剧光影", image: MEDIA.resultPhotos[2] },
  { id: "lake-evening", name: "湖畔晚照", note: "暖金水色 · 远山暮影", image: MEDIA.homePlaceWestLake },
  { id: "red-wall", name: "宫墙丹影", note: "朱红宫墙 · 庄重光影", image: MEDIA.homePlaceForbiddenCity },
  { id: "garden-courtyard", name: "园林深庭", note: "叠石曲径 · 浓绿庭荫", image: MEDIA.homePlaceJichangGarden },
  { id: "water-lane", name: "乌篷水巷", note: "临水木舟 · 柔和晨光", image: MEDIA.homePlaceWuzhen }
];

const templateOptions = [
  { id: "cinematic", name: "芳华电影感", note: "缓推 · 叠化 · 国风弦乐", photoCount: 7, duration: 12, ratio: "3:4", image: MEDIA.resultPhotos[4], recommended: true },
  { id: "beat", name: "花影卡点", note: "节奏切换 · 闪入闪出 · 轻快鼓点", photoCount: 5, duration: 10, ratio: "3:4", image: MEDIA.resultPhotos[3] },
  { id: "ink", name: "水墨留白", note: "慢移 · 墨色转场 · 箫笛氛围", photoCount: 4, duration: 8, ratio: "3:4", image: MEDIA.resultPhotos[6] }
];

const customOptionCategories = [
  { key: "hair", label: "发型", title: "选择发型", options: hairOptions, draftKey: "hairId" },
  { key: "makeup", label: "妆容", title: "选择妆容", options: makeupOptions, draftKey: "makeupId" },
  { key: "clothing", label: "服装", title: "选择服装", options: clothingOptions, draftKey: "clothingId" },
  { key: "scene", label: "场景", title: "选择场景", options: sceneOptions, draftKey: "sceneId" },
  { key: "template", label: "运镜", title: "选择运镜", options: templateOptions, draftKey: "templateId" }
];

const customOptionGroups = [
  { key: "grooming", label: "妆发", categoryKeys: ["hair", "makeup"] },
  { key: "theme", label: "主题", categoryKeys: ["clothing", "scene", "template"] }
];

function customCategoriesForGroup(group, draft) {
  return group.categoryKeys.map(key => customOptionCategories.find(item => item.key === key)).filter(Boolean)
    .map(category => category.key === "hair" ? { ...category, options: hairOptionsForDraft(draft) } : category);
}

function normalizeCreateOptionGroup(value) {
  if (["grooming", "hair", "makeup"].includes(value)) return "grooming";
  if (["theme", "clothing", "scene", "template"].includes(value)) return "theme";
  return "grooming";
}

const officialCases = [
  { id: "case-flower-shadow-garden", title: "《花影闲庭》", note: "六张国风写真 · 园林花影", styleId: "moon-white", sceneId: "moon-gate", templateId: "cinematic", image: MEDIA.inspirationFlowerShadowGardenPhotos[0], position: "50% 18%", photos: MEDIA.inspirationFlowerShadowGardenPhotos },
  { id: "case-water", title: "《春水照绯衣》", note: "五张国风写真 · 水岸绯衣", styleId: "red-palace", sceneId: "watertown", templateId: "cinematic", image: MEDIA.inspirationSpringWaterPhotos[0], position: "50% 5%", photos: MEDIA.inspirationSpringWaterPhotos },
  { id: "case-maple-stream-shadow", title: "《枫溪照影》", note: "五张国风写真 · 枫溪秋影", styleId: "bamboo-green", sceneId: "bamboo", templateId: "ink", image: MEDIA.inspirationMapleStreamShadowPhotos[0], position: "50% 74%", photos: MEDIA.inspirationMapleStreamShadowPhotos },
  { id: "case-corridor", title: "暗廊朱砂", note: "宫墙朱砂 × 暗廊流光", styleId: "red-palace", sceneId: "dark-corridor", templateId: "beat", image: MEDIA.resultPhotos[2] },
  { id: "case-bamboo", title: "竹影清梦", note: "竹青云衫 × 竹林山石", styleId: "bamboo-green", sceneId: "bamboo", templateId: "ink", image: MEDIA.resultPhotos[5] }
];



const maleOneClickTemplateCases = [
  {
    "caseId": "case-male-swordsman",
    "name": "蜀山剑影",
    "image": "./assets/templates/male/swordsman/01.png",
    "photos": [
      "./assets/templates/male/swordsman/01.png",
      "./assets/templates/male/swordsman/02.png",
      "./assets/templates/male/swordsman/03.png",
      "./assets/templates/male/swordsman/04.png",
      "./assets/templates/male/swordsman/05.png",
      "./assets/templates/male/swordsman/06.png"
    ],
    "position": "50% 50%",
    "overlay": "rgba(38, 41, 31, 0.88)",
    "styleId": "ink-gold",
    "sceneId": "bamboo"
  },
  {
    "caseId": "case-male-song-scholar",
    "name": "汴京书韵",
    "image": "./assets/templates/male/song-scholar/01.png",
    "photos": [
      "./assets/templates/male/song-scholar/01.png",
      "./assets/templates/male/song-scholar/02.png",
      "./assets/templates/male/song-scholar/03.png",
      "./assets/templates/male/song-scholar/04.png",
      "./assets/templates/male/song-scholar/05.png",
      "./assets/templates/male/song-scholar/06.png"
    ],
    "position": "50% 50%",
    "overlay": "rgba(38, 41, 31, 0.88)",
    "styleId": "red-palace",
    "sceneId": "dark-corridor"
  },
  {
    "caseId": "case-male-song-tea",
    "name": "西湖清茗",
    "image": "./assets/templates/male/song-tea/01.png",
    "photos": [
      "./assets/templates/male/song-tea/01.png",
      "./assets/templates/male/song-tea/02.png",
      "./assets/templates/male/song-tea/03.png",
      "./assets/templates/male/song-tea/04.png",
      "./assets/templates/male/song-tea/05.png",
      "./assets/templates/male/song-tea/06.png"
    ],
    "position": "50% 50%",
    "overlay": "rgba(38, 41, 31, 0.88)",
    "styleId": "moon-white",
    "sceneId": "watertown"
  }
];


// 女款封面按用户 2026-09-14 提供的五张原图排序；详情使用同一份素材。
const femaleOneClickTemplateCases = [
  {
    "caseId": "case-female-tang-flower",
    "name": "长安花宴",
    "image": "./assets/templates/female/tang-flower.png",
    "position": "50% 50%",
    "overlay": "rgba(38, 41, 31, 0.88)",
    "styleId": "peach-cloud",
    "sceneId": "moon-gate"
  },
  {
    "caseId": "case-female-tang-red",
    "name": "曲江绯影",
    "image": "./assets/templates/female/tang-red.png",
    "position": "50% 50%",
    "overlay": "rgba(38, 41, 31, 0.88)",
    "styleId": "water-red",
    "sceneId": "watertown"
  },
  {
    "caseId": "case-female-warring-states-plum",
    "name": "姑苏梅影",
    "image": "./assets/templates/female/warring-states-plum.png",
    "position": "50% 50%",
    "overlay": "rgba(38, 41, 31, 0.88)",
    "styleId": "moon-white",
    "sceneId": "garden-courtyard"
  },
  {
    "caseId": "case-female-song-cyan",
    "name": "临安青梦",
    "image": "./assets/templates/female/song-cyan.png",
    "position": "50% 50%",
    "overlay": "rgba(38, 41, 31, 0.88)",
    "styleId": "bamboo-green",
    "sceneId": "moon-gate"
  },
  {
    "caseId": "case-female-ming-fan",
    "name": "金陵扇语",
    "image": "./assets/templates/female/ming-fan.png",
    "position": "50% 50%",
    "overlay": "rgba(38, 41, 31, 0.88)",
    "styleId": "bamboo-green",
    "sceneId": "garden-courtyard"
  }
];

// 注册现有女款主题，供创作与首页展示共用。
officialCases.push(...femaleOneClickTemplateCases.map(item => ({
  id: item.caseId,
  title: item.name,
  note: "女款模版",
  gender: "female",
  styleId: item.styleId,
  sceneId: item.sceneId,
  templateId: "cinematic",
  image: item.image,
  position: item.position,
  photos: [item.image],
  videoSource: ""
})));

// 男款独立注册，封面与详情图集来自同一组素材。
officialCases.push(...maleOneClickTemplateCases.map(item => ({
  id: item.caseId,
  title: item.name,
  note: "男款模版 · 六张写真",
  gender: "male",
  styleId: item.styleId,
  sceneId: item.sceneId,
  templateId: "cinematic",
  image: item.image,
  position: item.position,
  photos: item.photos,
  videoSource: ""
})));

function creationTemplateCases(draft) {
  return draft?.gender === "male" ? maleOneClickTemplateCases : femaleOneClickTemplateCases;
}

// 首页两个栏目各两女一男，使用六个不同主题，封面、详情与创作共用主题数据。
const homeInspirationCases = [
  "case-female-tang-flower",
  "case-female-ming-fan",
  "case-male-swordsman"
].map(id => ({ ...officialCases.find(item => item.id === id), position: "50% 12%" }));

const popularPlaces = [
  { id: "qujiang", name: "曲江", caseId: "case-female-tang-red", position: "50% 25%" },
  { id: "gusu", name: "姑苏", caseId: "case-female-warring-states-plum", position: "50% 13%" },
  { id: "west-lake", name: "西湖", caseId: "case-male-song-tea", position: "50% 27%" }
].map(place => {
  const theme = officialCases.find(item => item.id === place.caseId);
  return {
    ...place,
    detailTitle: theme.title,
    galleryTitle: theme.title,
    gender: theme.gender,
    image: theme.image,
    position: place.position,
    photos: theme.photos,
    videoSource: theme.videoSource,
    overlay: "rgba(38, 41, 31, 0.88)"
  };
});

const homeHero = {
  image: MEDIA.homeHeroFixed,
  alt: "一念入画，万般风华"
};

const editorSteps = [
  ["hair", "发型"],
  ["makeup", "妆容"],
  ["clothing", "服装"],
  ["scene", "场景"],
  ["template", "运镜"],
  ["confirm", "确认"]
];

const routeMeta = {
  home: { title: "施·旅拍", tab: true, back: false, label: "首页" },
  create: { title: "一键旅拍", tab: true, back: false, label: "一键旅拍" },
  profile: { title: "我的", tab: true, back: false, label: "我的" },
  works: { title: "我的作品", tab: false, back: true, label: "作品" },
  member: { title: "会员中心", tab: false, back: true, label: "会员" },
  drafts: { title: "我的草稿", tab: false, back: true, label: "草稿" },
  orders: { title: "我的订单", tab: false, back: true, label: "订单" },
  order: { title: "订单详情", tab: false, back: true, label: "订单详情" },
  inspiration: { title: "灵感图集", tab: false, back: true, label: "热门灵感" },
  place: { title: "地点写真", tab: false, back: true, label: "热门场景" },
  editor: { title: "创作方案", tab: false, back: true, label: "创作编辑器" },
  generating: { title: "正在生成", tab: false, back: true, label: "生成任务" },
  appearance: { title: "形象确认", tab: false, back: true, label: "形象确认" },
  work: { title: "作品详情", tab: false, back: true, label: "作品详情" },
  benefits: { title: "成为超级会员", tab: false, back: true, label: "超级会员" }
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function optionById(options, id) {
  return options.find(item => item.id === id) || options[0];
}

function customLookByDraft(draft) {
  return {
    hair: optionById(hairOptionsForDraft(draft), draft?.hairId),
    makeup: optionById(makeupOptions, draft?.makeupId),
    clothing: optionById(clothingOptions, draft?.clothingId || draft?.styleId)
  };
}

function createDraft(presetCase = null) {
  const now = Date.now();
  return {
    id: uid("draft"),
    createdAt: now,
    updatedAt: now,
    status: "draft",
    saved: false,
    gender: presetCase?.gender === "male" ? "male" : "female",
    sourceCaseId: presetCase?.id || null,
    parentWorkId: null,
    portraits: {
      near: { kind: "near", status: "empty", blobId: null, previewUrl: "", name: "", width: 0, height: 0, error: "" },
      full: { kind: "full", status: "empty", blobId: null, previewUrl: "", name: "", width: 0, height: 0, error: "" }
    },
    styleId: presetCase?.styleId || styleOptions[0].id,
    hairId: presetCase?.hairId || hairOptionsForDraft(presetCase)[0].id,
    makeupId: presetCase?.makeupId || makeupOptions[0].id,
    clothingId: presetCase?.clothingId || presetCase?.styleId || clothingOptions[0].id,
    sceneId: presetCase?.sceneId || sceneOptions[0].id,
    templateId: presetCase?.templateId || templateOptions[0].id,
    outputs: { photo: true, video: true },
    customized: Boolean(presetCase?.customized),
    workId: null
  };
}

function createSampleDraft(presetCase = null) {
  const draft = createDraft(presetCase);
  draft.portraits.near = { kind: "near", status: "ready", blobId: "sample-near", previewUrl: MEDIA.portraitNear, name: "示例近照.jpg", width: 1200, height: 1600, error: "" };
  draft.portraits.full = { kind: "full", status: "ready", blobId: "sample-full", previewUrl: MEDIA.portraitFull, name: "示例全身照.png", width: 1200, height: 1600, error: "" };
  return draft;
}

function defaultSnapshot() {
  return {
    version: 2,
    activeDraftId: null,
    drafts: [],
    tasks: [],
    works: [],
    orders: [],
    settings: {
      privacyAccepted: false,
      creationMode: "template",
      profileLoggedIn: true,
      memberTier: "普通会员",
      memberExpiresAt: "",
      creationPoints: 0,
      createdAt: Date.now()
    }
  };
}

const storage = {
  db: null,
  available: true,
  memorySnapshot: null,
  memoryBlobs: new Map(),

  async open() {
    if (!window.indexedDB) {
      this.available = false;
      return null;
    }
    try {
      this.db = await new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
          if (!db.objectStoreNames.contains("blobs")) db.createObjectStore("blobs", { keyPath: "id" });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      return this.db;
    } catch (error) {
      console.warn("IndexedDB unavailable", error);
      this.available = false;
      return null;
    }
  },

  request(storeName, mode, operation) {
    if (!this.db) return Promise.reject(new Error("IndexedDB 未连接"));
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = operation(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });
  },

  async getSnapshot() {
    if (!this.available || !this.db) return this.memorySnapshot;
    const record = await this.request("meta", "readonly", store => store.get(SNAPSHOT_KEY));
    return record?.value || null;
  },

  async putSnapshot(snapshot) {
    this.memorySnapshot = clone(snapshot);
    if (!this.available || !this.db) return;
    await this.request("meta", "readwrite", store => store.put({ key: SNAPSHOT_KEY, value: snapshot }));
  },

  async putBlob(id, blob, meta = {}) {
    this.memoryBlobs.set(id, { id, blob, ...meta });
    if (!this.available || !this.db) return;
    await this.request("blobs", "readwrite", store => store.put({ id, blob, ...meta }));
  },

  async getBlob(id) {
    if (this.memoryBlobs.has(id)) return this.memoryBlobs.get(id);
    if (!this.available || !this.db) return null;
    const record = await this.request("blobs", "readonly", store => store.get(id));
    if (record) this.memoryBlobs.set(id, record);
    return record || null;
  },

  async deleteBlob(id) {
    this.memoryBlobs.delete(id);
    if (!this.available || !this.db) return;
    await this.request("blobs", "readwrite", store => store.delete(id));
  },

  async clear() {
    this.memorySnapshot = null;
    this.memoryBlobs.clear();
    if (!this.available || !this.db) return;
    await Promise.all([
      this.request("meta", "readwrite", store => store.clear()),
      this.request("blobs", "readwrite", store => store.clear())
    ]);
  }
};

const params = new URLSearchParams(window.location.search);
const isPreviewMode = params.get("preview") === "1";
const allowsPreviewOverride = isPreviewMode;
const previewCreationMode = allowsPreviewOverride && ["template", "custom"].includes(params.get("mode"))
  ? params.get("mode")
  : null;
const isFigmaLongCapture = allowsPreviewOverride && params.get("figma") === "long";

document.documentElement.classList.toggle("figma-long-capture", isFigmaLongCapture);

const state = {
  initialized: false,
  snapshot: defaultSnapshot(),
  route: allowsPreviewOverride && routeMeta[params.get("route")] ? params.get("route") : "home",
  tab: "home",
  history: [],
  editorStep: allowsPreviewOverride && editorSteps.some(([key]) => key === params.get("step")) ? params.get("step") : "confirm",
  editorHistory: [],
  activeTaskId: null,
  activeWorkId: null,
  activeOrderId: null,
  activeCaseId: null,
  activePlaceId: null,
  demoState: allowsPreviewOverride ? params.get("state") || "normal" : "normal",
  activeUploadSlot: null,
  mediaUrls: new Map(),
  toastTimer: null,
  ticker: null,
  homeCaseIndex: 0,
  homeCaseTimer: null,
  homeCaseSwipeStart: null,
  homeCaseCarouselPaused: false,
  gallerySection: ["photos", "poster", "vlog"].includes(params.get("gallery")) ? params.get("gallery") : "photos",
  createOptionCategory: normalizeCreateOptionGroup(params.get("category")),
  lastAutoOpenedWorkId: null,
  lastAutoOpenedPreviewTaskId: null,
  downloadSelectionWorkId: null,
  downloadSelectionIds: new Set(),
  draftBaselines: new Map(),
  dirtyDraftIds: new Set(),
  pendingDraftExit: null,
  rechargePackId: "pack-2",
  benefitFocus: null,
  paymentBusy: false,
  paymentRecoveryTimer: null
};

if (["home", "create", "profile"].includes(state.route)) state.tab = state.route;

const screen = document.querySelector("#screen");
const device = document.querySelector("#device");
const appBar = document.querySelector("#app-bar");
const appBack = document.querySelector("#app-back");
const appTitle = document.querySelector("#app-title");
const appEyebrow = document.querySelector("#app-eyebrow");
const tabBar = document.querySelector("#tab-bar");
const routeLabel = document.querySelector("#route-label");
const platformSizeLabel = document.querySelector("#platform-size-label");
const toast = document.querySelector("#toast");
const sheetLayer = document.querySelector("#sheet-layer");
const sheet = document.querySelector("#bottom-sheet");
const sheetContent = document.querySelector("#sheet-content");
const portraitFile = document.querySelector("#portrait-file");

function updatePlatformSizeLabel(metrics = window.ShilvpaiPlatform?.metrics) {
  if (platformSizeLabel && metrics) platformSizeLabel.textContent = `${metrics.windowWidth} × ${metrics.windowHeight} · 750rpx基准`;
}

window.addEventListener("shilvpai:platformchange", event => updatePlatformSizeLabel(event.detail));
updatePlatformSizeLabel();

function showToast(message) {
  clearTimeout(state.toastTimer);
  toast.textContent = message;
  toast.classList.add("toast--show");
  state.toastTimer = setTimeout(() => toast.classList.remove("toast--show"), 2400);
}

function closeSheet() {
  sheetLayer.classList.remove("sheet-layer--open");
  sheetLayer.hidden = true;
  sheetContent.innerHTML = "";
  state.pendingDraftExit = null;
}

function openSheet(html, className = "") {
  sheet.className = `bottom-sheet t-popup t-popup--bottom ${className}`.trim();
  sheetContent.innerHTML = html;
  sheetLayer.hidden = false;
  requestAnimationFrame(() => sheetLayer.classList.add("sheet-layer--open"));
}

function openAppearanceImage(source, label) {
  if (!source) return;
  const title = label || "图片预览";
  openSheet(`<div class="appearance-image-viewer">
    <header><strong id="sheet-title">${escapeHtml(title)}</strong><button type="button" data-action="close-sheet" aria-label="关闭大图">${tdIcon("close", 24)}</button></header>
    <span class="media-shell appearance-image-viewer__media"><img src="${escapeHtml(source)}" alt="${escapeHtml(title)}大图" data-fallback /><span class="media-fallback">${tdIcon("image", 30)}<small>大图加载失败</small></span></span>
  </div>`, "appearance-image-sheet");
  bindMediaFallbacks(sheetContent);
  sheetContent.querySelector("[data-action='close-sheet']")?.focus();
}

function normalizeSnapshot(snapshot) {
  const base = defaultSnapshot();
  const next = snapshot && typeof snapshot === "object" ? { ...base, ...snapshot } : base;
  next.drafts = Array.isArray(next.drafts) ? next.drafts : [];
  next.tasks = Array.isArray(next.tasks) ? next.tasks : [];
  next.works = Array.isArray(next.works) ? next.works : [];
  next.orders = Array.isArray(next.orders) ? next.orders : [];
  next.settings = { ...base.settings, ...(next.settings || {}) };
  next.settings.memberTier = next.settings.memberTier === "超级会员" ? "超级会员" : "普通会员";
  next.settings.creationPoints = next.settings.memberTier === "超级会员"
    ? Math.max(0, Number(next.settings.creationPoints || 0))
    : 0;
  delete next.settings.genderChapter;
  next.drafts.forEach(draft => {
    draft.saved = draft.saved !== false;
    draft.gender = draft.gender === "male" ? "male" : "female";
    draft.outputs = { photo: true, video: true, ...(draft.outputs || {}) };
    draft.hairId = hairOptionsForDraft(draft).some(item => item.id === draft.hairId) ? draft.hairId : hairOptionsForDraft(draft)[0].id;
    draft.makeupId = makeupOptions.some(item => item.id === draft.makeupId) ? draft.makeupId : makeupOptions[0].id;
    draft.clothingId = clothingOptions.some(item => item.id === draft.clothingId)
      ? draft.clothingId
      : clothingOptions.some(item => item.id === draft.styleId) ? draft.styleId : clothingOptions[0].id;
    draft.sceneId = sceneOptions.some(item => item.id === draft.sceneId) ? draft.sceneId : sceneOptions[0].id;
    draft.templateId = templateOptions.some(item => item.id === draft.templateId) ? draft.templateId : templateOptions[0].id;
    draft.portraits = draft.portraits || createDraft().portraits;
    ["near", "full"].forEach(kind => {
      draft.portraits[kind] = { kind, status: "empty", blobId: null, previewUrl: "", name: "", width: 0, height: 0, error: "", ...(draft.portraits[kind] || {}) };
      if (draft.portraits[kind].status === "checking") draft.portraits[kind].status = draft.portraits[kind].blobId ? "ready" : "empty";
    });
  });
  next.tasks.forEach(task => {
    if (task.type === "generation" && !task.stage) task.stage = task.previewVersionId ? "preview" : "full";
  });
  next.orders.forEach(order => {
    order.previewVersions = Array.isArray(order.previewVersions) ? order.previewVersions : [];
    order.previewRerollsUsed = Math.max(0, Math.min(MAX_PREVIEW_REROLLS, Number(order.previewRerollsUsed || 0)));
    order.previewAttempts = Number(order.previewAttempts || 0);
    order.previewAdjustmentPending = Boolean(order.previewAdjustmentPending);
    if (!order.selectedPreviewVersionId && order.previewVersions.length) order.selectedPreviewVersionId = order.previewVersions.at(-1).id;
  });
  if (!next.drafts.some(item => item.id === next.activeDraftId)) next.activeDraftId = null;
  return next;
}

function currentDraft() {
  return state.snapshot.drafts.find(item => item.id === state.snapshot.activeDraftId) || null;
}

function initializeDraftTracking() {
  state.draftBaselines.clear();
  state.dirtyDraftIds.clear();
  state.snapshot.drafts.forEach(draft => {
    if (draft.saved === false) state.dirtyDraftIds.add(draft.id);
    else state.draftBaselines.set(draft.id, clone(draft));
  });
}

function markDraftDirty(draft) {
  if (!draft || draft.status !== "draft") return;
  state.dirtyDraftIds.add(draft.id);
}

function draftNeedsSave(draft = currentDraft()) {
  return Boolean(draft && draft.status === "draft" && state.dirtyDraftIds.has(draft.id));
}

function snapshotForStorage() {
  const snapshot = clone(state.snapshot);
  snapshot.drafts = state.snapshot.drafts.flatMap(draft => {
    if (!state.dirtyDraftIds.has(draft.id)) return draft.saved === false ? [] : [clone(draft)];
    const baseline = state.draftBaselines.get(draft.id);
    return baseline ? [clone(baseline)] : [];
  });
  if (!snapshot.drafts.some(draft => draft.id === snapshot.activeDraftId)) snapshot.activeDraftId = null;
  return snapshot;
}

function activeTask() {
  return state.snapshot.tasks.find(item => item.id === state.activeTaskId) || null;
}

function activeWork() {
  return state.snapshot.works.find(item => item.id === state.activeWorkId) || null;
}

function activeOrder() {
  return state.snapshot.orders.find(item => item.id === state.activeOrderId) || null;
}

function ensureDraft(presetCase = null, markAsDirty = true) {
  let draft = currentDraft();
  if (!draft || draft.status === "completed") {
    draft = createDraft(presetCase);
    state.snapshot.drafts.unshift(draft);
    state.snapshot.activeDraftId = draft.id;
    if (markAsDirty) markDraftDirty(draft);
  }
  return draft;
}

function portraitReady(draft, kind) {
  const portrait = draft?.portraits?.[kind];
  return Boolean(portrait && portrait.status === "ready" && (portrait.blobId || portrait.previewUrl));
}

function draftReady(draft) {
  return portraitReady(draft, "near") && portraitReady(draft, "full") && (draft.outputs.photo || draft.outputs.video);
}

function draftHasContent(draft) {
  return Boolean(draft && (draft.portraits.near.blobId || draft.portraits.full.blobId || draft.sourceCaseId || draft.customized));
}

function portraitSource(portrait) {
  if (!portrait) return "";
  if (portrait.previewUrl) return portrait.previewUrl;
  return portrait.blobId ? state.mediaUrls.get(portrait.blobId) || "" : "";
}

async function persistSnapshot() {
  if (isPreviewMode) return true;
  try {
    await storage.putSnapshot(snapshotForStorage());
    return true;
  } catch (error) {
    console.error(error);
    showToast("本地保存失败，请检查浏览器存储权限");
    return false;
  }
}

async function persistDraftBlobs(draft) {
  if (isPreviewMode) return;
  for (const portrait of Object.values(draft.portraits || {})) {
    const id = portrait?.blobId;
    if (!id || id.startsWith("sample-")) continue;
    const record = storage.memoryBlobs.get(id) || await storage.getBlob(id);
    if (!record?.blob) throw new Error("人物照片临时文件已失效");
    const { blob, id: ignoredId, ...meta } = record;
    await storage.putBlob(id, blob, meta);
  }
}

async function commitDraft(draft) {
  if (!draft) return false;
  const previousSaved = draft.saved;
  const previousBaseline = state.draftBaselines.get(draft.id);
  const previousBlobIds = new Set(Object.values(previousBaseline?.portraits || {}).map(item => item?.blobId).filter(Boolean));
  try {
    await persistDraftBlobs(draft);
    draft.saved = true;
    draft.updatedAt = Date.now();
    state.dirtyDraftIds.delete(draft.id);
    if (!await persistSnapshot()) throw new Error("草稿保存失败");
    state.draftBaselines.set(draft.id, clone(draft));
    const currentBlobIds = new Set(Object.values(draft.portraits || {}).map(item => item?.blobId).filter(Boolean));
    for (const id of previousBlobIds) if (!currentBlobIds.has(id)) await cleanupBlob(id);
    return true;
  } catch (error) {
    draft.saved = previousSaved;
    state.dirtyDraftIds.add(draft.id);
    if (previousBaseline) state.draftBaselines.set(draft.id, previousBaseline);
    console.error(error);
    showToast(error.message || "草稿保存失败，请稍后重试");
    return false;
  }
}

async function discardDraftChanges(draft) {
  if (!draft) return;
  const discardedBlobIds = Object.values(draft.portraits || {}).map(item => item?.blobId).filter(Boolean);
  const baseline = state.draftBaselines.get(draft.id);
  const index = state.snapshot.drafts.findIndex(item => item.id === draft.id);
  if (baseline && index >= 0) state.snapshot.drafts[index] = clone(baseline);
  else {
    state.snapshot.drafts = state.snapshot.drafts.filter(item => item.id !== draft.id);
    state.draftBaselines.delete(draft.id);
    if (state.snapshot.activeDraftId === draft.id) state.snapshot.activeDraftId = null;
  }
  state.dirtyDraftIds.delete(draft.id);
  await persistSnapshot();
  for (const id of discardedBlobIds) await cleanupBlob(id);
}

async function hydrateBlobUrls() {
  const ids = new Set();
  state.snapshot.drafts.forEach(draft => Object.values(draft.portraits || {}).forEach(item => item?.blobId && !item.previewUrl && ids.add(item.blobId)));
  state.snapshot.works.forEach(work => (work.portraitIds || []).forEach(id => id && !id.startsWith("sample-") && ids.add(id)));
  for (const id of ids) {
    if (state.mediaUrls.has(id)) continue;
    const record = await storage.getBlob(id);
    if (record?.blob) state.mediaUrls.set(id, URL.createObjectURL(record.blob));
  }
}

function referencedBlobIds() {
  const ids = new Set();
  state.snapshot.drafts.forEach(draft => Object.values(draft.portraits || {}).forEach(item => item?.blobId && ids.add(item.blobId)));
  state.draftBaselines.forEach(draft => Object.values(draft.portraits || {}).forEach(item => item?.blobId && ids.add(item.blobId)));
  state.snapshot.works.forEach(work => (work.portraitIds || []).forEach(id => id && ids.add(id)));
  return ids;
}

async function cleanupBlob(blobId) {
  if (!blobId || blobId.startsWith("sample-") || referencedBlobIds().has(blobId)) return;
  const url = state.mediaUrls.get(blobId);
  if (url) URL.revokeObjectURL(url);
  state.mediaUrls.delete(blobId);
  await storage.deleteBlob(blobId);
}

function taskProgress(task, now = Date.now()) {
  if (["succeeded", "partial", "failed", "cancelled"].includes(task.status)) return 1;
  return Math.min(0.99, Math.max(0, (now - task.startedAt) / Math.max(1, task.finishAt - task.startedAt)));
}

function taskItemsFromDraft(draft) {
  const template = optionById(templateOptions, draft.templateId);
  const items = [];
  if (draft.outputs.photo) {
    for (let index = 0; index < template.photoCount; index += 1) {
      items.push({ id: uid("photo"), type: "photo", label: `写真 ${index + 1}`, index, status: "pending" });
    }
    items.push({ id: uid("poster"), type: "poster", label: "专属海报", index: 0, status: "pending" });
  }
  if (draft.outputs.video) items.push({ id: uid("video"), type: "video", label: `${template.duration} 秒短视频`, index: 0, status: "pending" });
  return items;
}

function previewTaskItems() {
  return [
    { id: uid("preview-look"), type: "preview-look", label: "人物定妆照", index: 0, status: "pending" },
    { id: uid("preview-photo"), type: "preview-photo", label: "写真预览照", index: 0, status: "pending" }
  ];
}

function previewSources(versionIndex) {
  const fullBodyIndexes = [1, 4, 6];
  const photoIndexes = [0, 3, 5];
  const safeIndex = Math.max(0, Math.min(2, Number(versionIndex || 0)));
  return {
    fullBodySource: MEDIA.resultPhotos[fullBodyIndexes[safeIndex]],
    photoSource: MEDIA.resultPhotos[photoIndexes[safeIndex]]
  };
}

function previewVersionsForOrder(order) {
  return Array.isArray(order?.previewVersions) ? order.previewVersions : [];
}

function selectedPreviewVersion(order) {
  const versions = previewVersionsForOrder(order);
  return versions.find(version => version.id === order?.selectedPreviewVersionId) || versions.at(-1) || null;
}

function previewRerollsRemaining(order) {
  return Math.max(0, MAX_PREVIEW_REROLLS - Number(order?.previewRerollsUsed || 0));
}

function currentPreviewAdjustmentOrder() {
  const order = activeOrder();
  const draft = currentDraft();
  return order?.previewAdjustmentPending && draft?.id === order.draftId ? order : null;
}

function workFromTask(task, partial = false) {
  const snapshot = task.configSnapshot;
  const template = optionById(templateOptions, snapshot.templateId);
  const items = task.items.map((item, index) => {
    const shouldFail = partial && (item.type === "video" || index === task.items.length - 1);
    const source = item.type === "video"
      ? MEDIA.resultVideo
      : item.type === "poster"
        ? MEDIA.resultPhotos[Math.min(3, MEDIA.resultPhotos.length - 1)]
        : MEDIA.resultPhotos[item.index % MEDIA.resultPhotos.length];
    const failureMessage = item.type === "video"
      ? "视频合成中断，可单独重试"
      : item.type === "poster" ? "海报排版质检未通过，可重新生成" : "画面质检未通过，可重新生成";
    return {
      ...item,
      status: shouldFail ? "failed" : "ready",
      source: shouldFail ? "" : source,
      error: shouldFail ? failureMessage : "",
      retryTaskId: null,
      previousSource: ""
    };
  });
  const portraitIds = [snapshot.portraits.near.blobId, snapshot.portraits.full.blobId].filter(Boolean);
  return {
    id: uid("work"),
    taskId: task.id,
    parentWorkId: snapshot.parentWorkId || null,
    draftId: task.draftId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    title: `${template.name} · 国风作品包`,
    status: items.some(item => item.status === "failed") ? "partial" : "ready",
    configSnapshot: clone(snapshot),
    lockedPreviewVersionId: task.lockedPreviewVersionId || null,
    portraitIds,
    items,
    savedItemIds: []
  };
}

function finalizePreviewTask(task, order) {
  const now = Date.now();
  if (task.failureMode === "preview") {
    task.status = "failed";
    task.error = "形象预览生成失败，本次不会消耗换版次数";
    task.items.forEach(item => { item.status = "failed"; });
    task.updatedAt = now;
    if (order) {
      order.status = "preview-failed";
      order.error = task.error;
      order.updatedAt = now;
    }
    return true;
  }
  const versions = previewVersionsForOrder(order);
  const versionIndex = versions.length;
  const sources = previewSources(versionIndex);
  const version = {
    id: uid("appearance"),
    index: versionIndex + 1,
    createdAt: now,
    taskId: task.id,
    configSnapshot: clone(task.configSnapshot),
    ...sources
  };
  task.items.forEach(item => {
    item.status = "ready";
    item.source = item.type === "preview-look" ? sources.fullBodySource : sources.photoSource;
  });
  task.previewVersionId = version.id;
  task.status = "succeeded";
  task.updatedAt = now;
  if (order) {
    order.previewVersions = [...versions, version];
    if (task.consumeRerollOnSuccess) order.previewRerollsUsed = Math.min(MAX_PREVIEW_REROLLS, Number(order.previewRerollsUsed || 0) + 1);
    order.selectedPreviewVersionId = version.id;
    order.previewAdjustmentPending = false;
    order.status = "preview-ready";
    order.configSnapshot = clone(task.configSnapshot);
    order.error = "";
    order.updatedAt = now;
  }
  const draft = state.snapshot.drafts.find(item => item.id === task.draftId);
  if (draft) {
    draft.status = "preview-ready";
    draft.updatedAt = now;
    if (draft.saved) state.draftBaselines.set(draft.id, clone(draft));
  }
  return true;
}

function finalizeGenerationTask(task) {
  if (task.workId || !["processing", "queued"].includes(task.status)) return false;
  const order = task.orderId ? findOrder(task.orderId) : null;
  if (task.stage === "preview") return finalizePreviewTask(task, order);
  if (task.failureMode === "full") {
    task.status = "failed";
    task.error = "本次生成未完成，人物素材和创作方案仍已保留";
    task.items.forEach(item => { item.status = "failed"; });
    task.updatedAt = Date.now();
    if (order) {
      order.generationFailures = Number(order.generationFailures || 0) + 1;
      order.updatedAt = task.updatedAt;
      order.error = task.error;
      if (order.generationFailures >= 2) {
        order.status = order.paymentMethod === "wechat" ? "refund-pending" : "benefit-returned";
        order.resolution = order.paymentMethod === "wechat"
          ? "持续生成失败，已提交原路退款"
          : order.paymentMethod === "points" ? "持续生成失败，积分已返还" : "持续生成失败，会员权益已返还";
      } else order.status = "generation-failed";
    }
    return true;
  }
  const work = workFromTask(task, task.failureMode === "partial");
  state.snapshot.works.unshift(work);
  task.workId = work.id;
  task.status = work.status === "partial" ? "partial" : "succeeded";
  task.updatedAt = Date.now();
  if (order) {
    order.status = work.status === "partial" ? "partially-fulfilled" : "fulfilled";
    order.workId = work.id;
    order.updatedAt = task.updatedAt;
    order.error = "";
  }
  const draft = state.snapshot.drafts.find(item => item.id === task.draftId);
  if (draft) {
    draft.status = "completed";
    draft.workId = work.id;
    draft.updatedAt = Date.now();
  }
  return true;
}

function finalizeItemRetry(task) {
  if (task.type !== "item-retry" || task.status !== "processing" || Date.now() < task.finishAt) return false;
  const work = state.snapshot.works.find(item => item.id === task.workId);
  const item = work?.items.find(entry => entry.id === task.itemId);
  if (!work || !item) {
    task.status = "failed";
    task.error = "原作品已不存在";
    return true;
  }
  item.status = "ready";
  item.error = "";
  item.retryTaskId = null;
  item.source = item.type === "video"
    ? MEDIA.resultVideo
    : MEDIA.resultPhotos[(item.index + task.attempt) % MEDIA.resultPhotos.length];
  item.previousSource = "";
  work.status = work.items.some(entry => entry.status === "failed") ? "partial" : "ready";
  work.updatedAt = Date.now();
  task.status = "succeeded";
  task.updatedAt = Date.now();
  return true;
}

function syncTasks(now = Date.now()) {
  let changed = false;
  state.snapshot.tasks.forEach(task => {
    if (task.type === "item-retry") {
      if (finalizeItemRetry(task)) changed = true;
      return;
    }
    if (["processing", "queued"].includes(task.status) && now >= task.finishAt) {
      if (finalizeGenerationTask(task)) changed = true;
    }
  });
  return changed;
}

function runningTasks() {
  syncTasks();
  return state.snapshot.tasks.filter(task => task.type !== "item-retry" && ["queued", "processing"].includes(task.status));
}

function findTask(id) {
  return state.snapshot.tasks.find(item => item.id === id) || null;
}

function findWork(id) {
  return state.snapshot.works.find(item => item.id === id) || null;
}

function findOrder(id) {
  return state.snapshot.orders.find(item => item.id === id) || null;
}

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

function isSuperMember() {
  return state.snapshot.settings.memberTier === "超级会员";
}

function creationPointBalance() {
  return Math.max(0, Number(state.snapshot.settings.creationPoints || 0));
}

function paymentScenario() {
  return ["payment-error", "task-creation-error", "points-covered", "member-covered"].includes(state.demoState)
    ? state.demoState
    : "normal";
}

function paymentOfferForDraft(draft, scenario = paymentScenario()) {
  const template = optionById(templateOptions, draft?.templateId);
  const originalAmount = PAYMENT_OFFER.originalAmount;
  const memberAmount = PAYMENT_OFFER.memberAmount;
  const memberEligible = isSuperMember();
  const pointsBalance = creationPointBalance();
  const pointsCost = PAYMENT_OFFER.pointsCost;
  const pointsCovered = scenario === "points-covered" || (scenario === "normal" && memberEligible && pointsBalance >= pointsCost);
  const memberCovered = scenario === "member-covered";
  return {
    originalAmount,
    memberAmount,
    memberDiscount: memberEligible ? originalAmount - memberAmount : 0,
    memberEligible,
    pointsBalance,
    pointsDeduction: pointsCovered ? pointsCost : 0,
    payableAmount: pointsCovered || memberCovered ? 0 : memberEligible ? memberAmount : originalAmount,
    pointsCost: pointsCovered ? pointsCost : 0,
    photoCount: draft?.outputs?.photo ? template.photoCount : 0,
    posterCount: draft?.outputs?.photo ? PAYMENT_OFFER.posterCount : 0,
    vlogCount: draft?.outputs?.video ? PAYMENT_OFFER.vlogCount : 0,
    paymentMethod: pointsCovered ? "points" : memberCovered ? "member-benefit" : "wechat",
    scenario
  };
}

function paymentOutputSummary(offer) {
  return [
    offer.photoCount ? `${offer.photoCount} 张写真` : "",
    offer.posterCount ? `${offer.posterCount} 张专属海报` : "",
    offer.vlogCount ? `${offer.vlogCount} 条 VLOG` : ""
  ].filter(Boolean).join("＋");
}

function checkoutActionLabel(offer) {
  if (offer.paymentMethod === "points") return `使用 ${offer.pointsCost} 创作点生成`;
  if (offer.paymentMethod === "member-benefit") return "使用会员权益生成";
  return `微信支付 ¥${formatMoney(offer.payableAmount)}`;
}

function renderCheckoutPreview(draft, compact = false) {
  const offer = paymentOfferForDraft(draft, "normal");
  const paymentLabel = offer.paymentMethod === "points" ? "本次扣除" : offer.memberEligible ? "超级会员价" : "生成价格";
  const paymentValue = offer.paymentMethod === "points" ? `${offer.pointsCost} 点` : `¥${formatMoney(offer.payableAmount)}`;
  return `<div class="checkout-preview ${compact ? "checkout-preview--compact" : ""}"><span><small>整套作品包</small><strong>${escapeHtml(paymentOutputSummary(offer))}</strong></span><span><small>${paymentLabel}</small><strong>${paymentValue}</strong></span></div>`;
}

async function createPreviewTask(draft, order, { configSnapshot = null, consumeReroll = false, reason = "initial", stayOnAppearance = false } = {}) {
  if (!draftReady(draft) || !order) {
    showToast("人物照片或订单信息已失效，请返回创作页检查");
    return null;
  }
  if (state.demoState === "offline") {
    showToast("当前网络不可用，预览尚未提交");
    return null;
  }
  if (order.lockedPreviewVersionId) {
    showToast("当前形象已锁定，不能再换版");
    return null;
  }
  if (consumeReroll && (previewRerollsRemaining(order) <= 0 || previewVersionsForOrder(order).length >= MAX_PREVIEW_REROLLS + 1)) {
    showToast("已用完 2 次换版机会，请选择现有版本");
    return null;
  }
  const duplicate = state.snapshot.tasks.find(task => task.orderId === order.id && ["queued", "processing"].includes(task.status));
  if (duplicate) {
    state.activeTaskId = duplicate.id;
    closeSheet();
    if (stayOnAppearance && state.route === "appearance") render({ preserveScroll: true });
    else navigate("generating", { taskId: duplicate.id });
    return duplicate;
  }
  if (!await commitDraft(draft)) return null;
  const snapshot = configSnapshot ? clone(configSnapshot) : clone(draft);
  const now = Date.now();
  const task = {
    id: uid("preview"),
    type: "generation",
    stage: "preview",
    previewReason: reason,
    consumeRerollOnSuccess: Boolean(consumeReroll),
    draftId: draft.id,
    orderId: order.id,
    idempotencyKey: `${order.id}:preview:${Number(order.previewAttempts || 0) + 1}`,
    createdAt: now,
    updatedAt: now,
    startedAt: now,
    finishAt: now + PREVIEW_GENERATION_DURATION_MS,
    status: "processing",
    failureMode: state.demoState === "generation-error" ? "preview" : "none",
    error: "",
    workId: null,
    previewVersionId: null,
    configSnapshot: snapshot,
    items: previewTaskItems()
  };
  draft.status = "preview-generating";
  draft.updatedAt = now;
  state.snapshot.tasks.unshift(task);
  state.activeTaskId = task.id;
  state.activeOrderId = order.id;
  order.status = "preview-task-created";
  order.taskId = task.id;
  order.previewAttempts = Number(order.previewAttempts || 0) + 1;
  order.previewAdjustmentPending = false;
  order.error = "";
  order.updatedAt = now;
  if (state.demoState === "generation-error") state.demoState = "normal";
  await persistSnapshot();
  closeSheet();
  if (stayOnAppearance && state.route === "appearance") {
    render({ preserveScroll: true });
    showToast(`第${previewVersionsForOrder(order).length + 1}版正在生成，已有版本已保留`);
    return task;
  }
  if (state.route === "editor" && state.history.at(-1)?.route === "appearance") state.history.pop();
  navigate("generating", { replace: true, taskId: task.id, orderId: order.id });
  return task;
}

async function createGenerationTask(draft, configSnapshot = null, paidOrder = null) {
  if (!draftReady(draft)) {
    showToast("请先添加近照和全身照，并至少选择一种成片类型");
    if (state.route !== "create") switchTab("create");
    else render(true);
    return null;
  }
  if (state.demoState === "offline") {
    showToast("当前网络不可用，方案尚未提交，请恢复后重试");
    return null;
  }
  const duplicate = state.snapshot.tasks.find(task => task.draftId === draft.id && ["queued", "processing"].includes(task.status));
  if (duplicate) {
    if (paidOrder) {
      paidOrder.status = duplicate.stage === "preview" ? "preview-task-created" : "full-task-created";
      paidOrder.taskId = duplicate.id;
      paidOrder.updatedAt = Date.now();
      await persistSnapshot();
    }
    state.activeTaskId = duplicate.id;
    closeSheet();
    navigate("generating");
    return duplicate;
  }
  if (!await commitDraft(draft)) return null;
  const snapshot = configSnapshot ? clone(configSnapshot) : clone(draft);
  const now = Date.now();
  const task = {
    id: uid("task"),
    type: "generation",
    stage: "full",
    draftId: draft.id,
    idempotencyKey: `${draft.id}:${draft.updatedAt}`,
    createdAt: now,
    updatedAt: now,
    startedAt: now,
    finishAt: now + GENERATION_DURATION_MS,
    status: "processing",
    failureMode: state.demoState === "generation-error" ? "full" : state.demoState === "partial-failure" ? "partial" : "none",
    error: "",
    workId: null,
    orderId: paidOrder?.id || null,
    lockedPreviewVersionId: paidOrder?.lockedPreviewVersionId || null,
    configSnapshot: snapshot,
    items: taskItemsFromDraft(snapshot)
  };
  draft.status = "full-generating";
  draft.updatedAt = now;
  state.snapshot.tasks.unshift(task);
  state.activeTaskId = task.id;
  if (paidOrder) {
    paidOrder.status = "full-task-created";
    paidOrder.taskId = task.id;
    paidOrder.generationAttempts = Number(paidOrder.generationAttempts || 0) + 1;
    paidOrder.error = "";
    paidOrder.updatedAt = now;
  }
  state.demoState = "normal";
  await persistSnapshot();
  closeSheet();
  navigate("generating", { replace: true });
  return task;
}

function showPaymentConfirmation(order) {
  if (!order) return;
  state.activeOrderId = order.id;
  const offer = order.offer;
  const pointsValue = offer.pointsDeduction > 0 ? `-${offer.pointsDeduction} 点` : `${offer.pointsBalance || 0} 点`;
  const benefitRow = offer.paymentMethod === "member-benefit"
    ? `<div><span>会员免费次数</span><strong>-1 次</strong></div>`
    : `<div><span>${offer.paymentMethod === "points" ? "创作点抵扣" : "创作点余额"}</span><strong>${escapeHtml(pointsValue)}</strong></div>`;
  const priceRows = offer.memberEligible
    ? `<div><span>原价</span><del>¥${formatMoney(offer.originalAmount)}</del></div><div><span>超级会员价</span><strong>¥${formatMoney(offer.memberAmount)}</strong></div>`
    : `<div><span>本次生成</span><strong>¥${formatMoney(offer.originalAmount)}</strong></div>`;
  const checkoutAction = offer.paymentMethod === "wechat" ? "open-wechat-payment" : "confirm-payment";
  openSheet(`<div class="sheet-copy payment-sheet-copy"><h3 id="sheet-title">订单信息</h3></div>
    <section class="payment-breakdown" aria-label="费用明细">${priceRows}${benefitRow}<div class="payment-breakdown__total"><span>实付</span><strong>¥${formatMoney(offer.payableAmount)}</strong></div></section>
    <div class="sheet-actions payment-sheet-actions"><button class="outline-button" data-action="cancel-payment" data-order-id="${order.id}">暂不支付</button><button class="primary-button" data-action="${checkoutAction}" data-order-id="${order.id}">${escapeHtml(checkoutActionLabel(offer))}</button></div>`, "payment-sheet");
}

function showWechatPayment(order) {
  if (!order) return;
  order.status = "pending-payment";
  order.updatedAt = Date.now();
  state.activeOrderId = order.id;
  openSheet(`<div class="wechat-payment-head"><span class="wechat-payment-mark">微信</span><div><small>HTML 原型模拟</small><h3 id="sheet-title">微信支付</h3></div></div><section class="wechat-payment-merchant"><small>收款方</small><strong>施·旅拍</strong><span>¥${formatMoney(order.offer.payableAmount)}</span></section><div class="wechat-payment-method"><span>${tdIcon("check", 13)}</span><div><strong>微信支付</strong><small>正式版将由微信收银台完成支付</small></div></div><p class="wechat-payment-disclaimer">本页不会发起真实扣款。</p><div class="sheet-actions payment-sheet-actions"><button class="outline-button" data-action="cancel-payment" data-order-id="${order.id}">取消支付</button><button class="primary-button" data-action="confirm-payment" data-order-id="${order.id}">确认支付 ¥${formatMoney(order.offer.payableAmount)}</button></div>`, "wechat-payment-sheet");
}

function showPaymentFailure(order) {
  if (!order) return;
  openSheet(`<div class="payment-result"><span class="payment-result__mark payment-result__mark--error">${tdIcon("close", 22)}</span><small>支付失败</small><h3 id="sheet-title">本次没有完成扣款</h3><p>订单和创作草稿已保留，可以重新发起微信支付。</p></div><div class="sheet-actions payment-sheet-actions"><button class="outline-button" data-action="cancel-payment" data-order-id="${order.id}">稍后支付</button><button class="primary-button" data-action="retry-payment" data-order-id="${order.id}">重新支付</button></div>`, "payment-result-sheet");
}

function showPaymentSuccess(order) {
  const successLabel = order.offer.paymentMethod === "points" ? "创作点扣除成功" : order.offer.paymentMethod === "member-benefit" ? "权益使用成功" : "支付成功";
  openSheet(`<div class="payment-result payment-result--success"><span class="payment-result__mark">${tdIcon("check", 22)}</span><small>${successLabel}</small><h3 id="sheet-title">正在生成形象预览</h3><p>先生成定妆照和写真预览，确认满意后再生成整套作品。</p><span class="payment-result__spinner mini-spinner" aria-hidden="true"></span></div>`, "payment-result-sheet");
}

function showPaymentRecovery(order, automatic = false) {
  if (!order) return;
  openSheet(`<div class="payment-result payment-result--recovery"><span class="payment-result__mark">${tdIcon("check", 22)}</span><small>支付已确认</small><h3 id="sheet-title">预览任务正在恢复</h3><p>创建预览时遇到短暂异常，订单已支付，不会重复扣款。${automatic ? "系统将自动继续。" : "可以立即重试。"}</p><span class="payment-result__spinner mini-spinner" aria-hidden="true"></span></div>${automatic ? "" : `<div class="sheet-actions sheet-actions--single"><button class="primary-button" data-action="resume-paid-order" data-order-id="${order.id}">继续生成预览</button></div>`}`, "payment-result-sheet");
}

async function beginCheckout(draft, configSnapshot = null) {
  if (!draftReady(draft)) {
    showToast("请先添加近照和全身照，并至少选择一种成片类型");
    if (state.route !== "create") switchTab("create");
    else render(true);
    return null;
  }
  if (state.demoState === "offline") {
    showToast("当前网络不可用，无法创建待支付订单");
    return null;
  }
  const duplicateTask = state.snapshot.tasks.find(task => task.draftId === draft.id && ["queued", "processing"].includes(task.status));
  if (duplicateTask) {
    state.activeTaskId = duplicateTask.id;
    navigate("generating");
    return null;
  }
  const paidOrder = state.snapshot.orders.find(order => order.draftId === draft.id && ["paid", "task-pending", "task-creating"].includes(order.status) && !order.taskId);
  if (paidOrder) {
    showPaymentRecovery(paidOrder, true);
    schedulePaymentRecovery(paidOrder.id);
    return paidOrder;
  }
  if (!await commitDraft(draft)) return null;
  const now = Date.now();
  const offer = paymentOfferForDraft(draft);
  const snapshot = configSnapshot ? clone(configSnapshot) : clone(draft);
  let order = state.snapshot.orders.find(item => item.draftId === draft.id && ["pending-payment", "payment-failed"].includes(item.status) && !item.taskId);
  if (!order) {
    order = {
      id: uid("order"),
      type: "generation",
      draftId: draft.id,
      taskId: null,
      idempotencyKey: `${draft.id}:checkout`,
      createdAt: now,
      updatedAt: now,
      status: "pending-payment",
      paymentMethod: offer.paymentMethod,
      offer,
      configSnapshot: snapshot,
      generationAttempts: 0,
      generationFailures: 0,
      previewVersions: [],
      previewRerollsUsed: 0,
      previewAttempts: 0,
      selectedPreviewVersionId: null,
      lockedPreviewVersionId: null,
      previewAdjustmentPending: false,
      error: ""
    };
    state.snapshot.orders.unshift(order);
  } else {
    order.status = "pending-payment";
    order.paymentMethod = offer.paymentMethod;
    order.offer = offer;
    order.configSnapshot = snapshot;
    order.updatedAt = now;
    order.error = "";
  }
  state.activeOrderId = order.id;
  await persistSnapshot();
  showPaymentConfirmation(order);
  return order;
}

async function cancelPayment(order) {
  if (order && !["paid", "preview-task-created", "preview-ready", "full-task-created", "fulfilled"].includes(order.status)) {
    order.status = "pending-payment";
    order.updatedAt = Date.now();
    await persistSnapshot();
  }
  closeSheet();
  showToast("已保留草稿和待支付订单");
}

function schedulePaymentRecovery(orderId) {
  clearTimeout(state.paymentRecoveryTimer);
  state.paymentRecoveryTimer = setTimeout(() => resumePaidOrder(orderId), PAYMENT_RECOVERY_DURATION_MS);
}

async function resumePaidOrder(orderId) {
  if (state.paymentBusy) return;
  const order = findOrder(orderId);
  if (!order || order.taskId) return;
  const draft = state.snapshot.drafts.find(item => item.id === order.draftId);
  if (!draft) {
    order.status = "task-pending";
    order.error = "创作草稿已失效，请通过订单申请处理";
    await persistSnapshot();
    showPaymentFailure(order);
    return;
  }
  clearTimeout(state.paymentRecoveryTimer);
  state.paymentBusy = true;
  order.status = "task-creating";
  order.updatedAt = Date.now();
  await persistSnapshot();
  const task = await createPreviewTask(draft, order, { configSnapshot: order.configSnapshot, reason: "initial" });
  state.paymentBusy = false;
  if (!task) {
    order.status = "task-pending";
    order.error = "生成任务创建失败，支付状态已保留";
    order.updatedAt = Date.now();
    await persistSnapshot();
    showPaymentRecovery(order, false);
  }
}

async function completePayment(order, trigger) {
  if (!order || state.paymentBusy || ["paid", "preview-task-created", "preview-ready", "full-task-created", "fulfilled"].includes(order.status)) return;
  state.paymentBusy = true;
  if (trigger) {
    trigger.disabled = true;
    trigger.textContent = "处理中…";
  }
  if (order.offer.scenario === "payment-error") {
    order.status = "payment-failed";
    order.error = "微信支付未完成";
    order.updatedAt = Date.now();
    state.demoState = "normal";
    await persistSnapshot();
    state.paymentBusy = false;
    showPaymentFailure(order);
    return;
  }
  if (order.offer.paymentMethod === "points" && !order.pointsCharged) {
    const balance = creationPointBalance();
    if (balance < order.offer.pointsCost) {
      const draft = state.snapshot.drafts.find(item => item.id === order.draftId);
      order.offer = paymentOfferForDraft(draft, "normal");
      order.paymentMethod = order.offer.paymentMethod;
      order.status = "pending-payment";
      order.updatedAt = Date.now();
      await persistSnapshot();
      state.paymentBusy = false;
      showPaymentConfirmation(order);
      showToast("创作点不足，已切换为付费生成");
      return;
    }
    state.snapshot.settings.creationPoints = balance - order.offer.pointsCost;
    order.pointsCharged = order.offer.pointsCost;
  }
  order.status = "paid";
  order.paidAt = Date.now();
  order.updatedAt = order.paidAt;
  order.error = "";
  await persistSnapshot();
  showPaymentSuccess(order);
  await new Promise(resolve => setTimeout(resolve, 650));
  if (order.offer.scenario === "task-creation-error") {
    order.status = "task-pending";
    order.error = "任务创建暂时失败，等待自动恢复";
    order.updatedAt = Date.now();
    state.demoState = "normal";
    await persistSnapshot();
    state.paymentBusy = false;
    showPaymentRecovery(order, true);
    schedulePaymentRecovery(order.id);
    return;
  }
  state.paymentBusy = false;
  await resumePaidOrder(order.id);
}

async function requestPreviewRevision(order, { adjusted = false } = {}) {
  if (!order) return;
  if (order.lockedPreviewVersionId) {
    showToast("当前形象已锁定，不能再换版");
    return;
  }
  if (previewRerollsRemaining(order) <= 0) {
    showToast("已用完 2 次换版机会，请选择当前任意版本");
    return;
  }
  const draft = state.snapshot.drafts.find(item => item.id === order.draftId);
  if (!draft) {
    showToast("创作方案已失效，请从订单申请处理");
    return;
  }
  const version = selectedPreviewVersion(order);
  const configSnapshot = adjusted ? clone(draft) : clone(version?.configSnapshot || order.configSnapshot || draft);
  await createPreviewTask(draft, order, {
    configSnapshot,
    consumeReroll: true,
    reason: adjusted ? "adjustment" : "reroll",
    stayOnAppearance: state.route === "appearance"
  });
}

async function retryPreviewTask(task) {
  const order = task?.orderId ? findOrder(task.orderId) : null;
  const draft = state.snapshot.drafts.find(item => item.id === task?.draftId);
  if (!task || !order || !draft) {
    showToast("预览任务已失效，请从订单中重新查看");
    return;
  }
  await createPreviewTask(draft, order, {
    configSnapshot: task.configSnapshot,
    consumeReroll: Boolean(task.consumeRerollOnSuccess),
    reason: task.previewReason || "retry",
    stayOnAppearance: state.route === "appearance"
  });
}

async function adjustPreviewPlan(order) {
  if (order?.lockedPreviewVersionId) {
    showToast("当前形象已锁定，整套作品正在按该版本生成");
    return;
  }
  if (!order || previewRerollsRemaining(order) <= 0) {
    showToast("换版次数已用完，请从现有版本中选择");
    return;
  }
  const draft = state.snapshot.drafts.find(item => item.id === order.draftId);
  const version = selectedPreviewVersion(order);
  if (!draft || !version) return;
  const source = version.configSnapshot || order.configSnapshot || draft;
  ["gender", "sourceCaseId", "styleId", "hairId", "makeupId", "clothingId", "sceneId", "templateId", "outputs", "customized"].forEach(key => {
    if (source[key] !== undefined) draft[key] = clone(source[key]);
  });
  draft.status = "draft";
  draft.updatedAt = Date.now();
  order.previewAdjustmentPending = true;
  order.status = "preview-adjusting";
  order.updatedAt = Date.now();
  state.snapshot.activeDraftId = draft.id;
  state.snapshot.settings.creationMode = draft.customized ? "custom" : "template";
  state.activeOrderId = order.id;
  markDraftDirty(draft);
  state.editorStep = "confirm";
  state.editorHistory = [];
  await persistSnapshot();
  navigate("editor", { orderId: order.id });
}

async function acceptPreviewVersion(order) {
  if (!order) return;
  if (order.lockedPreviewVersionId) {
    const work = workForOrder(order);
    if (work) {
      state.activeWorkId = work.id;
      state.gallerySection = "photos";
      navigate("work", { workId: work.id });
    } else {
      const task = latestTaskForOrder(order);
      if (task) {
        state.activeTaskId = task.id;
        navigate("generating", { taskId: task.id });
      } else showToast("已锁定当前形象版本");
    }
    return;
  }
  const version = selectedPreviewVersion(order);
  const draft = state.snapshot.drafts.find(item => item.id === order.draftId);
  if (!version || !draft) {
    showToast("请先完成一版形象预览");
    return;
  }
  order.selectedPreviewVersionId = version.id;
  order.lockedPreviewVersionId = version.id;
  order.previewAdjustmentPending = false;
  order.status = "full-task-pending";
  order.updatedAt = Date.now();
  await persistSnapshot();
  const task = await createGenerationTask(draft, version.configSnapshot, order);
  if (!task) {
    order.lockedPreviewVersionId = null;
    order.status = "preview-ready";
    order.error = "生成全部尚未提交，可以重新确认";
    order.updatedAt = Date.now();
    await persistSnapshot();
    render({ preserveScroll: true });
  }
}

async function retryWholeTask(task) {
  if (task?.stage === "preview") {
    await retryPreviewTask(task);
    return;
  }
  const draft = state.snapshot.drafts.find(item => item.id === task.draftId) || createDraft();
  if (!state.snapshot.drafts.some(item => item.id === draft.id)) state.snapshot.drafts.unshift(draft);
  state.snapshot.activeDraftId = draft.id;
  draft.status = "draft";
  draft.updatedAt = Date.now();
  const order = task.orderId ? findOrder(task.orderId) : null;
  if (order && ["refund-pending", "benefit-returned"].includes(order.status)) {
    showToast(order.resolution || "本订单已进入退回处理");
    return;
  }
  await createGenerationTask(draft, task.configSnapshot, order);
}

async function retryWorkItem(work, item) {
  if (item.retryTaskId) {
    showToast("这一项已经在重新生成");
    return;
  }
  const now = Date.now();
  const attempts = state.snapshot.tasks.filter(task => task.type === "item-retry" && task.workId === work.id && task.itemId === item.id).length;
  const task = {
    id: uid("retry"),
    type: "item-retry",
    workId: work.id,
    itemId: item.id,
    createdAt: now,
    updatedAt: now,
    startedAt: now,
    finishAt: now + ITEM_RETRY_DURATION_MS,
    status: "processing",
    attempt: attempts + 1
  };
  item.previousSource = item.source || "";
  item.status = "processing";
  item.retryTaskId = task.id;
  item.error = "";
  state.snapshot.tasks.unshift(task);
  await persistSnapshot();
  render();
  showToast("已开始单项重新生成，原有成功内容会继续保留");
}

function isCreationRoute(route) {
  return ["create", "editor"].includes(route);
}

function shouldConfirmDraftExit(nextRoute) {
  return isCreationRoute(state.route) && !isCreationRoute(nextRoute) && draftNeedsSave();
}

function requestDraftExit(continuation) {
  const draft = currentDraft();
  if (!draftNeedsSave(draft)) {
    Promise.resolve(continuation()).catch(console.error);
    return false;
  }
  state.pendingDraftExit = continuation;
  openSheet(`<div class="sheet-copy sheet-copy--compact"><h3 id="sheet-title">是否保存这份草稿？</h3></div><div class="draft-exit-actions"><button type="button" class="draft-exit-button" data-action="save-draft-exit">保存草稿</button><button type="button" class="draft-exit-button draft-exit-button--danger" data-action="discard-draft-exit">不保存</button><button type="button" class="draft-exit-button" data-action="cancel-draft-exit">继续创作</button></div>`);
  return true;
}

async function resolveDraftExit(save) {
  const continuation = state.pendingDraftExit;
  const draft = currentDraft();
  closeSheet();
  if (!continuation || !draft) return;
  if (save) {
    if (!await commitDraft(draft)) return;
    showToast("草稿已保存");
  } else {
    await discardDraftChanges(draft);
  }
  await continuation();
}

function performNavigate(route, { replace = false, taskId = null, workId = null, orderId = null } = {}) {
  if (!routeMeta[route]) route = "home";
  if (!replace) state.history.push({ route: state.route, tab: state.tab, editorStep: state.editorStep, taskId: state.activeTaskId, workId: state.activeWorkId, orderId: state.activeOrderId, caseId: state.activeCaseId, placeId: state.activePlaceId });
  state.route = route;
  if (taskId) state.activeTaskId = taskId;
  if (workId) state.activeWorkId = workId;
  if (orderId) state.activeOrderId = orderId;
  render(true);
}

function navigate(route, options = {}) {
  if (!routeMeta[route]) route = "home";
  if (shouldConfirmDraftExit(route)) {
    requestDraftExit(() => performNavigate(route, options));
    return false;
  }
  performNavigate(route, options);
  return true;
}

function performSwitchTab(tab) {
  if (!["home", "create", "profile"].includes(tab)) return;
  state.tab = tab;
  state.route = tab;
  state.history = [];
  state.editorHistory = [];
  render(true);
}

function switchTab(tab) {
  if (!["home", "create", "profile"].includes(tab)) return false;
  if (shouldConfirmDraftExit(tab)) {
    requestDraftExit(() => performSwitchTab(tab));
    return false;
  }
  performSwitchTab(tab);
  return true;
}

function goBack() {
  if (state.route === "editor" && state.editorHistory.length) {
    state.editorStep = state.editorHistory.pop();
    render(true);
    return;
  }
  if (state.route === "generating" && !state.history.length) {
    switchTab("create");
    showToast("任务会继续生成，可从首页或我的返回查看");
    return;
  }
  const previous = state.history[state.history.length - 1];
  if (previous) {
    const restorePrevious = () => {
      state.history.pop();
      state.route = previous.route;
      state.tab = previous.tab;
      state.editorStep = previous.editorStep;
      state.activeTaskId = previous.taskId;
      state.activeWorkId = previous.workId;
      state.activeOrderId = previous.orderId;
      state.activeCaseId = previous.caseId;
      state.activePlaceId = previous.placeId;
      render(true);
    };
    if (shouldConfirmDraftExit(previous.route)) requestDraftExit(restorePrevious);
    else restorePrevious();
    return;
  }
  switchTab(state.route === "editor" ? "create" : "home");
}

function renderChrome() {
  const base = routeMeta[state.route] || routeMeta.home;
  const stepTitle = Object.fromEntries(editorSteps);
  const inspiration = officialCases.find(item => item.id === state.activeCaseId) || officialCases[0];
  const place = popularPlaces.find(item => item.id === state.activePlaceId) || popularPlaces[0];
  const generationTask = activeTask();
  const title = state.route === "editor"
    ? `${stepTitle[state.editorStep] || "方案"}编辑`
    : state.route === "generating"
      ? generationTask?.stage === "preview" ? "生成预览" : "生成全部"
    : state.route === "inspiration"
      ? inspiration.title
      : state.route === "place"
        ? place.detailTitle || place.name
        : base.title;
  appBar.hidden = false;
  appBack.hidden = !base.back;
  appBar.classList.toggle("app-bar--no-back", !base.back);
  appBar.classList.toggle("app-bar--create", state.route === "create");
  appTitle.textContent = title;
  appEyebrow.textContent = "";
  appEyebrow.hidden = true;
  routeLabel.textContent = base.label;
  tabBar.hidden = !base.tab;
  device.classList.toggle("device--subpage", !base.tab);
  device.classList.toggle("device--immersive-home", state.route === "home" && state.initialized && state.demoState === "normal");
  device.classList.toggle("device--home-static", state.route === "home" && state.initialized && state.demoState === "normal");
  if (!base.tab) return;
  tabBar.dataset.activeTab = state.tab;
  const tabs = [
    { key: "home", label: "首页", icon: "home" },
    { key: "create", label: "一键旅拍", icon: "camera", core: true },
    { key: "profile", label: "我的", icon: "user" }
  ];
  tabBar.innerHTML = `
    <svg class="tab-bar__curve" viewBox="0 0 375 30" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="tab-bar__curve-fill" d="M0 29 H72 C126 29 145 6 187.5 6 C230 6 249 29 303 29 H375 V30 H0 Z"></path><path class="tab-bar__curve-line" d="M0 29 H72 C126 29 145 6 187.5 6 C230 6 249 29 303 29 H375"></path></svg>
    ${tabs.map(item => {
      const selected = state.tab === item.key;
      return `<button type="button" class="tab-button t-tab-bar-item ${item.core ? "tab-button--create" : ""} ${selected ? "tab-button--active" : ""}" data-action="switch-tab" data-tab="${item.key}" role="tab" aria-selected="${selected}" aria-current="${selected ? "page" : "false"}" aria-label="切换到${item.label}"><span class="t-tab-bar-item__content ${selected ? "t-tab-bar-item__content--checked" : ""}"><span class="tab-icon-wrap t-tab-bar-item__icon">${tdIcon(`${item.icon}${selected ? "-filled" : ""}`, item.core ? 26 : 24)}</span><span class="t-tab-bar-item__text">${item.label}</span></span></button>`;
    }).join("")}`;
}

function renderLoadingState() {
  return `<div class="state-page skeleton-page" aria-label="正在加载"><span class="skeleton skeleton--hero"></span><span class="skeleton skeleton--line"></span><span class="skeleton skeleton--card"></span><span class="skeleton skeleton--card"></span></div>`;
}

function renderEmptyState() {
  return `<div class="state-page"><div class="state-card"><span class="state-icon">${tdIcon("image", 28)}</span><h3>这里还没有内容</h3><p>上传近照和全身照，开始第一份国风作品包。</p><button class="primary-button" data-action="start-creation">开始旅拍</button><button class="text-button" data-action="clear-demo">返回当前页面</button></div></div>`;
}

function renderErrorState() {
  return `<div class="state-page"><div class="state-card"><span class="state-icon state-icon--danger">!</span><h3>页面暂时没有准备好</h3><p>草稿和作品仍保存在当前浏览器，可以重新加载。</p><button class="primary-button" data-action="retry-demo">重新加载</button><button class="text-button" data-action="clear-demo">稍后再试</button></div></div>`;
}

function renderPermissionState() {
  return `<div class="state-page"><div class="state-card"><span class="state-icon">${tdIcon("user", 28)}</span><h3>没有读取照片的权限</h3><p>只有在你主动拍摄或选择照片时才会请求权限。可在浏览器设置中开启，也可以先返回。</p><button class="primary-button" data-action="open-settings">查看开启方法</button><button class="text-button" data-action="clear-demo">继续浏览</button></div></div>`;
}

function render({ animate = false, preserveScroll = false } = {}) {
  const previousScrollTop = screen.scrollTop;
  const previousInnerScrollTop = screen.querySelector(".screen-scroll")?.scrollTop || 0;
  const taskChanged = syncTasks();
  if (taskChanged) persistSnapshot();
  renderChrome();
  screen.className = "screen";
  let content;
  if (!state.initialized || state.demoState === "loading") content = renderLoadingState();
  else if (state.demoState === "empty") content = renderEmptyState();
  else if (state.demoState === "error") content = renderErrorState();
  else if (state.demoState === "permission") content = renderPermissionState();
  else content = renderRoute();
  if (state.demoState === "offline" && state.initialized) content = `<div class="network-banner">网络不可用 · 草稿与已有作品仍可浏览</div>${content}`;
  screen.innerHTML = content;
  if (animate) {
    screen.classList.add("screen-enter");
    setTimeout(() => screen.classList.remove("screen-enter"), 280);
  }
  screen.scrollTop = preserveScroll ? previousScrollTop : 0;
  const nextInnerScroll = screen.querySelector(".screen-scroll");
  if (nextInnerScroll) nextInnerScroll.scrollTop = preserveScroll ? previousInnerScrollTop : 0;
  bindMediaFallbacks();
  bindHomeHeroImages();
  syncHomeCaseCarousel();
}

function renderRoute() {
  switch (state.route) {
    case "home": return renderHome();
    case "create": return renderCreate();
    case "profile": return renderProfile();
    case "works": return renderWorks();
    case "member": return renderMemberCenter();
    case "drafts": return renderDrafts();
    case "orders": return renderOrders();
    case "order": return renderOrderDetail(activeOrder());
    case "inspiration": return renderInspirationDetail();
    case "place": return renderPlaceDetail();
    case "editor": return renderEditor();
    case "generating": return renderGenerating();
    case "appearance": return renderAppearanceConfirmation(activeOrder());
    case "work": return renderWorkDetail(activeWork());
    case "benefits": return renderBenefits();
    default: return renderHome();
  }
}

function bindMediaFallbacks(root = screen) {
  root.querySelectorAll("img[data-fallback]").forEach(image => {
    image.addEventListener("error", () => image.closest(".media-shell")?.classList.add("media-shell--error"), { once: true });
    image.addEventListener("load", () => image.closest(".media-shell")?.classList.remove("media-shell--error"), { once: true });
  });
  root.querySelectorAll("video[data-fallback]").forEach(video => {
    video.addEventListener("error", () => video.closest(".media-shell")?.classList.add("media-shell--error"), { once: true });
    video.addEventListener("loadeddata", () => video.closest(".media-shell")?.classList.remove("media-shell--error"), { once: true });
  });
}

function bindHomeHeroImages() {
  screen.querySelectorAll(".home-hero__photo").forEach(image => {
    const media = image.closest(".home-hero__media--photo");
    if (!media) return;
    const markLoaded = () => {
      media.classList.add("home-hero__media--loaded");
      media.classList.remove("home-hero__media--error");
    };
    const markFailed = () => {
      media.classList.remove("home-hero__media--loaded");
      media.classList.add("home-hero__media--error");
    };
    image.addEventListener("load", markLoaded, { once: true });
    image.addEventListener("error", markFailed, { once: true });
    if (image.complete) {
      if (image.naturalWidth > 0) markLoaded();
      else markFailed();
    }
  });
}

function applyHomeCaseState() {
  const carousel = screen.querySelector(".case-carousel");
  if (!carousel) return;
  const track = carousel.querySelector(".case-carousel__track");
  if (track) track.style.transform = `translate3d(-${state.homeCaseIndex * 100}%, 0, 0)`;
  carousel.querySelectorAll(".case-card").forEach((card, index) => {
    const active = index === state.homeCaseIndex;
    card.classList.toggle("case-card--active", active);
    card.setAttribute("aria-hidden", String(!active));
    card.inert = !active;
  });
  carousel.querySelectorAll(".case-carousel__dot").forEach((dot, index) => {
    const active = index === state.homeCaseIndex;
    dot.classList.toggle("case-carousel__dot--active", active);
    dot.setAttribute("aria-pressed", String(active));
    if (active) dot.setAttribute("aria-current", "true");
    else dot.removeAttribute("aria-current");
  });
  const announcement = carousel.querySelector(".case-carousel__announcement");
  if (announcement) announcement.textContent = `第 ${state.homeCaseIndex + 1} 张：${homeInspirationCases[state.homeCaseIndex].title}`;
}

function stopHomeCaseCarousel() {
  if (!state.homeCaseTimer) return;
  clearInterval(state.homeCaseTimer);
  state.homeCaseTimer = null;
}

function syncHomeCaseCarousel({ restart = false } = {}) {
  const shouldRun = state.initialized && state.route === "home" && state.demoState === "normal" && !document.hidden && !state.homeCaseCarouselPaused;
  if (!shouldRun) {
    stopHomeCaseCarousel();
    return;
  }
  if (restart) stopHomeCaseCarousel();
  if (state.homeCaseTimer) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  state.homeCaseTimer = setInterval(() => {
    state.homeCaseIndex = (state.homeCaseIndex + 1) % homeInspirationCases.length;
    applyHomeCaseState();
  }, HOME_CASE_INTERVAL_MS);
}

function renderTaskCard(task, compact = false, statusLabel = "") {
  const progress = Math.round(taskProgress(task) * 100);
  const taskLabel = task.stage === "preview" ? "生成预览" : "生成全部";
  return `<button type="button" class="task-card ${compact ? "task-card--compact" : ""}" data-action="open-task" data-task-id="${task.id}">
    <span class="task-card__visual"><span class="task-orbit"></span>${tdIcon("star", 22)}</span>
    <span class="task-card__copy">${statusLabel ? `<small class="profile-item-status">${escapeHtml(statusLabel)}</small>` : ""}<strong>${taskLabel} ${progress}%</strong><span>离开页面不会中断</span></span>
    <span class="task-card__progress"><i style="width:${progress}%"></i></span>
    <span class="task-card__arrow">${tdIcon("chevron-right", 18)}</span>
  </button>`;
}

function renderWorkCard(work, compact = false, statusLabel = "") {
  const readyPhotos = work.items.filter(item => item.type === "photo" && item.status === "ready");
  const cover = readyPhotos[0]?.source || MEDIA.resultPhotos[0];
  return `<button type="button" class="work-card ${compact ? "work-card--compact" : ""}" data-action="open-work" data-work-id="${work.id}">
    <span class="media-shell work-card__cover"><img src="${escapeHtml(cover)}" alt="${escapeHtml(work.title)}封面" data-fallback /><span class="media-fallback">${tdIcon("image", 28)}<small>封面加载失败</small></span></span>
    <span class="work-card__copy">${statusLabel ? `<small class="profile-item-status">${escapeHtml(statusLabel)}</small>` : ""}<strong>${escapeHtml(work.title)}</strong></span>
    <span class="work-card__arrow">${tdIcon("chevron-right", 18)}</span>
  </button>`;
}

function resolveGallerySection({ posterAvailable = false, vlogAvailable = false } = {}) {
  if (state.gallerySection === "poster" && posterAvailable) return "poster";
  if (state.gallerySection === "vlog" && vlogAvailable) return "vlog";
  return "photos";
}

function renderGallerySectionTabs(activeSection, { posterAvailable = true, vlogAvailable = true } = {}) {
  const tabs = [
    { key: "photos", label: "写真集", available: true },
    { key: "poster", label: "海报", available: posterAvailable },
    { key: "vlog", label: "VLOG预览", available: vlogAvailable }
  ];
  return `<nav class="gallery-section-tabs" aria-label="成片内容" role="tablist">${tabs.map(tab => {
    const active = tab.key === activeSection;
    return `<button type="button" class="gallery-section-tab ${active ? "gallery-section-tab--active" : ""}" data-action="set-gallery-section" data-section="${tab.key}" role="tab" aria-selected="${active}" aria-controls="gallery-section-panel" ${tab.available ? "" : "disabled"}>${tab.label}</button>`;
  }).join("")}</nav>`;
}

function renderPosterPreview({ title, source }) {
  if (!source) return `<section class="inspiration-detail__section" id="gallery-section-panel" role="tabpanel" aria-label="海报"><div class="work-section-empty">这份内容暂无海报</div></section>`;
  return `<section class="inspiration-detail__section inspiration-poster" id="gallery-section-panel" role="tabpanel" aria-label="海报">
    <article class="media-shell inspiration-poster__media">
      <img src="${escapeHtml(source)}" alt="${escapeHtml(title)}专属海报" loading="lazy" decoding="async" data-fallback />
      <span class="media-fallback">${tdIcon("image", 28)}<small>海报加载失败</small></span>
      <span class="inspiration-poster__shade" aria-hidden="true"></span>
      <span class="inspiration-poster__brand">施·旅拍</span>
      <span class="inspiration-poster__copy"><small>AI TRAVEL PORTRAIT</small><strong>${escapeHtml(title)}</strong><i>写真 · 海报 · VLOG</i></span>
    </article>
  </section>`;
}

function renderPhotoGallery({ title, photos, caseId, placeId = "", videoSource = "" }) {
  const posterSource = photos[0] || "";
  const gallerySection = resolveGallerySection({ posterAvailable: Boolean(posterSource), vlogAvailable: Boolean(videoSource) });
  let sectionContent = "";
  if (gallerySection === "photos") {
    sectionContent = `<section class="inspiration-detail__section" id="gallery-section-panel" role="tabpanel" aria-label="写真集">
      <div class="inspiration-gallery" aria-label="${escapeHtml(title)}写真图集">
        ${photos.map((source, index) => `<figure class="inspiration-photo"><span class="media-shell inspiration-photo__media"><img src="${escapeHtml(source)}" alt="${escapeHtml(title)}第 ${index + 1} 张写真" loading="lazy" decoding="async" data-fallback /><span class="media-fallback">${tdIcon("image", 28)}<small>图片加载失败</small></span><i>${String(index + 1).padStart(2, "0")} / ${String(photos.length).padStart(2, "0")}</i></span></figure>`).join("")}
      </div>
    </section>`;
  } else if (gallerySection === "poster") {
    sectionContent = renderPosterPreview({ title, source: posterSource });
  } else {
    sectionContent = `<section class="inspiration-detail__section inspiration-vlog" id="gallery-section-panel" role="tabpanel" aria-label="VLOG预览"><span class="media-shell inspiration-vlog__media"><video src="${escapeHtml(videoSource)}" poster="${escapeHtml(posterSource)}" controls playsinline preload="metadata" aria-label="${escapeHtml(title)}VLOG预览" data-fallback></video><span class="media-fallback">${tdIcon("video-camera", 28)}<small>视频加载失败，请重试</small></span></span></section>`;
  }
  return `<div class="screen-layout inspiration-detail-layout"><div class="screen-scroll"><div class="page page--sub page--with-dock inspiration-detail-page">
    ${renderGallerySectionTabs(gallerySection, { posterAvailable: Boolean(posterSource), vlogAvailable: Boolean(videoSource) })}
    ${sectionContent}
    </div></div><section class="fixed-dock inspiration-detail__action"><button type="button" class="primary-button" data-action="use-case" data-case-id="${caseId}"${placeId ? ` data-place-id="${placeId}"` : ""}>一键生成同款</button></section></div>`;
}

function renderInspirationDetail() {
  const inspiration = officialCases.find(item => item.id === state.activeCaseId) || officialCases[0];
  return renderPhotoGallery({
    title: inspiration.title,
    photos: inspiration.photos?.length ? inspiration.photos : [inspiration.image],
    caseId: inspiration.id,
    videoSource: inspiration.videoSource ?? MEDIA.resultVideo
  });
}

function renderPlaceDetail() {
  const place = popularPlaces.find(item => item.id === state.activePlaceId) || popularPlaces.find(item => item.photos?.length) || popularPlaces[0];
  return renderPhotoGallery({
    title: place.galleryTitle || place.name,
    photos: place.photos?.length ? place.photos : [place.image],
    caseId: place.caseId,
    placeId: place.id,
    videoSource: place.videoSource || ""
  });
}

function renderHome() {
  const task = runningTasks()[0];
  const visiblePopularPlaces = popularPlaces.slice(0, 3);
  return `<div class="page home-page">
    <section class="home-hero home-hero--immersive home-hero--static" aria-label="首页固定主视觉">
      <div class="home-hero__viewport">
        <figure class="home-hero__slide home-hero__slide--active">
          <div class="home-hero__media home-hero__media--photo"><img class="home-hero__photo" src="${escapeHtml(homeHero.image)}" data-src="${escapeHtml(homeHero.image)}" alt="${escapeHtml(homeHero.alt)}" decoding="async" /><button type="button" class="home-hero__image-retry" data-action="retry-home-slide-image">图片加载失败 · 重试</button></div>
        </figure>
      </div>
    </section>

    ${task ? `<section class="content-section"><div class="section-head"><div><small>生成任务</small><h3>作品正在准备</h3></div></div>${renderTaskCard(task)}</section>` : ""}

    <section class="content-section">
      <div class="section-head"><div class="section-head__title section-head__title--icon">${tdIcon("ai-video-filled", 23)}<h3>热门灵感</h3></div><button type="button" class="section-head__more" data-action="show-pending-update">查看更多${tdIcon("chevron-right", 14)}</button></div>
      <div class="case-carousel" aria-roledescription="轮播图" aria-label="热门灵感轮播">
        <div class="case-carousel__viewport">
          <div class="case-carousel__track" style="transform:translate3d(-${state.homeCaseIndex * 100}%,0,0)">
            ${homeInspirationCases.map((item, index) => {
              const action = item.photos?.length ? "open-inspiration" : "use-case";
              const actionLabel = item.photos?.length ? `查看${item.title}完整图集` : `用${item.title}方案创作`;
              return `<article class="case-card ${index === state.homeCaseIndex ? "case-card--active" : ""}" role="group" aria-roledescription="幻灯片" aria-label="${index + 1} / ${homeInspirationCases.length}：${escapeHtml(item.title)}" aria-hidden="${index !== state.homeCaseIndex}" ${index === state.homeCaseIndex ? "" : "inert"}><button type="button" class="media-shell case-card__media" data-action="${action}" data-case-id="${item.id}" aria-label="${escapeHtml(actionLabel)}"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}效果示意" style="object-position:${escapeHtml(item.position || "50% 50%")};" data-fallback /><span class="media-fallback">${tdIcon("image", 28)}</span></button><div class="case-card__copy"><strong>${escapeHtml(item.title)}</strong><button type="button" data-action="${action}" data-case-id="${item.id}" aria-label="${escapeHtml(actionLabel)}">${tdIcon("chevron-right", 16)}</button></div></article>`;
            }).join("")}
          </div>
        </div>
        <div class="case-carousel__dots" role="group" aria-label="切换热门灵感">${homeInspirationCases.map((item, index) => `<button type="button" class="case-carousel__dot ${index === state.homeCaseIndex ? "case-carousel__dot--active" : ""}" data-action="set-home-case" data-case-index="${index}" aria-label="切换到：${escapeHtml(item.title)}" aria-pressed="${index === state.homeCaseIndex}" ${index === state.homeCaseIndex ? `aria-current="true"` : ""}></button>`).join("")}</div>
        <span class="case-carousel__announcement visually-hidden" aria-live="polite"></span>
      </div>
    </section>

    <section class="content-section">
      <div class="section-head"><div class="section-head__title section-head__title--icon section-head__title--place">${tdIcon("map-filled", 23)}<h3>热门场景</h3></div><button type="button" class="section-head__more" data-action="show-pending-update">查看更多${tdIcon("chevron-right", 14)}</button></div>
      <div class="template-list template-list--home" id="home-popular-places">
        ${visiblePopularPlaces.map(item => {
          const action = item.photos?.length ? "open-place" : "use-case";
          const actionLabel = item.photos?.length ? `查看${item.name}${item.galleryTitle}完整图集` : `用${item.name}场景创作`;
          return `<button type="button" class="home-place-card" data-action="${action}" ${item.photos?.length ? `data-place-id="${item.id}"` : `data-case-id="${item.caseId}"`} aria-label="${escapeHtml(actionLabel)}" style="--place-overlay:${escapeHtml(item.overlay)};--place-position:${escapeHtml(item.position || "center")}"><span class="media-shell home-place-card__media"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}国风写真示意" data-fallback /><span class="media-fallback">${tdIcon("image", 24)}</span></span><span class="home-place-card__shade" aria-hidden="true"></span><span class="home-place-card__name">${tdIcon("city-ancient-filled", 16)}<span>${escapeHtml(item.name)}</span></span><i>${tdIcon("chevron-right", 18)}</i></button>`;
        }).join("")}
      </div>
    </section>

  </div>`;
}

function renderPortraitPair(draft) {
  return `<div class="portrait-pair">
    ${["near", "full"].map(kind => {
      const portrait = draft.portraits[kind];
      const src = portraitSource(portrait);
      const label = kind === "near" ? "近照" : "全身照";
      const hint = kind === "near" ? "清晰正面 · 半身以上" : "正面站立 · 全身完整";
      const guide = kind === "near" ? MEDIA.portraitNearGuide : MEDIA.portraitFullGuide;
      return `<button type="button" class="portrait-thumb ${src ? "portrait-thumb--ready" : ""}" data-action="choose-portrait-source" data-slot="${kind}" aria-label="${src ? `更换${label}` : `上传${label}`}">${src ? `<img src="${escapeHtml(src)}" alt="已上传的${label}" />` : `<span class="portrait-thumb__empty portrait-thumb__empty--${kind}"><span class="portrait-thumb__figure"><img class="portrait-thumb__guide portrait-thumb__guide--${kind}" src="${escapeHtml(guide)}" alt="" aria-hidden="true" /></span></span>`}<span class="portrait-thumb__label ${src ? "portrait-thumb__label--ready" : "portrait-thumb__label--empty"}"><strong>${src ? label : `添加${label}`}</strong>${src ? "" : `<em>${hint}</em>`}</span>${src ? `<i>${tdIcon("check", 12)}</i>` : ""}</button>`;
    }).join("")}
  </div>`;
}

function currentCreationMode() {
  return state.snapshot.settings.creationMode === "custom" ? "custom" : "template";
}

function applyOneClickTemplate(draft, caseId) {
  const preset = officialCases.find(item => item.id === caseId) || officialCases.find(item => item.id === creationTemplateCases(draft)[0].caseId);
  if (!draft || !preset) return;
  draft.sourceCaseId = preset.id;
  draft.styleId = preset.styleId;
  draft.clothingId = preset.styleId;
  draft.sceneId = preset.sceneId;
  draft.templateId = preset.templateId;
  draft.customized = currentCreationMode() === "custom";
  draft.updatedAt = Date.now();
}

function renderOneClickTemplateCards(draft) {
  const templates = creationTemplateCases(draft);
  const selectedCaseId = templates.some(item => item.caseId === draft.sourceCaseId)
    ? draft.sourceCaseId
    : templates[0].caseId;
  return `<div class="one-click-template-list" aria-label="一键成片模板">
    ${templates.map(item => {
      const selected = item.caseId === selectedCaseId;
      return `<article class="one-click-template-card ${selected ? "one-click-template-card--selected" : ""}" style="--template-image-position:${escapeHtml(item.position)};--template-overlay:${escapeHtml(item.overlay)}">
        <button type="button" class="one-click-template-card__select" data-action="select-template-case" data-case-id="${item.caseId}" aria-pressed="${selected}" aria-label="选择${escapeHtml(item.name)}模板">
          <span class="media-shell one-click-template-card__media"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}组照预览" data-fallback /><span class="media-fallback">${tdIcon("image", 24)}</span></span>
          <span class="one-click-template-card__shade" aria-hidden="true"></span>
          <span class="one-click-template-card__copy"><strong>${escapeHtml(item.name)}</strong></span>
          ${selected ? `<i class="create-option-card__check one-click-template-card__check" aria-hidden="true">${tdIcon("check", 12)}</i>` : ""}
        </button>
        <button type="button" class="one-click-template-card__detail" data-action="open-inspiration" data-case-id="${item.caseId}" aria-label="查看${escapeHtml(item.name)}模版详情">${tdIcon("chevron-right", 18)}</button>
      </article>`;
    }).join("")}
  </div>`;
}

function renderCreationModeTabs() {
  const mode = currentCreationMode();
  const tabs = [
    { key: "template", label: "一键模板" },
    { key: "custom", label: "自由创作" }
  ];
  return `<nav class="creation-mode-tabs" role="tablist" aria-label="旅拍创作方式">
    ${tabs.map(item => {
      const selected = mode === item.key;
      return `<button type="button" class="creation-mode-tab ${selected ? "creation-mode-tab--active" : ""}" data-action="switch-create-mode" data-mode="${item.key}" role="tab" aria-selected="${selected}" aria-controls="creation-mode-panel"><span>${item.label}</span></button>`;
    }).join("")}
  </nav>`;
}

function renderCreate() {
  const draft = ensureDraft(null, false);
  const mode = currentCreationMode();
  const ready = draftReady(draft);
  const running = state.snapshot.tasks.find(task => task.draftId === draft.id && ["queued", "processing"].includes(task.status));
  return `<div class="page create-page create-page--mode-${mode}">
    ${renderCreationModeTabs()}
    ${running ? `<section class="create-task">${renderTaskCard(running, true)}</section>` : ""}
    <section class="create-status-card ${ready ? "create-status-card--ready" : ""}">
      <div class="create-status-card__head"><span class="create-status-card__title-icon" aria-hidden="true">${tdIcon("image-add-filled", 21)}</span><h3>上传人物形象</h3></div>
      ${renderPortraitPair(draft)}
    </section>

    <section class="content-section create-plan create-plan--${mode}" id="creation-mode-panel" role="tabpanel">
      ${mode === "template" ? `<div class="section-head create-plan-gender-head">${renderSelectionSectionTitle("选择模版")}${renderCreationGenderSelector(draft)}</div>${renderOneClickTemplateCards(draft)}` : renderCreateCustomOptions(draft)}
    </section>

    <div class="create-actions"><button type="button" class="primary-button create-generate-button" data-action="start-generation" ${ready ? "" : "disabled"}>确认生成</button></div>
  </div>`;
}

function renderEditorPreview(draft) {
  const scene = optionById(sceneOptions, draft.sceneId);
  const template = optionById(templateOptions, draft.templateId);
  const { hair, makeup, clothing } = customLookByDraft(draft);
  const near = portraitSource(draft.portraits.near) || MEDIA.portraitNear;
  return `<section class="editor-preview"><img class="editor-preview__scene" src="${escapeHtml(scene.image)}" alt="${escapeHtml(scene.name)}预览" /><span class="editor-preview__veil"></span><span class="editor-preview__portrait"><img src="${escapeHtml(near)}" alt="当前人物近照" /></span><div class="editor-preview__copy"><small>${escapeHtml(hair.name)} · ${escapeHtml(makeup.name)}</small><strong>${escapeHtml(clothing.name)}</strong><span>${escapeHtml(scene.name)} · ${escapeHtml(template.name)}</span></div></section>`;
}

function renderChoiceCard(item, type, selected) {
  const meta = type === "template" ? `${item.photoCount} 张 · ${item.duration} 秒 · ${item.ratio}` : item.note;
  return `<button type="button" class="choice-card ${selected ? "choice-card--selected" : ""}" data-action="select-choice" data-choice-type="${type}" data-choice-id="${item.id}" aria-pressed="${selected}"><span class="media-shell choice-card__media"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}预览" data-fallback /><span class="media-fallback">${tdIcon(type === "template" ? "video-camera" : "image", 26)}</span>${item.recommended ? `<em>系统推荐</em>` : ""}</span><span class="choice-card__copy"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(meta)}</small></span>${selected ? `<i class="choice-card__check">${tdIcon("check", 13)}已选择</i>` : ""}</button>`;
}

function renderCreateOptionCard(item, type, selected) {
  const typeLabel = { hair: "发型", makeup: "妆容", clothing: "服装", template: "运镜", theme: "主题", scene: "场景" }[type] || "造型";
  return `<button type="button" class="create-option-card create-option-card--${type} ${type === "hair" && item.gender === "male" ? "create-option-card--hair-male" : ""} ${selected ? "create-option-card--selected" : ""}" data-action="select-choice" data-choice-type="${type}" data-choice-id="${item.id}" aria-label="选择${typeLabel}：${escapeHtml(item.name)}" aria-pressed="${selected}"><span class="media-shell create-option-card__media"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}${typeLabel}预览" data-fallback /><span class="media-fallback">${tdIcon(type === "template" ? "video-camera" : "image", 22)}</span>${item.recommended && type !== "hair" ? `<em>推荐</em>` : ""}</span><span class="create-option-card__copy"><strong>${escapeHtml(item.name)}</strong></span>${selected ? `<i class="create-option-card__check">${tdIcon("check", 12)}</i>` : ""}</button>`;
}

function renderSelectionSectionTitle(title) {
  return `<div class="section-head__title--icon">${tdIcon("gesture-click-filled", 21)}<h3>${escapeHtml(title)}</h3></div>`;
}

function renderCreationGenderSelector(draft) {
  const gender = draft?.gender === "male" ? "male" : "female";
  return `<div class="creation-gender-selector" role="radiogroup" aria-label="人物适配款式">${[["female", "女款"], ["male", "男款"]].map(([value, label]) => {
    const selected = value === gender;
    return `<button type="button" class="creation-gender-option ${selected ? "creation-gender-option--active" : ""}" data-action="select-creation-gender" data-gender="${value}" role="radio" aria-checked="${selected}">${label}</button>`;
  }).join("")}</div>`;
}

function renderCreateOptionSection(title, type, options, selectedId) {
  return `<section class="create-option-section"><div class="section-head">${renderSelectionSectionTitle(title)}</div><div class="create-option-grid">${options.map(item => renderCreateOptionCard(item, type, item.id === selectedId)).join("")}</div></section>`;
}

function renderCreateOptionGroupSections(group, draft, compact = false) {
  if (group.key === "theme") {
    const themes = creationTemplateCases(draft);
    const selectedId = themes.some(item => item.caseId === draft.sourceCaseId) ? draft.sourceCaseId : themes[0].caseId;
    return `<section class="create-option-section create-option-group-section create-option-group-section--theme"><div class="create-option-grid">${themes.map(item => renderCreateOptionCard({ ...item, id: item.caseId }, "theme", item.caseId === selectedId)).join("")}</div></section>`;
  }
  return customCategoriesForGroup(group, draft).map(category => {
    if (compact && ["makeup", "template"].includes(category.key)) return "";
    const selectedId = draft[category.draftKey];
    const selectedItem = optionById(category.options, selectedId);
    const summaryOnly = compact && group.categoryKeys.length === 1;
    const hideHeader = compact && category.key === "hair";
    return `<section class="create-option-section create-option-group-section create-option-group-section--${category.key}">
      ${hideHeader ? "" : `<div class="section-head create-option-group-section__head ${summaryOnly ? "create-option-group-section__head--summary-only" : ""}">
        ${summaryOnly ? "" : renderSelectionSectionTitle(category.label)}
        ${compact ? `<span class="create-option-active-panel__summary"><i>当前选择</i><strong>${escapeHtml(selectedItem.name)}</strong></span>` : ""}
      </div>`}
      <div class="create-option-grid">${category.options.map(item => renderCreateOptionCard(item, category.key, item.id === selectedId)).join("")}</div>
    </section>`;
  }).join("");
}

function renderLegacyCreateCustomOptions(draft) {
  return `<div class="create-custom-options">
    <div class="section-head create-plan-gender-head create-custom-options__title">${renderSelectionSectionTitle("个性定制")}${renderCreationGenderSelector(draft)}</div>
    ${customOptionGroups.map(group => `<section class="create-option-group">
      <div class="section-head create-option-group__head">${renderSelectionSectionTitle(group.label)}</div>
      <div class="create-option-group-sections">${renderCreateOptionGroupSections(group, draft)}</div>
    </section>`).join("")}
  </div>`;
}

function renderCompactCreateCustomOptions(draft) {
  const activeGroup = customOptionGroups.find(item => item.key === state.createOptionCategory) || customOptionGroups[0];
  return `<div class="create-custom-compact">
    <div class="section-head create-custom-compact__title create-plan-gender-head">${renderSelectionSectionTitle("个性定制")}${renderCreationGenderSelector(draft)}</div>
    <nav class="create-option-category-nav" aria-label="自由创作分类">
      <div class="create-option-category-nav__inner" role="tablist">
        ${customOptionGroups.map(item => {
          const active = item.key === activeGroup.key;
          return `<button type="button" class="create-option-category-tab ${active ? "create-option-category-tab--active" : ""}" id="create-option-tab-${item.key}" data-action="switch-create-category" data-category="${item.key}" role="tab" aria-selected="${active}" aria-controls="create-option-active-panel"><span>${item.label}</span></button>`;
        }).join("")}
      </div>
    </nav>
    <div class="create-option-active-panel create-option-group-sections" id="create-option-active-panel" role="tabpanel" aria-labelledby="create-option-tab-${activeGroup.key}">
      ${renderCreateOptionGroupSections(activeGroup, draft, true)}
    </div>
  </div>`;
}

function renderCreateCustomOptions(draft) {
  return COMPACT_CUSTOM_OPTIONS_ENABLED ? renderCompactCreateCustomOptions(draft) : renderLegacyCreateCustomOptions(draft);
}

function renderEditorContent(draft) {
  const { hair, makeup, clothing } = customLookByDraft(draft);
  if (state.editorStep === "hair") return `<section class="editor-section"><div class="editor-section__head"><small>1 / 6</small><h3>选择发型</h3><p>选择与脸型和服装气质相配的国风发型，发饰会随发型一起调整。</p></div><div class="choice-grid choice-grid--hair">${hairOptionsForDraft(draft).map(item => renderChoiceCard(item, "hair", item.id === draft.hairId)).join("")}</div></section>`;
  if (state.editorStep === "makeup") return `<section class="editor-section"><div class="editor-section__head"><small>2 / 6</small><h3>选择妆容</h3><p>选择妆面风格，系统会保持人物原有五官和可识别特征。</p></div><div class="choice-grid">${makeupOptions.map(item => renderChoiceCard(item, "makeup", item.id === draft.makeupId)).join("")}</div></section>`;
  if (state.editorStep === "clothing") return `<section class="editor-section"><div class="editor-section__head"><small>3 / 6</small><h3>选择服装</h3><p>选择汉服服装与配色，系统会根据全身照匹配自然体态和衣褶。</p></div><div class="choice-grid">${clothingOptions.map(item => renderChoiceCard(item, "clothing", item.id === draft.clothingId)).join("")}</div></section>`;
  if (state.editorStep === "scene") return `<section class="editor-section"><div class="editor-section__head"><small>4 / 6</small><h3>选择场景</h3><p>选择与造型气质相配的国风场景，系统会自动协调人物光线和画面色调。</p></div><div class="choice-grid">${sceneOptions.map(item => renderChoiceCard(item, "scene", item.id === draft.sceneId)).join("")}</div></section>`;
  if (state.editorStep === "template") return `<section class="editor-section"><div class="editor-section__head"><small>5 / 6</small><h3>选择运镜</h3><p>选择短视频的卡点节奏、运镜、转场和配乐风格。</p></div><div class="choice-grid">${templateOptions.map(item => renderChoiceCard(item, "template", item.id === draft.templateId)).join("")}</div></section>`;
  return `<section class="editor-section confirm-section"><div class="recommend-banner"><span>${tdIcon("star", 20)}</span><div><strong>${draft.customized ? "自由方案已按你的选择更新" : "系统推荐方案已准备好"}</strong><small>${draft.customized ? "可以继续修改，或直接开始生成" : "保留推荐也可以直接生成"}</small></div></div><div class="editor-section__head"><small>6 / 6</small><h3>确认自由创作方案</h3></div><div class="confirm-list">
    <button data-action="change-editor-step" data-step="hair"><span>选择发型</span><strong>${escapeHtml(hair.name)}</strong>${tdIcon("chevron-right", 16)}</button>
    <button data-action="change-editor-step" data-step="makeup"><span>选择妆容</span><strong>${escapeHtml(makeup.name)}</strong>${tdIcon("chevron-right", 16)}</button>
    <button data-action="change-editor-step" data-step="clothing"><span>选择服装</span><strong>${escapeHtml(clothing.name)}</strong>${tdIcon("chevron-right", 16)}</button>
    <button data-action="change-editor-step" data-step="scene"><span>选择场景</span><strong>${escapeHtml(optionById(sceneOptions, draft.sceneId).name)}</strong>${tdIcon("chevron-right", 16)}</button>
    <button data-action="change-editor-step" data-step="template"><span>选择运镜</span><strong>${escapeHtml(optionById(templateOptions, draft.templateId).name)}</strong>${tdIcon("chevron-right", 16)}</button>
  </div><div class="confirm-auto-note"><strong>其余设置由系统推荐</strong><span>写真数量与短视频输出会自动匹配。</span></div>${draft.customized ? "" : `<button class="outline-button confirm-customize" data-action="change-editor-step" data-step="hair">展开自由创作</button>`}</section>`;
}

function renderEditor() {
  const draft = ensureDraft();
  const adjustmentOrder = currentPreviewAdjustmentOrder();
  const index = editorSteps.findIndex(([key]) => key === state.editorStep);
  const nextLabel = state.editorStep === "confirm"
    ? adjustmentOrder ? "提交并生成新预览" : "确认方案"
    : index === editorSteps.length - 2 ? "下一步：确认方案" : `下一步：${editorSteps[index + 1]?.[1] || "确认"}`;
  return `<div class="screen-layout"><div class="screen-scroll"><div class="page page--sub page--with-dock editor-page">${renderEditorPreview(draft)}<nav class="editor-stepper" aria-label="创作步骤">${editorSteps.map(([key, label], stepIndex) => `<button data-action="change-editor-step" data-step="${key}" class="${key === state.editorStep ? "active" : ""} ${stepIndex < index ? "done" : ""}" aria-current="${key === state.editorStep ? "step" : "false"}"><span>${stepIndex < index ? tdIcon("check", 11) : stepIndex + 1}</span><small>${label}</small></button>`).join("")}</nav>${renderEditorContent(draft)}</div></div><div class="fixed-dock">${state.editorStep === "confirm" ? adjustmentOrder ? `<div class="preview-adjustment-note"><strong>调整方案不扣次数</strong><span>成功生成新预览后，将使用 1 次换版机会</span></div>` : renderCheckoutPreview(draft, true) : ""}<button class="primary-button" data-action="editor-next">${nextLabel}</button>${state.editorStep !== "confirm" ? `<button class="text-button" data-action="change-editor-step" data-step="confirm">返回方案确认</button>` : ""}</div></div>`;
}

function renderAppearanceConfirmation(order) {
  const versions = previewVersionsForOrder(order);
  const version = selectedPreviewVersion(order);
  if (!order || !version) return `<div class="state-page"><div class="state-card"><h3>形象预览尚未准备好</h3><p>如果预览仍在生成，可以从订单或进行中任务查看进度。</p><button class="primary-button" data-action="view-order-task" data-order-id="${order?.id || ""}">查看生成进度</button></div></div>`;
  const mediaError = state.demoState === "media-error";
  const locked = Boolean(order.lockedPreviewVersionId);
  const previewTasks = tasksForOrder(order).filter(task => task.stage === "preview");
  const generatingTask = previewTasks.find(task => ["queued", "processing"].includes(task.status)) || null;
  const failedTask = !generatingTask && previewTasks[0]?.status === "failed" ? previewTasks[0] : null;
  const pendingVersionIndex = Math.min(MAX_PREVIEW_REROLLS + 1, versions.length + 1);
  const singleVersion = versions.length === 1 && !generatingTask && !failedTask;
  const rerollsRemaining = previewRerollsRemaining(order);
  const versionSets = versions.map(item => {
    const selected = item.id === version.id;
    const fullBodySource = mediaError ? "./assets/missing-preview-look.jpg" : item.fullBodySource;
    const photoSource = mediaError ? "./assets/missing-preview-photo.jpg" : item.photoSource;
    const selectAttributes = `data-action="select-preview-version" data-order-id="${order.id}" data-preview-version-id="${item.id}" aria-pressed="${selected}" ${locked ? `aria-disabled="true"` : `tabindex="0"`}`;
    const selectedMark = selected ? `<span class="appearance-version-choice">${tdIcon("check", 11)}当前选择</span>` : "";
    return `<section class="appearance-version-set ${selected ? "appearance-version-set--selected" : ""}" ${selectAttributes} aria-label="选择第${item.index}版人物与画面${selected ? "，当前已选择" : ""}">
      ${selectedMark}
      <article class="appearance-preview-card"><span class="media-shell appearance-preview-card__media appearance-preview-card__media--look"><img src="${escapeHtml(fullBodySource)}" data-original-source="${escapeHtml(item.fullBodySource)}" alt="第${item.index}版人物形象照" data-fallback /><button type="button" class="appearance-preview-card__zoom" data-action="open-appearance-image" data-source="${escapeHtml(item.fullBodySource)}" data-label="第${item.index}版人物形象照" aria-label="查看第${item.index}版人物形象照大图">${tdIcon("search", 12)}大图</button><span class="media-fallback">${tdIcon("image", 24)}<small>人物形象照加载失败</small><button type="button" data-action="retry-preview-media">重新加载</button></span></span><footer class="appearance-preview-card__footer"><strong>人物形象照</strong></footer></article>
      <article class="appearance-preview-card"><span class="media-shell appearance-preview-card__media"><img src="${escapeHtml(photoSource)}" data-original-source="${escapeHtml(item.photoSource)}" alt="第${item.index}版写真预览照" data-fallback /><button type="button" class="appearance-preview-card__zoom" data-action="open-appearance-image" data-source="${escapeHtml(item.photoSource)}" data-label="第${item.index}版写真预览照" aria-label="查看第${item.index}版写真预览照大图">${tdIcon("search", 12)}大图</button><span class="media-fallback">${tdIcon("image", 24)}<small>写真预览照加载失败</small><button type="button" data-action="retry-preview-media">重新加载</button></span></span><footer class="appearance-preview-card__footer"><strong>写真预览照</strong></footer></article>
    </section>`;
  }).join("");
  const statusBlock = generatingTask
    ? `<div class="appearance-generation-status" role="status" aria-live="polite"><span class="appearance-version-spinner" aria-hidden="true"></span><div class="appearance-generation-status__copy"><strong>正在生成第${pendingVersionIndex}版</strong><small>已有版本保持不变，完成后会在下方自动展示。</small></div></div>`
    : failedTask
      ? `<div class="appearance-generation-status appearance-generation-status--failed" role="status"><span>!</span><div class="appearance-generation-status__copy"><strong>第${pendingVersionIndex}版生成失败</strong><small>已有版本仍然保留，本次不消耗免费次数。</small></div><button type="button" class="appearance-generation-status__retry" data-action="retry-preview-task" data-task-id="${failedTask.id}">免费重试</button></div>`
      : "";
  const primaryLabel = locked
    ? "查看完整内容生成进度"
    : versions.length === 1 ? "生成完整内容" : `使用第${version.index}版生成完整内容`;
  const rerollAction = !locked && !generatingTask && !failedTask && rerollsRemaining > 0
    ? `<button type="button" class="outline-button" data-action="regenerate-preview" data-order-id="${order.id}">重新生成形象 · 剩余${rerollsRemaining}次</button>`
    : "";
  const dockNote = !locked && rerollsRemaining === 0
    ? `<p class="appearance-actions__note">2次免费重新生成已用完</p>`
    : generatingTask
      ? `<p class="appearance-actions__note">正在生成第${pendingVersionIndex}版，完成后可继续</p>`
      : "";
  return `<div class="screen-layout appearance-layout"><div class="screen-scroll"><div class="page page--sub page--with-dock appearance-page ${singleVersion ? "appearance-page--single" : "appearance-page--multiple"}">
    <div class="appearance-version-list">${versionSets}${statusBlock}</div>
  </div></div><div class="fixed-dock appearance-actions">${dockNote}<button type="button" class="primary-button" data-action="accept-preview-version" data-order-id="${order.id}" ${generatingTask ? "disabled" : ""}>${primaryLabel}</button>${rerollAction}</div></div>`;
}

function renderGenerating() {
  const task = activeTask() || runningTasks()[0] || state.snapshot.tasks.find(item => item.type === "generation");
  if (!task) return `<div class="state-page"><div class="state-card"><h3>没有进行中的任务</h3><p>草稿仍然保留，可以返回一键旅拍重新提交。</p><button class="primary-button" data-action="switch-tab" data-tab="create">返回一键旅拍</button></div></div>`;
  state.activeTaskId = task.id;
  const progress = Math.round(taskProgress(task) * 100);
  const previewTask = task.stage === "preview";
  if (previewTask && task.status === "failed") {
    const order = task.orderId ? findOrder(task.orderId) : null;
    return `<div class="generation-page generation-page--failed"><span class="generation-error-mark">!</span><small>预览生成未完成</small><h3>本次不会消耗换版次数</h3><p>${escapeHtml(task.error || "人物素材和创作方案仍已保留，可以免费重试。")}</p><div class="generation-error-actions"><button class="primary-button" data-action="retry-preview-task" data-task-id="${task.id}">免费重试预览</button>${previewVersionsForOrder(order).length ? `<button class="outline-button" data-action="view-order-appearance" data-order-id="${order.id}">返回已有版本</button>` : ""}${previewVersionsForOrder(order).length && previewRerollsRemaining(order) > 0 ? `<button class="text-button" data-action="adjust-preview-plan" data-order-id="${order.id}">调整创作方案</button>` : ""}<button class="text-button" data-action="switch-tab" data-tab="profile">稍后从订单处理</button></div></div>`;
  }
  if (previewTask && task.status === "succeeded" && task.previewVersionId) {
    return `<div class="generation-page"><span class="generation-complete">${tdIcon("check", 26)}</span><small>形象预览已经准备好</small><h3>请确认人物与画面</h3><p>满意后再生成写真、海报和 VLOG。</p><button class="primary-button" data-action="view-preview-result" data-task-id="${task.id}">进入形象确认</button></div>`;
  }
  if (task.status === "failed") {
    const order = task.orderId ? findOrder(task.orderId) : null;
    const resolved = order && ["refund-pending", "benefit-returned"].includes(order.status);
    const failureCopy = resolved ? order.resolution : task.error;
    return `<div class="generation-page generation-page--failed"><span class="generation-error-mark">!</span><small>生成任务未完成</small><h3>${resolved ? "已进入退回处理" : "这次没有成功出片"}</h3><p>${escapeHtml(failureCopy)}</p><div class="generation-error-actions">${resolved ? "" : `<button class="primary-button" data-action="retry-task" data-task-id="${task.id}">${order ? "同一订单免费重试" : "保留方案并重试"}</button>`}<button class="outline-button" data-action="edit-task" data-task-id="${task.id}">修改创作方案</button><button class="text-button" data-action="switch-tab" data-tab="create">稍后处理</button></div></div>`;
  }
  if (task.status === "cancelled") return `<div class="generation-page generation-page--failed"><span class="generation-error-mark generation-error-mark--quiet">${tdIcon("close", 24)}</span><small>任务已取消</small><h3>人物照片和方案仍已保留</h3><p>可以返回草稿调整，也可以使用原方案重新生成。</p><button class="primary-button" data-action="retry-task" data-task-id="${task.id}">使用原方案重新生成</button><button class="text-button" data-action="switch-tab" data-tab="create">返回一键旅拍</button></div>`;
  if (["succeeded", "partial"].includes(task.status) && task.workId) return `<div class="generation-page"><span class="generation-complete">${tdIcon("check", 26)}</span><small>作品包已经准备好</small><h3>${task.status === "partial" ? "部分内容需要重试" : "写真与短视频已生成"}</h3><p>成功内容已经保存在作品详情中。</p><button class="primary-button" data-action="view-task-result" data-task-id="${task.id}">查看作品详情</button></div>`;
  return `<div class="generation-page generation-page--processing"><div class="generation-orbit" aria-hidden="true"><span></span><span></span><i>施</i></div>${previewTask ? "" : "<small>正在生成全部</small>"}<h3>${previewTask ? "正在生成" : "整套作品正在生成"}</h3>${previewTask ? "" : "<p>当前形象版本已锁定，写真、海报和 VLOG 会保持人物一致。</p>"}<div class="generation-progress" aria-label="生成进度 ${progress}%"><span style="width:${progress}%"></span></div><strong class="generation-percent">${progress}%</strong><div class="generation-note">${tdIcon("error-circle", 18)}可以离开此页面，任务会按真实开始时间继续推进</div><button class="primary-button generation-return-button" data-action="leave-generation">返回</button></div>`;
}

function downloadSelectionForWork(work) {
  if (state.downloadSelectionWorkId !== work.id) {
    state.downloadSelectionWorkId = work.id;
    state.downloadSelectionIds.clear();
  }
  return state.downloadSelectionIds;
}

function renderWorkItem(work, item) {
  const mediaError = state.demoState === "media-error" && item === work.items.find(entry => entry.status === "ready");
  if (item.status === "processing") return `<article class="result-item result-item--processing"><div class="result-item__processing"><span class="mini-spinner"></span><strong>正在重新生成</strong><small>原有成功内容不会被清除</small></div></article>`;
  if (item.status === "failed") return `<article class="result-item result-item--failed"><div class="result-item__failure"><span>!</span><strong>${escapeHtml(item.label)}未完成</strong><small>${escapeHtml(item.error)}</small><button data-action="retry-item" data-work-id="${work.id}" data-item-id="${item.id}">单独重试</button></div></article>`;
  const selected = downloadSelectionForWork(work).has(item.id);
  const source = mediaError ? "./assets/missing-result.jpg" : item.source;
  const selectButton = `<button type="button" class="result-item__select ${selected ? "result-item__select--active" : ""}" data-action="toggle-download-item" data-work-id="${work.id}" data-item-id="${item.id}" aria-label="${selected ? "取消选择" : "选择"}${escapeHtml(item.label)}" aria-pressed="${selected}">${selected ? tdIcon("check", 13) : ""}</button>`;
  if (item.type === "video") return `<article class="result-item result-item--video ${selected ? "result-item--selected" : ""}"><div class="media-shell result-item__media"><video src="${escapeHtml(source)}" poster="${escapeHtml(MEDIA.resultPhotos[0])}" controls playsinline preload="metadata" aria-label="${escapeHtml(item.label)}" data-fallback></video><span class="media-fallback">${tdIcon("video-camera", 28)}<small>视频加载失败</small></span><span class="result-item__badge">${tdIcon("video-camera", 13)}短视频</span>${selectButton}</div><div class="result-item__footer result-item__footer--action-only"><div><button data-action="download-item" data-work-id="${work.id}" data-item-id="${item.id}">${tdIcon("image", 17)}确认下载</button></div></div></article>`;
  return `<article class="result-item result-item--photo ${selected ? "result-item--selected" : ""}"><div class="media-shell result-item__media"><img src="${escapeHtml(source)}" alt="${escapeHtml(item.label)}" data-fallback /><span class="media-fallback">${tdIcon("image", 28)}<small>写真加载失败</small></span><span class="result-item__badge">${item.index + 1}</span>${selectButton}</div><div class="result-item__footer"><strong>${escapeHtml(item.label)}</strong><div><button data-action="download-item" data-work-id="${work.id}" data-item-id="${item.id}">${tdIcon("image", 17)}下载</button></div></div></article>`;
}

function renderWorkDetail(work) {
  if (!work) return `<div class="state-page"><div class="state-card"><h3>没有找到这份作品</h3><p>它可能已经被删除，或者当前浏览器没有保存记录。</p><button class="primary-button" data-action="switch-tab" data-tab="profile">查看我的作品</button></div></div>`;
  const photoItems = work.items.filter(item => item.type === "photo" && item.status === "ready" && item.source);
  const posterItems = work.items.filter(item => item.type === "poster" && item.status === "ready" && item.source);
  const videoItems = work.items.filter(item => item.type === "video" && item.status === "ready" && item.source);
  const hasExplicitPoster = work.items.some(item => item.type === "poster");
  const posterSource = posterItems[0]?.source || (!hasExplicitPoster ? photoItems[0]?.source : "");
  const gallerySection = resolveGallerySection({ posterAvailable: Boolean(posterSource), vlogAvailable: videoItems.length > 0 });
  let sectionContent = "";
  if (gallerySection === "photos") {
    sectionContent = `<section class="inspiration-detail__section" id="gallery-section-panel" role="tabpanel" aria-label="写真集"><div class="inspiration-gallery" aria-label="${escapeHtml(work.title)}写真图集">${photoItems.map((item, index) => `<figure class="inspiration-photo"><span class="media-shell inspiration-photo__media"><img src="${escapeHtml(item.source)}" alt="${escapeHtml(work.title)}第 ${index + 1} 张写真" loading="lazy" decoding="async" data-fallback /><span class="media-fallback">${tdIcon("image", 28)}<small>图片加载失败</small></span><i>${String(index + 1).padStart(2, "0")} / ${String(photoItems.length).padStart(2, "0")}</i></span></figure>`).join("") || `<div class="work-section-empty">这份作品暂无写真照片</div>`}</div></section>`;
  } else if (gallerySection === "poster") {
    sectionContent = renderPosterPreview({ title: work.title, source: posterSource });
  } else {
    sectionContent = `<section class="inspiration-detail__section inspiration-vlog" id="gallery-section-panel" role="tabpanel" aria-label="VLOG预览">${videoItems.length ? videoItems.map(item => `<span class="media-shell inspiration-vlog__media"><video src="${escapeHtml(item.source)}" poster="${escapeHtml(photoItems[0]?.source || MEDIA.resultPhotos[0])}" controls playsinline preload="metadata" aria-label="${escapeHtml(work.title)}VLOG预览" data-fallback></video><span class="media-fallback">${tdIcon("video-camera", 28)}<small>视频加载失败，请重试</small></span></span>`).join("") : `<div class="work-section-empty">这份作品暂无 VLOG</div>`}</section>`;
  }
  return `<div class="screen-layout inspiration-detail-layout"><div class="screen-scroll"><div class="page page--sub page--with-dock inspiration-detail-page result-detail-page">
    ${renderGallerySectionTabs(gallerySection, { posterAvailable: Boolean(posterSource), vlogAvailable: videoItems.length > 0 })}
    ${sectionContent}
  </div></div><section class="fixed-dock inspiration-detail__action"><button type="button" class="primary-button" data-action="download-work-all" data-work-id="${work.id}">确认下载</button></section></div>`;
}

function renderDraftCard(draft) {
  const template = optionById(templateOptions, draft.templateId);
  return `<article class="draft-card"><button data-action="continue-draft" data-draft-id="${draft.id}"><span class="draft-card__mark">${tdIcon("palette", 21)}</span><span class="draft-card__copy"><small class="profile-item-status">草稿</small><strong>${escapeHtml(template.name)}</strong></span>${tdIcon("chevron-right", 18)}</button><button class="draft-card__delete" data-action="delete-draft" data-draft-id="${draft.id}" aria-label="删除草稿">${tdIcon("close", 17)}</button></article>`;
}

function savedDrafts() {
  return state.snapshot.drafts.filter(draft => draft.saved !== false && draft.status !== "completed" && (draftHasContent(draft) || draft.saved));
}

function memberSummary() {
  const loggedIn = Boolean(state.snapshot.settings.profileLoggedIn);
  const superMember = isSuperMember();
  return {
    loggedIn,
    nickname: loggedIn ? "施旅拍用户" : "游客",
    superMember,
    tier: superMember ? "超级会员" : "普通会员",
    expiresAt: superMember ? "长期有效" : "充值后升级超级会员",
    points: loggedIn ? Number(state.snapshot.settings.creationPoints || 0) : 0,
    actionLabel: superMember ? "补充创作点" : "成为超级会员"
  };
}

function formatProfileNumber(value) {
  return Number(value || 0).toLocaleString("zh-CN");
}

function formatDateTime(value) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value)).replaceAll("/", ".");
}

function shortEntityId(id, prefix = "") {
  const parts = String(id || "").split("-").filter(Boolean);
  const value = (parts.length > 1 ? parts.slice(1).join("") : parts[0] || "").replace(/[^a-zA-Z0-9]/g, "");
  return `${prefix}${(value.slice(-10) || "").padStart(10, "0").toUpperCase()}`;
}

function tasksForOrder(order) {
  if (!order) return [];
  return state.snapshot.tasks
    .filter(task => task.type !== "item-retry" && (task.orderId === order.id || task.id === order.taskId))
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

function latestTaskForOrder(order) {
  return tasksForOrder(order)[0] || (order?.taskId ? findTask(order.taskId) : null);
}

function workForOrder(order) {
  if (!order) return null;
  return findWork(order.workId) || state.snapshot.works.find(work => work.taskId === order.taskId) || null;
}

function orderTaskStatusLabel(task) {
  if (!task) return "记录已归档";
  if (task.status === "archived") return "记录已归档";
  const stageLabel = task.stage === "preview" ? "预览" : "整套";
  if (["queued", "processing"].includes(task.status)) return `${stageLabel}生成中 ${Math.round(taskProgress(task) * 100)}%`;
  if (["succeeded", "partial"].includes(task.status)) return task.status === "partial" ? "部分完成" : `${stageLabel}生成完成`;
  if (task.status === "failed") return `${stageLabel}生成失败`;
  if (task.status === "cancelled") return "已取消";
  return "等待处理";
}

function orderStatusInfo(order) {
  const status = order?.status || "unknown";
  const task = latestTaskForOrder(order);
  const work = workForOrder(order);
  if (["pending-payment", "payment-failed"].includes(status)) {
    return { label: "待支付", tone: "pending", note: status === "payment-failed" ? "上次支付未完成，可继续支付" : "订单和草稿已保留", action: "continue-order-payment", actionLabel: "继续支付" };
  }
  if (["paid", "task-pending", "task-creating"].includes(status)) {
    return { label: "已支付", tone: "processing", note: "支付已确认，等待生成形象预览", action: "resume-order-generation", actionLabel: "恢复生成预览" };
  }
  if (status === "preview-task-created" || (["queued", "processing"].includes(task?.status) && task?.stage === "preview")) {
    return { label: "生成预览", tone: "processing", note: task ? orderTaskStatusLabel(task) : "形象预览正在生成", action: "view-order-task", actionLabel: "查看生成进度" };
  }
  if (status === "preview-failed") {
    return { label: "预览失败", tone: "warning", note: "系统失败不扣换版次数，可免费重试", action: "view-order-task", actionLabel: "查看生成进度" };
  }
  if (["preview-ready", "preview-adjusting"].includes(status)) {
    return { label: "待确认形象", tone: "pending", note: `${previewVersionsForOrder(order).length} 版预览可选，确认后生成全部`, action: "view-order-appearance", actionLabel: "确认人物与画面" };
  }
  if (["full-task-pending", "full-task-created", "task-created"].includes(status) || (["queued", "processing"].includes(task?.status) && task?.stage !== "preview")) {
    return { label: "生成中", tone: "processing", note: task ? orderTaskStatusLabel(task) : "生成任务正在处理", action: "view-order-task", actionLabel: "查看生成进度" };
  }
  if (status === "generation-failed" || task?.status === "failed") {
    return { label: "生成失败", tone: "warning", note: "同一订单可免费重试", action: "view-order-task", actionLabel: "查看生成进度" };
  }
  if (["fulfilled", "partially-fulfilled"].includes(status)) {
    return work
      ? { label: status === "partially-fulfilled" ? "部分完成" : "已完成", tone: "complete", note: "作品已生成，可预览和下载", action: "view-order-work", actionLabel: "查看作品" }
      : { label: "已完成", tone: "quiet", note: "作品已由用户删除，订单记录仍保留", action: null, actionLabel: "" };
  }
  if (["refund-pending", "benefit-returned"].includes(status)) {
    return { label: status === "refund-pending" ? "退款处理中" : "权益已返还", tone: "refund", note: order.resolution || "可查看退款与售后进度", action: "view-order-aftercare", actionLabel: "查看退款／售后" };
  }
  return { label: "处理中", tone: "quiet", note: order?.error || "订单状态正在更新", action: null, actionLabel: "" };
}

function paymentMethodLabel(order) {
  if (order?.paymentMethod === "points") return "创作点抵扣";
  if (order?.paymentMethod === "member-benefit") return "会员权益";
  return "微信支付";
}

function renderProfileMemberCard(summary, compact = false) {
  const memberAction = compact ? "member-action" : "open-member-center";
  return `<section class="profile-member-card ${compact ? "profile-member-card--compact" : "profile-member-card--hero"}">
    <div class="profile-member-card__user">
      <button type="button" class="profile-avatar" data-action="${summary.loggedIn ? memberAction : "profile-login"}" aria-label="${summary.loggedIn ? "查看会员信息" : "登录"}">施</button>
      <div><h3>${escapeHtml(summary.nickname)}</h3><span class="profile-member-badge">${tdIcon("star", 13)}${escapeHtml(summary.tier)}</span><small>${summary.loggedIn ? `有效期至 ${escapeHtml(summary.expiresAt)}` : escapeHtml(summary.expiresAt)}</small></div>
      <button type="button" class="profile-member-card__renew" data-action="${memberAction}">${escapeHtml(summary.actionLabel)}</button>
    </div>
    <button type="button" class="profile-member-card__points" data-action="open-points-rules"><span>当前创作点</span><strong>${formatProfileNumber(summary.points)}</strong><small>查看明细 ${tdIcon("chevron-right", 13)}</small></button>
  </section>`;
}

function renderProfileShortcut(action, icon, label, value, badge = 0) {
  return `<button type="button" class="profile-shortcut" data-action="${action}"><span>${tdIcon(icon, 22)}${badge ? `<i>${badge > 99 ? "99+" : badge}</i>` : ""}</span><strong>${label}</strong><small>${escapeHtml(value)}</small></button>`;
}

function renderProfileIdentity(summary) {
  const profileAction = summary.loggedIn ? "open-member-center" : "profile-login";
  return `<section class="profile-identity" aria-label="用户信息">
    <button type="button" class="profile-avatar" data-action="${profileAction}" aria-label="${summary.loggedIn ? "查看用户信息" : "登录"}">施</button>
    <div class="profile-identity__copy">
      <h3>${escapeHtml(summary.nickname)}</h3>
      <div class="profile-identity__meta"><span class="profile-member-badge">${escapeHtml(summary.tier)}</span><button type="button" class="profile-identity__points" data-action="open-points-rules"><span>当前创作点</span><strong>${formatProfileNumber(summary.points)}</strong>${tdIcon("chevron-right", 13)}</button></div>
    </div>
  </section>`;
}

function renderProfileBenefit(icon, title, note) {
  return `<article><span>${tdIcon(icon, 20)}</span><strong>${title}</strong><small>${note}</small></article>`;
}

function renderProfileSectionHead(title, action = "", actionLabel = "查看全部") {
  return `<div class="section-head profile-section-head"><h3>${title}</h3>${action ? `<button type="button" data-action="${action}">${actionLabel}${tdIcon("chevron-right", 15)}</button>` : ""}</div>`;
}

const creationPerks = [
  ["wallet", "会员专享价", "生成写真与短视频时，享会员专属价格"],
  ["ai-video-filled", "优先生成", "高峰时段优先进入生成队列，减少等待"]
];

const rechargePacks = [
  { id: "pack-1", points: 60, price: 6, bonus: 0, tag: "" },
  { id: "pack-2", points: 300, price: 28, bonus: 30, tag: "最受欢迎" },
  { id: "pack-3", points: 680, price: 60, bonus: 100, tag: "" },
  { id: "pack-4", points: 1280, price: 108, bonus: 260, tag: "最超值" }
];

function selectedRechargePack() {
  return rechargePacks.find(pack => pack.id === state.rechargePackId) || rechargePacks[0];
}

function showRechargeConfirmation() {
  const pack = selectedRechargePack();
  const creditedPoints = pack.points + pack.bonus;
  openSheet(`<div class="sheet-copy"><small>升级超级会员</small><h3 id="sheet-title">确认充值 ¥${pack.price}</h3><p>充值成功后升级为超级会员，本次到账 ${creditedPoints} 创作点；每次生成完整内容使用 ${GENERATION_POINTS_COST} 点。</p></div><div class="payment-breakdown"><div><span>套餐创作点</span><strong>${pack.points} 点</strong></div>${pack.bonus ? `<div><span>赠送创作点</span><strong>+${pack.bonus} 点</strong></div>` : ""}<div class="payment-breakdown__total"><span>本次到账</span><strong>${creditedPoints} 点</strong></div></div><div class="sheet-actions payment-sheet-actions"><button type="button" class="outline-button" data-action="close-sheet">取消</button><button type="button" class="primary-button" data-action="complete-recharge" data-pack="${pack.id}">确认支付 ¥${pack.price}</button></div>`, "payment-sheet");
}

async function completeRecharge(packId, trigger) {
  if (state.paymentBusy) return;
  const pack = rechargePacks.find(item => item.id === packId) || selectedRechargePack();
  state.paymentBusy = true;
  if (trigger) {
    trigger.disabled = true;
    trigger.textContent = "处理中…";
  }
  state.snapshot.settings.profileLoggedIn = true;
  state.snapshot.settings.memberTier = "超级会员";
  state.snapshot.settings.memberExpiresAt = "";
  state.snapshot.settings.creationPoints = creationPointBalance() + pack.points + pack.bonus;
  await persistSnapshot();
  state.paymentBusy = false;
  closeSheet();
  switchTab("profile");
  showToast(`充值成功，到账 ${pack.points + pack.bonus} 创作点`);
}

function renderProfile() {
  const works = state.snapshot.works;
  const summary = memberSummary();
  const points = summary.points;
  const freeTotal = 20;
  const freeUsed = Math.min(works.length, freeTotal);
  const stats = [
    { icon: "image", label: "作品", action: `data-action="open-profile-works"` },
    { icon: "palette", label: "草稿", action: `data-action="open-profile-drafts"` },
    { icon: "order", label: "订单", action: `data-action="open-profile-orders"` }
  ];
  const services = [
    ["chat-bubble-smile", "帮助与反馈", "open-help-feedback"],
    ["image", "照片与隐私", "open-privacy"],
    ["user", "授权管理", "open-authorization"],
    ["error-circle", "关于我们", "open-about"]
  ];
  return `<div class="page profile-page">
    <section class="profile-identity">
      <span class="profile-identity__avatar">施</span>
      <div class="profile-identity__info">
        <h3>${escapeHtml(summary.nickname)}</h3>
        <div class="profile-identity__meta">
          <button type="button" class="profile-tier ${summary.superMember ? "profile-tier--super" : ""}" data-action="open-benefits">${escapeHtml(summary.tier)}</button>
        </div>
      </div>
    </section>

    <section class="profile-benefits">
      <div class="profile-benefits__head"><h4>会员权益</h4><button type="button" class="profile-benefits__more profile-benefits__more--pill" data-action="open-benefits">${tdIcon(summary.superMember ? "wallet" : "star", 14)} ${summary.superMember ? "补充创作点" : "成为超级会员"}</button></div>
      <div class="profile-credits">
        <div class="profile-credits__balance">
          <small>当前创作点</small>
          <strong>${points}</strong>
        </div>
      </div>
      <div class="profile-quota">
        <div class="profile-quota__row"><span>本月免费次数</span><span><strong>${freeUsed}</strong> / ${freeTotal}</span></div>
        <div class="profile-quota__track"><span class="profile-quota__fill" style="width:${Math.round((freeUsed / freeTotal) * 100)}%"></span></div>
      </div>
    </section>

    <section class="profile-stats">
      ${stats.map(item => `<button type="button" class="profile-stat" ${item.action}><span class="profile-stat__icon">${tdIcon(item.icon, 30)}</span><small>${item.label}</small></button>`).join("")}
    </section>

    <section class="profile-services">
      <div class="profile-services__list">
        ${services.map(([icon, label, action]) => `<button type="button" class="profile-service" data-action="${action}"><span class="profile-service__icon">${tdIcon(icon, 21)}</span><span class="profile-service__label">${label}</span>${tdIcon("chevron-right", 18)}</button>`).join("")}
      </div>
    </section>
  </div>`;
}

function renderBenefits() {
  const selectedId = rechargePacks.some(pack => pack.id === state.rechargePackId) ? state.rechargePackId : rechargePacks[0].id;
  const selected = rechargePacks.find(pack => pack.id === selectedId);
  return `<div class="page subpage recharge-page">
    <section class="perks-card">
      <h4 class="perks-card__title">${tdIcon("sparkles", 15)} 充值后可畅享</h4>
      <div class="perks-card__grid">
        ${creationPerks.map(([icon, title, description]) => `<div class="perk-cell"><span class="perk-cell__icon">${tdIcon(icon, 20)}</span><span class="perk-cell__content"><strong>${title}</strong><small>${description}</small></span></div>`).join("")}
      </div>
    </section>

    <section class="benefits-section">
      <h3 class="benefits-section__title">选择充值套餐<em>1 元 = 10 创作点</em></h3>
      <div class="recharge-packs__grid">
        ${rechargePacks.map(pack => `<button type="button" class="recharge-pack ${pack.id === selectedId ? "recharge-pack--active" : ""}" data-action="select-recharge" data-pack="${pack.id}">
          ${pack.tag ? `<span class="recharge-pack__tag">${pack.tag}</span>` : ""}
          <strong class="recharge-pack__points">${pack.points}<em>创作点</em></strong>
          ${pack.bonus ? `<small class="recharge-pack__bonus">赠 ${pack.bonus} 点</small>` : `<small class="recharge-pack__bonus recharge-pack__bonus--empty">基础套餐</small>`}
          <span class="recharge-pack__price">¥${pack.price}</span>
        </button>`).join("")}
      </div>
    </section>

    <section class="recharge-note">
      <p>${tdIcon("info", 15)} 创作点用于生成写真与短视频，永久有效、不清零。</p>
    </section>

    <div class="recharge-cta">
      <button type="button" class="primary-button recharge-cta__button" data-action="start-recharge">确认充值 ¥${selected.price}</button>
    </div>
  </div>`;
}

function renderWorks() {
  const works = state.snapshot.works;
  return `<div class="page page--sub profile-subpage"><div class="profile-subpage-intro"><span>${formatProfileNumber(works.length)}</span><div><h3>全部作品</h3><p>作品是预览、下载、分享和再次编辑的主入口。</p></div></div>${works.length ? `<div class="profile-stack profile-collection-list">${works.map(work => renderWorkCard(work)).join("")}</div>` : `<div class="profile-full-empty"><span>${tdIcon("image", 28)}</span><h3>还没有作品</h3><p>完成第一份 AI 旅拍后，写真、海报和 VLOG 会保存在这里。</p><button class="primary-button" data-action="switch-tab" data-tab="create">开始旅拍</button></div>`}</div>`;
}

function renderDrafts() {
  const drafts = savedDrafts();
  if (!drafts.length) {
    return `<div class="screen-layout drafts-empty-layout"><div class="screen-scroll"><div class="page page--sub profile-subpage drafts-empty-page"><div class="profile-full-empty"><span>${tdIcon("palette", 28)}</span><h3>没有已保存的草稿</h3><p>退出创作时选择“保存草稿”，之后可从这里继续。</p></div></div></div><div class="fixed-dock drafts-empty-action"><button class="primary-button" data-action="switch-tab" data-tab="create">新建创作</button></div></div>`;
  }
  return `<div class="page page--sub profile-subpage"><div class="profile-subpage-intro"><span>${formatProfileNumber(drafts.length)}</span><div><h3>未完成创作</h3><p>继续编辑已保存的人像、模板和个性方案。</p></div></div><div class="profile-stack profile-collection-list">${drafts.map(renderDraftCard).join("")}</div></div>`;
}

function renderMemberCenter() {
  const summary = memberSummary();
  return `<div class="page page--sub member-page">${renderProfileMemberCard(summary, true)}
    <section class="member-points-panel"><div><small>创作点余额</small><strong>${formatProfileNumber(summary.points)}</strong></div><button type="button" data-action="open-points-rules">明细与规则${tdIcon("chevron-right", 15)}</button></section>
    <section class="content-section member-benefits">${renderProfileSectionHead("会员权益")}<div class="member-benefit-grid"><article><span>${tdIcon("star", 22)}</span><strong>会员生成权益</strong><small>符合条件的订单可直接使用会员次数</small></article><article><span>${tdIcon("wallet", 22)}</span><strong>会员专享价</strong><small>作品包按会员价结算，并支持积分抵扣</small></article><article><span>${tdIcon("ai-video-filled", 22)}</span><strong>优先生成</strong><small>繁忙时段享受更优先的生成队列</small></article><article><span>${tdIcon("image", 22)}</span><strong>无水印下载</strong><small>写真、海报与 VLOG 均可保存原文件</small></article></div></section>
    <button type="button" class="primary-button member-main-action" data-action="open-benefits">${summary.superMember ? "补充创作点" : "成为超级会员"}</button>
  </div>`;
}

function renderOrderCard(order) {
  const status = orderStatusInfo(order);
  const offer = order.offer || {};
  const summary = paymentOutputSummary(offer) || "AI 旅拍作品包";
  return `<article class="order-card order-card--${status.tone}"><button type="button" data-action="open-order" data-order-id="${order.id}"><span class="order-card__icon">${tdIcon("order", 21)}</span><span class="order-card__copy"><small>${formatDateTime(order.createdAt)} · ${escapeHtml(paymentMethodLabel(order))}</small><strong>${escapeHtml(summary)}</strong><em>${escapeHtml(status.label)}</em></span><span class="order-card__amount">¥${formatMoney(offer.payableAmount)}${tdIcon("chevron-right", 17)}</span></button></article>`;
}

function renderOrders() {
  const orders = state.snapshot.orders;
  return `<div class="page page--sub profile-subpage orders-page"><div class="profile-subpage-intro"><span>${formatProfileNumber(orders.length)}</span><div><h3>全部订单</h3><p>这里承接支付、权益核销、退款与售后记录。</p></div></div>${orders.length ? `<div class="profile-stack order-list">${orders.map(renderOrderCard).join("")}</div>` : `<div class="profile-full-empty"><span>${tdIcon("order", 28)}</span><h3>还没有订单</h3><p>确认生成后会先创建订单；暂未支付的订单也会保留在这里。</p><button class="primary-button" data-action="switch-tab" data-tab="create">开始旅拍</button></div>`}</div>`;
}

function renderOrderTaskRecord(task, index) {
  const taskName = task?.stage === "preview" ? "预览任务" : "整套生成任务";
  return `<div class="order-task-record"><span>${index + 1}</span><div><strong>${taskName} ${shortEntityId(task?.id, "#")}</strong><small>${task?.status === "archived" ? "生成记录已归档" : formatDateTime(task?.createdAt)}</small></div><em>${escapeHtml(orderTaskStatusLabel(task))}</em></div>`;
}

function renderOrderPrimaryAction(order, status) {
  if (!status.action) return "";
  return `<button type="button" class="primary-button order-detail-primary" data-action="${status.action}" data-order-id="${order.id}">${escapeHtml(status.actionLabel)}</button>`;
}

function renderOrderDetail(order) {
  if (!order) return `<div class="state-page"><div class="state-card"><h3>没有找到这笔订单</h3><p>订单可能尚未同步，可以返回订单列表重新查看。</p><button class="primary-button" data-action="open-profile-orders">返回订单列表</button></div></div>`;
  const status = orderStatusInfo(order);
  const offer = order.offer || {};
  const taskHistory = tasksForOrder(order);
  const archivedTask = !taskHistory.length && order.taskId ? { id: order.taskId, createdAt: null, status: "archived" } : null;
  const work = workForOrder(order);
  const taskRecords = taskHistory.length ? taskHistory : archivedTask ? [archivedTask] : [];
  const previewVersions = previewVersionsForOrder(order);
  const chosenPreview = selectedPreviewVersion(order);
  return `<div class="page page--sub order-detail-page">
    <section class="order-status-card order-status-card--${status.tone}"><span>${tdIcon(status.tone === "complete" ? "check-circle-filled" : status.tone === "refund" ? "rollback" : status.tone === "pending" ? "wallet" : "star", 27)}</span><div><small>订单状态</small><h3>${escapeHtml(status.label)}</h3><p>${escapeHtml(status.note)}</p></div></section>
    <section class="order-detail-section"><h3>订单信息</h3><div class="order-info-list"><div><span>订单编号</span><strong>${shortEntityId(order.id, "SLP")}</strong></div><div><span>创建时间</span><strong>${formatDateTime(order.createdAt)}</strong></div><div><span>本次内容</span><strong>${escapeHtml(paymentOutputSummary(offer) || "AI 旅拍作品包")}</strong></div><div><span>支付方式</span><strong>${escapeHtml(paymentMethodLabel(order))}</strong></div><div class="order-info-list__amount"><span>实付金额</span><strong>¥${formatMoney(offer.payableAmount)}</strong></div></div></section>
    <section class="order-detail-section"><h3>生成记录</h3>${taskRecords.length ? `<div class="order-task-history">${taskRecords.map(renderOrderTaskRecord).join("")}</div>` : `<div class="order-record-empty">支付完成后会在这里显示生成任务记录。</div>`}${previewVersions.length ? `<button type="button" class="order-preview-link" data-action="view-order-appearance" data-order-id="${order.id}"><span>${tdIcon("user", 20)}</span><div><strong>形象预览 · ${previewVersions.length} 版</strong><small>${order.lockedPreviewVersionId ? `已锁定第${previewVersions.find(item => item.id === order.lockedPreviewVersionId)?.index || chosenPreview?.index}版` : `当前选择第${chosenPreview?.index || 1}版`}</small></div>${tdIcon("chevron-right", 17)}</button>` : ""}${work ? `<button type="button" class="order-work-link" data-action="view-order-work" data-order-id="${order.id}"><span>${tdIcon("image", 20)}</span><div><strong>最终作品</strong><small>${escapeHtml(work.title)}</small></div>${tdIcon("chevron-right", 17)}</button>` : ["fulfilled", "partially-fulfilled"].includes(order.status) ? `<div class="order-work-deleted"><span>${tdIcon("image", 20)}</span><div><strong>最终作品已删除</strong><small>订单、支付与售后记录仍会保留</small></div></div>` : ""}</section>
    ${renderOrderPrimaryAction(order, status)}
  </div>`;
}

function sheetAction(action, title, note, icon, attributes = "") {
  return `<button type="button" class="sheet-list-item" data-action="${action}" ${attributes}><span>${tdIcon(icon, 22)}</span><div><strong>${title}</strong>${note ? `<small>${note}</small>` : ""}</div>${tdIcon("chevron-right", 18)}</button>`;
}

function showStartSheet() {
  const draft = currentDraft();
  if (!draft) {
    startNewDraft();
    return;
  }
  openSheet(`<div class="sheet-copy"><small>已有未完成内容</small><h3 id="sheet-title">继续这份创作吗？</h3><p>${draftNeedsSave(draft) ? "当前内容尚未保存；新建前会先询问是否保存草稿。" : "这份草稿已经保存，可以稍后从“我的”继续。"}</p></div><div class="sheet-list">${sheetAction("continue-active-draft", "继续当前创作", `${["near", "full"].filter(kind => portraitReady(draft, kind)).length}/2 张人物照片已添加`, "palette")}${sheetAction("confirm-new-draft", "新建另一份创作", "先处理当前未保存内容", "add")}</div><button class="sheet-cancel" data-action="close-sheet">取消</button>`);
}

function showPortraitSourceSheet(kind) {
  state.activeUploadSlot = kind;
  openSheet(`<div class="sheet-copy sheet-copy--compact"><h3 id="sheet-title">选择照片来源</h3></div><div class="sheet-list">${sheetAction("choose-file", "现场拍摄", "", "camera", 'data-source="camera"')}${sheetAction("choose-file", "从相册选择", "", "image", 'data-source="album"')}</div><button class="sheet-cancel" data-action="close-sheet">取消</button>`);
}

function showPrivacySheet() {
  openSheet(`<div class="sheet-copy"><small>照片与隐私</small><h3 id="sheet-title">你的照片如何被使用</h3><p>本 HTML 原型不会把照片上传到服务器。选择照片后仅在当前创作会话暂存；只有主动保存草稿或确认生成时，才会写入当前浏览器的本地存储。</p></div><div class="privacy-sheet-list"><p><span>1</span><strong>仅用于当前创作演示</strong><small>真实智能结果使用项目内固定样片，不会读取照片内容调用模型。</small></p><p><span>2</span><strong>由你主动决定是否保存</strong><small>退出时选择“不保存”，会清理本次未保存的人物照片与方案改动。</small></p><p><span>3</span><strong>正式版本另行授权</strong><small>接入微信小程序和真实智能服务前，仍需配置隐私声明、内容安全和服务端保留策略。</small></p></div><div class="sheet-actions sheet-actions--single"><button class="primary-button" data-action="close-sheet">我知道了</button></div>`);
}

function showPointsRulesSheet() {
  const summary = memberSummary();
  openSheet(`<div class="sheet-copy"><small>创作点</small><h3 id="sheet-title">当前余额 ${formatProfileNumber(summary.points)}</h3><p>超级会员每次生成完整内容使用 ${GENERATION_POINTS_COST} 创作点；余额不足时进入付费生成。</p></div><div class="privacy-sheet-list"><p><span>1</span><strong>使用规则</strong><small>余额达到 ${GENERATION_POINTS_COST} 点时，确认生成将优先使用创作点。</small></p><p><span>2</span><strong>失败返还</strong><small>持续生成失败时，已核销的创作点会按同一订单规则返还。</small></p></div><div class="sheet-actions sheet-actions--single"><button class="primary-button" data-action="close-sheet">我知道了</button></div>`);
}

function showMemberActionSheet() {
  const summary = memberSummary();
  openSheet(`<div class="sheet-copy"><small>会员服务</small><h3 id="sheet-title">${summary.loggedIn ? "续费云锦会员" : "开通旅拍会员"}</h3><p>本 HTML 原型只展示会员入口与权益结构，不会发起真实购买。正式版需接入微信支付、会员有效期与权益核销服务。</p></div><div class="privacy-sheet-list"><p><span>${tdIcon("star", 15)}</span><strong>会员生成权益</strong><small>支持会员免费次数、会员价与创作点抵扣。</small></p><p><span>${tdIcon("image", 15)}</span><strong>完整作品交付</strong><small>写真集、专属海报与 VLOG 均可无水印下载。</small></p></div><div class="sheet-actions sheet-actions--single"><button class="primary-button" data-action="close-sheet">暂不操作</button></div>`);
}

function showHelpFeedbackSheet() {
  openSheet(`<div class="sheet-copy"><small>帮助与反馈</small><h3 id="sheet-title">创作或订单遇到问题？</h3><p>正式版会提供问题分类、订单关联和图片凭证上传。本原型暂用常见问题说明交互。</p></div><div class="sheet-list">${sheetAction("close-sheet", "生成问题", "可从进行中任务查看进度或免费重试", "star")}${sheetAction("close-sheet", "支付与退款", "请从订单详情查看支付、退款和售后状态", "wallet")}${sheetAction("close-sheet", "作品下载", "作品详情支持写真、海报和 VLOG 下载", "image")}</div><button class="sheet-cancel" data-action="close-sheet">关闭</button>`);
}

function showAuthorizationSheet() {
  openSheet(`<div class="sheet-copy"><small>授权管理</small><h3 id="sheet-title">按使用场景申请权限</h3><p>只有在你主动选择照片或保存作品时才会请求对应权限；施·旅拍不申请定位权限。</p></div><div class="privacy-sheet-list"><p><span>${tdIcon("image", 15)}</span><strong>照片与相册</strong><small>当前未持续授权，选择或保存照片时再申请。</small></p><p><span>${tdIcon("user", 15)}</span><strong>微信账号信息</strong><small>${state.snapshot.settings.profileLoggedIn ? "原型已模拟登录状态，可在正式版管理授权。" : "当前未登录，也未读取微信账号信息。"}</small></p></div><div class="sheet-actions sheet-actions--single"><button class="primary-button" data-action="close-sheet">完成</button></div>`);
}

function showOrderAftercareSheet(order) {
  if (!order) return;
  const status = orderStatusInfo(order);
  openSheet(`<div class="sheet-copy"><small>退款与售后</small><h3 id="sheet-title">${escapeHtml(status.label)}</h3><p>${escapeHtml(order.resolution || status.note)}</p></div><div class="privacy-sheet-list"><p><span>1</span><strong>订单已保留</strong><small>${shortEntityId(order.id, "SLP")} 可用于后续核对支付与权益核销记录。</small></p><p><span>2</span><strong>处理方式</strong><small>${order.paymentMethod === "wechat" ? "微信支付款项将按原支付路径处理。" : order.paymentMethod === "points" ? "已使用的创作点将返还到当前账号。" : "已使用的会员生成权益将返还到当前账号。"}</small></p></div><div class="sheet-actions sheet-actions--single"><button class="primary-button" data-action="close-sheet">我知道了</button></div>`);
}

function showStateMenu() {
  const options = [
    ["normal", "正常状态", "恢复当前页面", "view-list"],
    ["loading", "加载中", "页面骨架与等待状态", "calendar-event"],
    ["empty", "空状态", "没有作品、任务或草稿", "image"],
    ["error", "页面失败", "保留数据并提供重试", "error-circle"],
    ["offline", "弱网 / 离线", "草稿可用，不能提交任务", "remove"],
    ["permission", "照片权限拒绝", "解释用途与恢复路径", "user"],
    ["upload-error", "照片处理失败", "另一张有效照片保持不变", "image"],
    ["payment-error", "支付失败", "下次支付失败，订单与草稿保留", "error-circle"],
    ["task-creation-error", "支付后恢复", "支付成功后自动恢复生成任务", "rollback"],
    ["points-covered", "积分足额抵扣", "确认兑换后直接开始生成", "discount"],
    ["member-covered", "会员免费次数", "使用会员权益后直接生成", "user-vip"],
    ["generation-error", "生成完全失败", "下次提交任务进入失败态", "error-circle"],
    ["partial-failure", "作品部分失败", "下次提交可单项重试", "error-circle"],
    ["save-error", "保存失败", "作品仍保留并可重试", "image"],
    ["media-error", "媒体加载失败", "结果项显示失败占位", "image"]
  ];
  openSheet(`<div class="sheet-copy"><small>评审工具</small><h3 id="sheet-title">演示页面与业务状态</h3><p>状态不会删除草稿或作品；“生成失败”和“部分失败”会作用于下一次提交。</p></div><div class="sheet-list sheet-list--states">${options.map(([value, title, note, icon]) => sheetAction("set-demo", title, note, icon, `data-state="${value}"`)).join("")}</div><button class="sheet-cancel" data-action="close-sheet">关闭</button>`);
}

function showWorkMenu(work) {
  openSheet(`<div class="sheet-copy"><small>作品管理</small><h3 id="sheet-title">${escapeHtml(work.title)}</h3><p>修改或重新生成不会覆盖当前成功结果。</p></div><div class="sheet-list">${sheetAction("edit-work", "修改方案", "复制当前配置并创建新草稿", "palette", `data-work-id="${work.id}"`)}${sheetAction("redo-work", "整包再生成", "使用相同方案生成一个新版本", "rollback", `data-work-id="${work.id}"`)}${sheetAction("request-delete-work", "删除作品包", "同时清理不再使用的人物照片", "close", `data-work-id="${work.id}"`)}</div><button class="sheet-cancel" data-action="close-sheet">取消</button>`);
}

function showSaveSheet(work) {
  const readyItems = work.items.filter(item => item.status === "ready");
  openSheet(`<div class="sheet-copy"><small>保存无水印文件</small><h3 id="sheet-title">选择要保存的内容</h3><p>浏览器通常会逐个下载文件；失败时作品仍保存在当前浏览器，可以再次尝试。</p></div><div class="sheet-list">${readyItems.map(item => {
    const fileNote = item.type === "video" ? "MP4 短视频文件" : item.type === "poster" ? "PNG 海报文件" : "PNG 写真文件";
    return sheetAction("download-item", item.label, fileNote, item.type === "video" ? "video-camera" : "image", `data-work-id="${work.id}" data-item-id="${item.id}"`);
  }).join("")}</div><button class="sheet-cancel" data-action="close-sheet">完成</button>`);
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ image, objectUrl, width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("图片文件损坏或无法读取"));
    };
    image.src = objectUrl;
  });
}

async function handlePortraitFile(file) {
  const draft = ensureDraft();
  const kind = state.activeUploadSlot;
  if (!kind || !draft.portraits[kind]) return;
  markDraftDirty(draft);
  const portrait = draft.portraits[kind];
  portrait.error = "";
  if (state.demoState === "upload-error") {
    portrait.status = "error";
    portrait.error = "照片处理失败，请检查网络或重新选择原图";
    draft.updatedAt = Date.now();
    await persistSnapshot();
    render();
    return;
  }
  if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
    portrait.status = "error";
    portrait.error = "仅支持 JPG、PNG 或 WebP 图片";
    render();
    return;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    portrait.status = "error";
    portrait.error = "图片超过 20MB，请压缩后重试";
    render();
    return;
  }
  let loaded = null;
  try {
    loaded = await loadImageFile(file);
    if (loaded.width < MIN_IMAGE_WIDTH || loaded.height < MIN_IMAGE_HEIGHT) {
      URL.revokeObjectURL(loaded.objectUrl);
      portrait.status = "error";
      portrait.error = `图片至少需要 ${MIN_IMAGE_WIDTH} × ${MIN_IMAGE_HEIGHT}px`;
      render();
      return;
    }
    const oldBlobId = portrait.blobId;
    const blobId = uid(`portrait-${kind}`);
    const blobMeta = { kind, name: file.name, createdAt: Date.now(), mimeType: file.type, width: loaded.width, height: loaded.height };
    storage.memoryBlobs.set(blobId, { id: blobId, blob: file, ...blobMeta });
    state.mediaUrls.set(blobId, loaded.objectUrl);
    portrait.status = "ready";
    portrait.blobId = blobId;
    portrait.previewUrl = "";
    portrait.name = file.name;
    portrait.width = loaded.width;
    portrait.height = loaded.height;
    portrait.error = "";
    draft.updatedAt = Date.now();
    await persistSnapshot();
    await cleanupBlob(oldBlobId);
    render();
    showToast(`${kind === "near" ? "近照" : "全身照"}已上传`);
  } catch (error) {
    if (loaded?.objectUrl && ![...state.mediaUrls.values()].includes(loaded.objectUrl)) URL.revokeObjectURL(loaded.objectUrl);
    portrait.status = "error";
    portrait.error = error.message || "图片无法读取，请重新选择";
    draft.updatedAt = Date.now();
    await persistSnapshot();
    render();
  }
}

async function startNewDraft(presetCase = null) {
  const draft = createDraft(presetCase);
  state.snapshot.drafts.unshift(draft);
  state.snapshot.activeDraftId = draft.id;
  markDraftDirty(draft);
  closeSheet();
  await persistSnapshot();
  if (state.route !== "create") switchTab("create");
  else render(true);
}

async function cloneWorkToDraft(work, openStep = "confirm") {
  const draft = clone(work.configSnapshot);
  draft.id = uid("draft");
  draft.createdAt = Date.now();
  draft.updatedAt = Date.now();
  draft.status = "draft";
  draft.saved = false;
  draft.parentWorkId = work.id;
  draft.workId = null;
  draft.customized = true;
  state.snapshot.drafts.unshift(draft);
  state.snapshot.activeDraftId = draft.id;
  markDraftDirty(draft);
  state.editorStep = openStep;
  state.editorHistory = [];
  closeSheet();
  await persistSnapshot();
  navigate("editor");
}

async function deleteDraft(draftId) {
  const draft = state.snapshot.drafts.find(item => item.id === draftId);
  if (!draft) return;
  const blobIds = Object.values(draft.portraits || {}).map(item => item.blobId).filter(Boolean);
  state.snapshot.drafts = state.snapshot.drafts.filter(item => item.id !== draftId);
  if (state.snapshot.activeDraftId === draftId) state.snapshot.activeDraftId = null;
  state.draftBaselines.delete(draftId);
  state.dirtyDraftIds.delete(draftId);
  await persistSnapshot();
  for (const id of blobIds) await cleanupBlob(id);
  render();
  showToast("草稿已删除");
}

async function deleteWork(workId) {
  const work = findWork(workId);
  if (!work) return;
  const blobIds = [...(work.portraitIds || [])];
  state.snapshot.works = state.snapshot.works.filter(item => item.id !== workId);
  state.snapshot.tasks = state.snapshot.tasks.filter(task => task.workId !== workId || Boolean(task.orderId));
  state.snapshot.drafts.forEach(draft => {
    if (draft.workId === workId) draft.workId = null;
  });
  if (state.activeWorkId === workId) state.activeWorkId = null;
  closeSheet();
  await persistSnapshot();
  for (const id of blobIds) await cleanupBlob(id);
  switchTab("profile");
  showToast("作品包已删除");
}

function showConfirmDeleteWork(workId) {
  const work = findWork(workId);
  if (!work) return;
  openSheet(`<div class="sheet-copy"><small>删除作品包</small><h3 id="sheet-title">确定删除“${escapeHtml(work.title)}”吗？</h3><p>操作无法撤销。若人物原图不再被其他草稿或作品使用，也会一并清理。</p></div><div class="sheet-actions"><button class="outline-button" data-action="close-sheet">取消</button><button class="danger-button" data-action="confirm-delete-work" data-work-id="${work.id}">确认删除</button></div>`);
}

function showConfirmCancelTask(taskId) {
  syncTasks();
  const task = findTask(taskId);
  if (!task || !["queued", "processing"].includes(task.status)) {
    showToast(task?.workId ? "任务已完成，可以查看作品" : "这个任务已结束");
    return;
  }
  openSheet(`<div class="sheet-copy"><small>取消生成</small><h3 id="sheet-title">停止这次生成任务？</h3><p>当前任务会停止，但人物照片和创作方案会继续保留在草稿中。</p></div><div class="sheet-actions"><button class="outline-button" data-action="close-sheet">继续生成</button><button class="danger-button" data-action="confirm-cancel-task" data-task-id="${task.id}">停止任务</button></div>`);
}

async function cancelTask(taskId) {
  const task = findTask(taskId);
  syncTasks();
  if (!task || !["queued", "processing"].includes(task.status)) {
    closeSheet();
    showToast(task?.workId ? "任务已完成，没有被取消" : "这个任务已结束");
    return;
  }
  task.status = "cancelled";
  task.updatedAt = Date.now();
  const draft = state.snapshot.drafts.find(item => item.id === task.draftId);
  if (draft) draft.status = "draft";
  closeSheet();
  await persistSnapshot();
  render();
  showToast("任务已停止，草稿仍已保留");
}

function triggerDownload(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noreferrer";
  document.body.append(link);
  link.click();
  link.remove();
}

async function downloadWorkItem(work, item) {
  if (state.demoState === "save-error") {
    showToast("保存失败，作品仍已保留，请稍后重试");
    return;
  }
  if (!item?.source || item.status !== "ready") {
    showToast("这一项还没有可保存的文件");
    return;
  }
  triggerDownload(item.source, `施旅拍-${work.id}-${item.label}.${item.type === "video" ? "mp4" : "png"}`);
  if (!work.savedItemIds.includes(item.id)) work.savedItemIds.push(item.id);
  await persistSnapshot();
  showToast(`${item.label}已开始保存（无水印）`);
}

async function downloadSelectedWorkItems(work, itemType = "") {
  if (state.demoState === "save-error") {
    showToast("批量下载失败，作品仍已保留，请稍后重试");
    return;
  }
  const selection = downloadSelectionForWork(work);
  const items = work.items.filter(item => item.status === "ready" && item.source && selection.has(item.id) && (!itemType || item.type === itemType));
  if (!items.length) {
    showToast("请先选择要下载的写真或视频");
    return;
  }
  items.forEach(item => {
    triggerDownload(item.source, `施旅拍-${work.id}-${item.label}.${item.type === "video" ? "mp4" : "png"}`);
    if (!work.savedItemIds.includes(item.id)) work.savedItemIds.push(item.id);
  });
  await persistSnapshot();
  showToast(`已开始下载 ${items.length} 个无水印文件`);
}

async function shareContent(title, text) {
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url: window.location.href.split("?")[0] });
      showToast("分享面板已完成");
      return;
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${title}\n${text}`);
      showToast("当前浏览器不支持系统分享，文案已复制");
      return;
    }
    openSheet(`<div class="sheet-copy"><small>分享作品</small><h3 id="sheet-title">复制下面的分享文案</h3><p>${escapeHtml(text)}</p></div><button class="primary-button" data-action="close-sheet">我知道了</button>`);
  } catch (error) {
    if (error?.name === "AbortError") showToast("已取消分享");
    else openSheet(`<div class="sheet-copy"><small>分享失败</small><h3 id="sheet-title">暂时没有打开分享面板</h3><p>作品仍已保留。你可以先保存文件，再从相册分享。</p></div><button class="primary-button" data-action="close-sheet">返回作品</button>`);
  }
}

async function editTaskConfiguration(task) {
  const draft = clone(task.configSnapshot);
  draft.id = uid("draft");
  draft.createdAt = Date.now();
  draft.updatedAt = Date.now();
  draft.status = "draft";
  draft.saved = false;
  draft.workId = null;
  draft.customized = true;
  state.snapshot.drafts.unshift(draft);
  state.snapshot.activeDraftId = draft.id;
  markDraftDirty(draft);
  state.editorStep = "confirm";
  state.editorHistory = [];
  await persistSnapshot();
  navigate("editor");
}

function showConfirmDeleteDraft(draftId) {
  openSheet(`<div class="sheet-copy"><small>删除草稿</small><h3 id="sheet-title">确定删除这份未完成创作吗？</h3><p>不再被其他作品使用的人物照片也会一并清理。</p></div><div class="sheet-actions"><button class="outline-button" data-action="close-sheet">取消</button><button class="danger-button" data-action="confirm-delete-draft" data-draft-id="${draftId}">确认删除</button></div>`);
}

function showConfirmClearData() {
  openSheet(`<div class="sheet-copy"><small>本地数据管理</small><h3 id="sheet-title">清空全部本地数据？</h3><p>这会删除人物原图、草稿、进行中任务和全部作品包，操作无法撤销。</p></div><div class="sheet-actions"><button class="outline-button" data-action="close-sheet">取消</button><button class="danger-button" data-action="confirm-clear-data">全部清空</button></div>`);
}

async function resetAllData() {
  clearTimeout(state.paymentRecoveryTimer);
  state.mediaUrls.forEach(url => URL.revokeObjectURL(url));
  state.mediaUrls.clear();
  await storage.clear();
  state.snapshot = defaultSnapshot();
  state.activeTaskId = null;
  state.activeWorkId = null;
  state.activeOrderId = null;
  state.downloadSelectionWorkId = null;
  state.downloadSelectionIds.clear();
  state.draftBaselines.clear();
  state.dirtyDraftIds.clear();
  state.pendingDraftExit = null;
  state.paymentBusy = false;
  state.paymentRecoveryTimer = null;
  state.history = [];
  state.editorHistory = [];
  state.demoState = "normal";
  closeSheet();
  switchTab("home");
  showToast("本地照片、草稿、任务和作品已全部清空");
}

document.addEventListener("click", async event => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (target.disabled) return;

  switch (action) {
    case "switch-tab":
      if (target.dataset.tab === "create" && state.snapshot.settings.creationMode !== "template") {
        state.snapshot.settings.creationMode = "template";
        await persistSnapshot();
      }
      switchTab(target.dataset.tab);
      break;
    case "select-creation-gender": {
      const draft = ensureDraft();
      const nextGender = target.dataset.gender === "male" ? "male" : "female";
      if (draft.gender === nextGender) break;
      markDraftDirty(draft);
      draft.gender = nextGender;
      if (!hairOptionsForDraft(draft).some(item => item.id === draft.hairId)) draft.hairId = hairOptionsForDraft(draft)[0].id;
      if (!creationTemplateCases(draft).some(item => item.caseId === draft.sourceCaseId)) {
        applyOneClickTemplate(draft, creationTemplateCases(draft)[0].caseId);
      }
      draft.updatedAt = Date.now();
      await persistSnapshot();
      render({ preserveScroll: true });
      showToast(`已切换为${nextGender === "male" ? "男款" : "女款"}，已上传人像保持不变`);
      break;
    }
    case "switch-create-mode": {
      const nextMode = target.dataset.mode === "custom" ? "custom" : "template";
      if (state.snapshot.settings.creationMode === nextMode) break;
      state.snapshot.settings.creationMode = nextMode;
      await persistSnapshot();
      render(true);
      break;
    }
    case "switch-create-category": {
      const nextCategory = target.dataset.category;
      if (!customOptionGroups.some(item => item.key === nextCategory) || state.createOptionCategory === nextCategory) break;
      state.createOptionCategory = nextCategory;
      render({ preserveScroll: true });
      break;
    }
    case "select-template-case": {
      const draft = ensureDraft();
      const templateCase = creationTemplateCases(draft).find(item => item.caseId === target.dataset.caseId);
      if (!templateCase || draft.sourceCaseId === templateCase.caseId) break;
      markDraftDirty(draft);
      applyOneClickTemplate(draft, templateCase.caseId);
      await persistSnapshot();
      render({ preserveScroll: true });
      showToast(`已选择${templateCase.name}`);
      break;
    }
    case "set-home-case":
      state.homeCaseIndex = Math.max(0, Math.min(homeInspirationCases.length - 1, Number(target.dataset.caseIndex) || 0));
      applyHomeCaseState();
      syncHomeCaseCarousel({ restart: true });
      break;
    case "retry-home-slide-image": {
      const media = target.closest(".home-hero__media--photo");
      const image = media?.querySelector(".home-hero__photo");
      if (!media || !image) break;
      media.classList.remove("home-hero__media--loaded", "home-hero__media--error");
      image.src = `${image.dataset.src}${image.dataset.src.includes("?") ? "&" : "?"}retry=${Date.now()}`;
      bindHomeHeroImages();
      break;
    }
    case "back":
      goBack();
      break;
    case "open-state-menu":
      showStateMenu();
      break;
    case "show-pending-update":
      showToast("待更新");
      break;
    case "close-sheet":
      closeSheet();
      break;
    case "open-appearance-image":
      openAppearanceImage(target.dataset.source, target.dataset.label);
      break;
    case "cancel-payment":
      await cancelPayment(findOrder(target.dataset.orderId));
      break;
    case "show-payment-confirmation":
      showPaymentConfirmation(findOrder(target.dataset.orderId));
      break;
    case "open-wechat-payment": {
      const order = findOrder(target.dataset.orderId);
      if (!order) break;
      showWechatPayment(order);
      await persistSnapshot();
      break;
    }
    case "retry-payment": {
      const order = findOrder(target.dataset.orderId);
      if (!order) break;
      order.status = "pending-payment";
      order.offer.scenario = "normal";
      order.error = "";
      order.updatedAt = Date.now();
      await persistSnapshot();
      showWechatPayment(order);
      break;
    }
    case "confirm-payment":
      await completePayment(findOrder(target.dataset.orderId), target);
      break;
    case "resume-paid-order":
      await resumePaidOrder(target.dataset.orderId);
      break;
    case "cancel-draft-exit":
      closeSheet();
      break;
    case "save-draft-exit":
      await resolveDraftExit(true);
      break;
    case "discard-draft-exit":
      await resolveDraftExit(false);
      break;
    case "profile-login":
      openSheet(`<div class="sheet-copy"><h3 id="sheet-title">登录施·旅拍</h3><p>这是交互原型，本次只模拟登录状态，不会读取微信账号信息。</p></div><div class="sheet-actions"><button class="outline-button" data-action="close-sheet">取消</button><button class="primary-button" data-action="confirm-profile-login">确认登录</button></div>`);
      break;
    case "confirm-profile-login":
      state.snapshot.settings.profileLoggedIn = true;
      state.snapshot.settings.memberTier = "普通会员";
      state.snapshot.settings.memberExpiresAt = "";
      state.snapshot.settings.creationPoints = 0;
      await persistSnapshot();
      closeSheet();
      render(true);
      showToast("登录成功");
      break;
    case "open-profile-works":
      navigate("works");
      break;
    case "open-member-center":
      navigate("member");
      break;
    case "open-profile-drafts":
      navigate("drafts");
      break;
    case "open-profile-orders":
      navigate("orders");
      break;
    case "open-order": {
      const order = findOrder(target.dataset.orderId);
      if (!order) break;
      state.activeOrderId = order.id;
      navigate("order", { orderId: order.id });
      break;
    }
    case "continue-order-payment": {
      const order = findOrder(target.dataset.orderId);
      if (!order) break;
      order.status = "pending-payment";
      order.offer.scenario = "normal";
      order.error = "";
      order.updatedAt = Date.now();
      await persistSnapshot();
      showPaymentConfirmation(order);
      break;
    }
    case "resume-order-generation":
      await resumePaidOrder(target.dataset.orderId);
      break;
    case "view-order-task": {
      const order = findOrder(target.dataset.orderId);
      const task = latestTaskForOrder(order);
      if (!task) {
        showToast("生成任务正在恢复，请稍后再试");
        break;
      }
      state.activeTaskId = task.id;
      navigate("generating", { taskId: task.id });
      break;
    }
    case "view-order-appearance": {
      const order = findOrder(target.dataset.orderId);
      if (!order || !previewVersionsForOrder(order).length) {
        showToast("形象预览尚未准备好");
        break;
      }
      state.activeOrderId = order.id;
      navigate("appearance", { orderId: order.id });
      break;
    }
    case "view-order-work": {
      const order = findOrder(target.dataset.orderId);
      const work = workForOrder(order);
      if (!work) {
        showToast("作品已删除，订单记录仍会保留");
        break;
      }
      state.activeWorkId = work.id;
      state.gallerySection = "photos";
      navigate("work", { workId: work.id });
      break;
    }
    case "view-order-aftercare":
      showOrderAftercareSheet(findOrder(target.dataset.orderId));
      break;
    case "open-points-rules":
      showPointsRulesSheet();
      break;
    case "member-action":
      showMemberActionSheet();
      break;
    case "open-help-feedback":
      showHelpFeedbackSheet();
      break;
    case "open-authorization":
      showAuthorizationSheet();
      break;
    case "start-creation":
      showStartSheet();
      break;
    case "new-creation":
      await startNewDraft();
      break;
    case "confirm-new-draft":
      if (draftNeedsSave()) requestDraftExit(() => startNewDraft());
      else await startNewDraft();
      break;
    case "continue-active-draft": {
      closeSheet();
      const draft = currentDraft();
      if (!draft) await startNewDraft();
      else if (draftReady(draft)) {
        if (state.route !== "create") switchTab("create");
        state.editorStep = "confirm";
        navigate("editor");
      } else {
        if (state.route !== "create") switchTab("create");
        else render(true);
      }
      break;
    }
    case "use-case": {
      const place = popularPlaces.find(item => item.id === target.dataset.placeId);
      if (place?.creationPreset) {
        const sourceCase = officialCases.find(item => item.id === place.caseId) || officialCases[0];
        state.snapshot.settings.creationMode = "custom";
        state.createOptionCategory = "grooming";
        await startNewDraft({
          ...sourceCase,
          ...place.creationPreset,
          customized: true
        });
        showToast(`已带入${place.name}同款方案`);
        break;
      }
      const preset = officialCases.find(item => item.id === target.dataset.caseId);
      await startNewDraft(preset || officialCases[0]);
      break;
    }
    case "open-inspiration": {
      const inspiration = officialCases.find(item => item.id === target.dataset.caseId);
      state.activeCaseId = inspiration?.id || officialCases[0].id;
      state.gallerySection = "photos";
      if (isCreationRoute(state.route)) performNavigate("inspiration");
      else navigate("inspiration");
      break;
    }
    case "open-place": {
      const place = popularPlaces.find(item => item.id === target.dataset.placeId && item.photos?.length);
      if (!place) break;
      state.activePlaceId = place.id;
      state.gallerySection = "photos";
      navigate("place");
      break;
    }
    case "set-gallery-section": {
      if (!["photos", "poster", "vlog"].includes(target.dataset.section)) break;
      state.gallerySection = target.dataset.section;
      render();
      const galleryScroll = screen.querySelector(".screen-scroll");
      if (galleryScroll) galleryScroll.scrollTop = 0;
      break;
    }
    case "use-template": {
      const template = optionById(templateOptions, target.dataset.templateId);
      await startNewDraft({ id: `template-${template.id}`, templateId: template.id, styleId: styleOptions[0].id, sceneId: sceneOptions[0].id });
      break;
    }
    case "choose-portrait-source":
      showPortraitSourceSheet(target.dataset.slot);
      break;
    case "choose-file":
      if (target.dataset.source === "camera") portraitFile.setAttribute("capture", "user");
      else portraitFile.removeAttribute("capture");
      closeSheet();
      portraitFile.click();
      break;
    case "remove-portrait": {
      const draft = currentDraft();
      const kind = target.dataset.slot;
      const portrait = draft?.portraits?.[kind];
      if (!portrait) break;
      markDraftDirty(draft);
      const oldId = portrait.blobId;
      draft.portraits[kind] = { kind, status: "empty", blobId: null, previewUrl: "", name: "", width: 0, height: 0, error: "" };
      draft.status = "draft";
      draft.updatedAt = Date.now();
      await persistSnapshot();
      await cleanupBlob(oldId);
      render();
      showToast(`${kind === "near" ? "近照" : "全身照"}已删除`);
      break;
    }
    case "open-editor": {
      const draft = ensureDraft();
      if (!draftReady(draft)) {
        if (state.route !== "create") switchTab("create");
        else render(true);
        showToast("先完成两张人物照片");
        break;
      }
      state.editorStep = target.dataset.step || "confirm";
      state.editorHistory = [];
      if (state.editorStep !== "confirm") {
        markDraftDirty(draft);
        draft.customized = true;
      }
      navigate("editor");
      break;
    }
    case "change-editor-step": {
      const draft = ensureDraft();
      if (state.editorStep !== target.dataset.step) state.editorHistory.push(state.editorStep);
      state.editorStep = target.dataset.step;
      if (state.editorStep !== "confirm") {
        markDraftDirty(draft);
        draft.customized = true;
      }
      draft.updatedAt = Date.now();
      await persistSnapshot();
      render(true);
      break;
    }
    case "select-choice": {
      const draft = ensureDraft();
      const type = target.dataset.choiceType;
      const property = `${type}Id`;
      if (type === "theme") {
        const theme = creationTemplateCases(draft).find(item => item.caseId === target.dataset.choiceId);
        if (!theme || draft.sourceCaseId === theme.caseId) break;
        markDraftDirty(draft);
        applyOneClickTemplate(draft, theme.caseId);
        await persistSnapshot();
        render({ preserveScroll: true });
        showToast(`已选择${theme.name}`);
        break;
      }
      if (["hair", "makeup", "clothing", "style", "scene", "template"].includes(type)) {
        markDraftDirty(draft);
        draft[property] = target.dataset.choiceId;
        if (type === "clothing") draft.styleId = target.dataset.choiceId;
        if (!["hair", "makeup"].includes(type)) draft.sourceCaseId = null;
        draft.customized = true;
        draft.updatedAt = Date.now();
        await persistSnapshot();
        render({ preserveScroll: true });
        const choiceLabels = { hair: "发型", makeup: "妆容", clothing: "服装", style: "造型", scene: "场景", template: "运镜" };
        showToast(`已选择${choiceLabels[type]}`);
      }
      break;
    }
    case "toggle-output": {
      const draft = ensureDraft();
      const output = target.dataset.output;
      if (draft.outputs[output] && Object.values(draft.outputs).filter(Boolean).length === 1) {
        showToast("写真和短视频至少保留一种");
        break;
      }
      markDraftDirty(draft);
      draft.outputs[output] = !draft.outputs[output];
      draft.customized = true;
      draft.updatedAt = Date.now();
      await persistSnapshot();
      render();
      break;
    }
    case "editor-next": {
      const currentIndex = editorSteps.findIndex(([key]) => key === state.editorStep);
      if (state.editorStep === "confirm") {
        const adjustmentOrder = currentPreviewAdjustmentOrder();
        if (adjustmentOrder) await requestPreviewRevision(adjustmentOrder, { adjusted: true });
        else await beginCheckout(ensureDraft());
      }
      else {
        state.editorHistory.push(state.editorStep);
        state.editorStep = editorSteps[currentIndex + 1]?.[0] || "confirm";
        render(true);
      }
      break;
    }
    case "start-generation": {
      const draft = ensureDraft();
      if (!creationTemplateCases(draft).some(item => item.caseId === draft.sourceCaseId)) {
        applyOneClickTemplate(draft, creationTemplateCases(draft)[0].caseId);
      }
      await beginCheckout(draft);
      break;
    }
    case "open-task": {
      const task = findTask(target.dataset.taskId);
      if (!task) break;
      state.activeTaskId = task.id;
      if (task.stage === "preview" && task.status === "succeeded" && task.previewVersionId) {
        state.activeOrderId = task.orderId;
        navigate("appearance", { orderId: task.orderId });
      } else if (["succeeded", "partial"].includes(task.status) && task.workId) {
        state.activeWorkId = task.workId;
        state.gallerySection = "photos";
        navigate("work");
      } else navigate("generating");
      break;
    }
    case "leave-generation":
      switchTab("create");
      showToast("任务会继续生成，可从首页或我的返回查看");
      break;
    case "cancel-task":
      showConfirmCancelTask(target.dataset.taskId);
      break;
    case "confirm-cancel-task":
      await cancelTask(target.dataset.taskId);
      break;
    case "retry-task": {
      const task = findTask(target.dataset.taskId);
      if (task) await retryWholeTask(task);
      break;
    }
    case "retry-preview-task": {
      const task = findTask(target.dataset.taskId);
      if (task) await retryPreviewTask(task);
      break;
    }
    case "view-preview-result": {
      const task = findTask(target.dataset.taskId);
      if (!task?.orderId) break;
      state.activeOrderId = task.orderId;
      navigate("appearance", { replace: true, orderId: task.orderId });
      break;
    }
    case "select-preview-version": {
      const order = findOrder(target.dataset.orderId);
      const version = previewVersionsForOrder(order).find(item => item.id === target.dataset.previewVersionId);
      if (!order || !version || order.lockedPreviewVersionId || order.selectedPreviewVersionId === version.id) break;
      order.selectedPreviewVersionId = version.id;
      order.updatedAt = Date.now();
      await persistSnapshot();
      render({ preserveScroll: true });
      break;
    }
    case "regenerate-preview":
      await requestPreviewRevision(findOrder(target.dataset.orderId));
      break;
    case "adjust-preview-plan":
      await adjustPreviewPlan(findOrder(target.dataset.orderId));
      break;
    case "accept-preview-version":
      await acceptPreviewVersion(findOrder(target.dataset.orderId));
      break;
    case "retry-preview-media":
      state.demoState = "normal";
      render({ preserveScroll: true });
      showToast("正在重新加载图片，不消耗换版次数");
      break;
    case "edit-task": {
      const task = findTask(target.dataset.taskId);
      if (task) await editTaskConfiguration(task);
      break;
    }
    case "view-task-result": {
      const task = findTask(target.dataset.taskId);
      if (task?.workId) {
        state.activeWorkId = task.workId;
        state.gallerySection = "photos";
        navigate("work", { replace: true });
      }
      break;
    }
    case "open-work":
      state.activeWorkId = target.dataset.workId;
      state.gallerySection = "photos";
      navigate("work");
      break;
    case "open-work-menu": {
      const work = findWork(target.dataset.workId);
      if (work) showWorkMenu(work);
      break;
    }
    case "toggle-download-item": {
      const work = findWork(target.dataset.workId);
      const item = work?.items.find(entry => entry.id === target.dataset.itemId && entry.status === "ready");
      if (!work || !item) break;
      const selection = downloadSelectionForWork(work);
      if (selection.has(item.id)) selection.delete(item.id);
      else selection.add(item.id);
      render({ preserveScroll: true });
      break;
    }
    case "toggle-download-all": {
      const work = findWork(target.dataset.workId);
      if (!work) break;
      const itemType = target.dataset.itemType;
      const readyItems = work.items.filter(item => item.status === "ready" && item.source && (!itemType || item.type === itemType));
      const selection = downloadSelectionForWork(work);
      const allSelected = readyItems.length > 0 && readyItems.every(item => selection.has(item.id));
      readyItems.forEach(item => allSelected ? selection.delete(item.id) : selection.add(item.id));
      render({ preserveScroll: true });
      break;
    }
    case "download-selected": {
      const work = findWork(target.dataset.workId);
      if (work) await downloadSelectedWorkItems(work, target.dataset.itemType || "");
      break;
    }
    case "download-work-all": {
      const work = findWork(target.dataset.workId);
      if (!work) break;
      const selection = downloadSelectionForWork(work);
      selection.clear();
      work.items.filter(item => item.status === "ready" && item.source).forEach(item => selection.add(item.id));
      await downloadSelectedWorkItems(work);
      break;
    }
    case "edit-work": {
      const work = findWork(target.dataset.workId);
      if (work) await cloneWorkToDraft(work, "confirm");
      break;
    }
    case "redo-work": {
      const work = findWork(target.dataset.workId);
      if (work) {
        await cloneWorkToDraft(work, "confirm");
        await createGenerationTask(currentDraft());
      }
      break;
    }
    case "retry-item": {
      const work = findWork(target.dataset.workId);
      const item = work?.items.find(entry => entry.id === target.dataset.itemId);
      if (work && item) await retryWorkItem(work, item);
      break;
    }
    case "save-work": {
      const work = findWork(target.dataset.workId);
      if (work) showSaveSheet(work);
      break;
    }
    case "download-item": {
      const work = findWork(target.dataset.workId);
      const item = work?.items.find(entry => entry.id === target.dataset.itemId);
      if (work && item) await downloadWorkItem(work, item);
      break;
    }
    case "share-work": {
      const work = findWork(target.dataset.workId);
      if (work) await shareContent("施·旅拍｜我的国风作品包", `我用“${work.title}”生成了一组国风写真和短视频。`);
      break;
    }
    case "share-item": {
      const work = findWork(target.dataset.workId);
      const item = work?.items.find(entry => entry.id === target.dataset.itemId);
      const contentType = item?.type === "video" ? "卡点短视频" : item?.type === "poster" ? "专属海报" : "国风写真";
      if (work && item) await shareContent(`施·旅拍｜${item.label}`, `这是我用“${work.title}”生成的${contentType}。`);
      break;
    }
    case "request-delete-work":
      showConfirmDeleteWork(target.dataset.workId);
      break;
    case "confirm-delete-work":
      await deleteWork(target.dataset.workId);
      break;
    case "continue-draft": {
      const draft = state.snapshot.drafts.find(item => item.id === target.dataset.draftId);
      if (!draft) break;
      state.snapshot.activeDraftId = draft.id;
      state.snapshot.settings.creationMode = draft.customized ? "custom" : "template";
      await persistSnapshot();
      switchTab("create");
      break;
    }
    case "delete-draft":
      showConfirmDeleteDraft(target.dataset.draftId);
      break;
    case "confirm-delete-draft":
      closeSheet();
      await deleteDraft(target.dataset.draftId);
      break;
    case "open-privacy":
      showPrivacySheet();
      break;
    case "open-benefits": {
      const focus = Number.parseInt(target.dataset.benefit, 10);
      state.benefitFocus = Number.isInteger(focus) ? focus : null;
      navigate("benefits");
      break;
    }
    case "select-recharge":
      if (rechargePacks.some(pack => pack.id === target.dataset.pack)) {
        state.rechargePackId = target.dataset.pack;
        render();
      }
      break;
    case "start-recharge":
      showRechargeConfirmation();
      break;
    case "complete-recharge":
      await completeRecharge(target.dataset.pack, target);
      break;
    case "clear-local-data":
      showConfirmClearData();
      break;
    case "confirm-clear-data":
    case "reset-prototype":
      await resetAllData();
      break;
    case "open-about":
      openSheet(`<div class="sheet-copy"><small>关于施·旅拍</small><h3 id="sheet-title">轻量 AI 国风影像工作室</h3><p>上传近照与全身照，采用系统推荐或逐项自定义，生成写真与卡点短视频。本页面是独立交互原型，不调用真实 AI 服务。</p></div><div class="sheet-actions sheet-actions--single"><button class="primary-button" data-action="close-sheet">返回</button></div>`);
      break;
    case "set-demo":
      state.demoState = target.dataset.state;
      closeSheet();
      render(true);
      break;
    case "clear-demo":
      state.demoState = "normal";
      render(true);
      break;
    case "retry-demo":
      state.demoState = "loading";
      render();
      setTimeout(() => { state.demoState = "normal"; render(true); showToast("页面已恢复"); }, 700);
      break;
    case "open-settings":
      openSheet(`<div class="sheet-copy"><small>照片权限</small><h3 id="sheet-title">在浏览器设置中允许照片访问</h3><p>关闭此提示后，再次点击“现场拍摄”或“从相册选择”。浏览器会根据当前权限状态重新处理。</p></div><button class="primary-button" data-action="clear-demo">返回上传页</button>`);
      break;
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !sheetLayer.hidden) {
    closeSheet();
    return;
  }
  const target = event.target.closest?.("[data-action='open-appearance-image'], [data-action='select-preview-version']");
  if (target && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    target.click();
  }
});

screen.addEventListener("pointerdown", event => {
  const caseCarousel = event.target.closest?.(".case-carousel");
  if (caseCarousel && !event.target.closest?.("button")) {
    state.homeCaseSwipeStart = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    state.homeCaseCarouselPaused = true;
    stopHomeCaseCarousel();
  }
});

screen.addEventListener("pointerup", event => {
  if (state.homeCaseSwipeStart && state.homeCaseSwipeStart.pointerId === event.pointerId) {
    const deltaX = event.clientX - state.homeCaseSwipeStart.x;
    const deltaY = event.clientY - state.homeCaseSwipeStart.y;
    state.homeCaseSwipeStart = null;
    state.homeCaseCarouselPaused = false;
    if (Math.abs(deltaX) >= 36 && Math.abs(deltaX) > Math.abs(deltaY)) {
      state.homeCaseIndex = (state.homeCaseIndex + (deltaX < 0 ? 1 : -1) + homeInspirationCases.length) % homeInspirationCases.length;
      applyHomeCaseState();
    }
    syncHomeCaseCarousel({ restart: true });
    return;
  }
});

screen.addEventListener("pointercancel", () => {
  state.homeCaseSwipeStart = null;
  state.homeCaseCarouselPaused = false;
  syncHomeCaseCarousel({ restart: true });
});

screen.addEventListener("focusin", event => {
  if (event.target.closest?.(".case-carousel")) {
    state.homeCaseCarouselPaused = true;
    stopHomeCaseCarousel();
  }
});

screen.addEventListener("focusout", event => {
  if (event.target.closest?.(".case-carousel")) {
    requestAnimationFrame(() => {
      if (!screen.querySelector(".case-carousel:focus-within")) {
        state.homeCaseCarouselPaused = false;
        syncHomeCaseCarousel({ restart: true });
      }
    });
  }
});

portraitFile.addEventListener("change", async () => {
  const file = portraitFile.files?.[0];
  portraitFile.value = "";
  if (file) await handlePortraitFile(file);
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopHomeCaseCarousel();
    persistSnapshot();
  } else {
    syncHomeCaseCarousel();
  }
});

window.addEventListener("beforeunload", event => {
  if (!draftNeedsSave()) return;
  event.preventDefault();
  event.returnValue = "";
});

window.addEventListener("pagehide", () => persistSnapshot());

function seedPreviewState() {
  const memberPreview = params.get("member");
  if (memberPreview === "super") {
    state.snapshot.settings.profileLoggedIn = true;
    state.snapshot.settings.memberTier = "超级会员";
    state.snapshot.settings.creationPoints = Math.max(GENERATION_POINTS_COST, Number(params.get("points") || 330));
  } else if (memberPreview === "ordinary") {
    state.snapshot.settings.profileLoggedIn = true;
    state.snapshot.settings.memberTier = "普通会员";
    state.snapshot.settings.creationPoints = 0;
  }
  const sampleRequested = params.get("sample") === "1";
  const taskRequested = params.get("task") === "1";
  const appearanceRequested = state.route === "appearance" || params.get("previewReady") === "1";
  const needsDraft = sampleRequested || taskRequested || appearanceRequested || ["editor", "generating", "work"].includes(state.route) || params.get("ready") === "1";
  if (needsDraft) {
    const useSample = sampleRequested || taskRequested || appearanceRequested || ["editor", "generating", "work"].includes(state.route) || params.get("ready") === "1";
    const draft = useSample ? createSampleDraft() : createDraft();
    state.snapshot.drafts = [draft];
    state.snapshot.activeDraftId = draft.id;
  }
  const draft = currentDraft();
  const needsTask = taskRequested || appearanceRequested || ["generating", "work"].includes(state.route) || params.get("ready") === "1";
  if (needsTask && draft) {
    const fullReady = params.get("ready") === "1" || state.route === "work";
    const previewStage = appearanceRequested || (!fullReady && (taskRequested || state.route === "generating"));
    const ready = appearanceRequested || fullReady;
    const now = Date.now();
    const offer = paymentOfferForDraft(draft, "normal");
    const seededSources = previewSources(0);
    const seededVersion = {
      id: "appearance-preview-1",
      index: 1,
      createdAt: now - 5600,
      taskId: previewStage ? "task-preview" : "task-preview-seed",
      configSnapshot: clone(draft),
      ...seededSources
    };
    const order = {
      id: "order-preview",
      type: "generation",
      draftId: draft.id,
      taskId: "task-preview",
      idempotencyKey: "preview-checkout",
      createdAt: now - 6200,
      updatedAt: now,
      paidAt: now - 5800,
      status: previewStage ? "preview-task-created" : "full-task-created",
      paymentMethod: offer.paymentMethod,
      offer,
      configSnapshot: clone(draft),
      generationAttempts: 1,
      generationFailures: 0,
      previewVersions: previewStage ? [] : [seededVersion],
      previewRerollsUsed: 0,
      previewAttempts: 1,
      selectedPreviewVersionId: previewStage ? null : seededVersion.id,
      lockedPreviewVersionId: previewStage ? null : seededVersion.id,
      previewAdjustmentPending: false,
      error: ""
    };
    const task = {
      id: "task-preview",
      type: "generation",
      stage: previewStage ? "preview" : "full",
      draftId: draft.id,
      idempotencyKey: "preview",
      createdAt: now - 5000,
      updatedAt: now,
      startedAt: ready ? now - GENERATION_DURATION_MS : now - 3800,
      finishAt: ready ? now - 1 : now + 5200,
      status: "processing",
      failureMode: state.demoState === "generation-error" ? previewStage ? "preview" : "full" : state.demoState === "partial-failure" && !previewStage ? "partial" : "none",
      error: "",
      workId: null,
      orderId: order.id,
      lockedPreviewVersionId: previewStage ? null : seededVersion.id,
      configSnapshot: clone(draft),
      items: previewStage ? previewTaskItems() : taskItemsFromDraft(draft)
    };
    state.snapshot.orders = [order];
    state.activeOrderId = order.id;
    state.snapshot.tasks = [task];
    state.activeTaskId = task.id;
    if (task.failureMode !== "none") state.demoState = "normal";
    if (ready) finalizeGenerationTask(task);
    if (task.previewVersionId) order.selectedPreviewVersionId = task.previewVersionId;
    if (task.workId) {
      state.activeWorkId = task.workId;
      if (state.route === "profile") state.tab = "profile";
    }
  }
  if (state.route === "profile") {
    state.tab = "profile";
    state.snapshot.settings.profileLoggedIn = true;
  }
}

async function initialize() {
  if (!isPreviewMode) {
    await storage.open();
    const saved = await storage.getSnapshot();
    state.snapshot = normalizeSnapshot(saved);
    await hydrateBlobUrls();
  } else {
    state.snapshot = defaultSnapshot();
    seedPreviewState();
    if (previewCreationMode) state.snapshot.settings.creationMode = previewCreationMode;
  }
  initializeDraftTracking();
  state.initialized = true;
  syncTasks();
  render();
  if (!storage.available && !isPreviewMode) showToast("浏览器不支持持久存储，本次数据仅在当前页面有效");
  const previewSheet = allowsPreviewOverride ? params.get("sheet") : null;
  if (previewSheet === "states") showStateMenu();
  if (previewSheet === "portrait") showPortraitSourceSheet("near");
  if (previewSheet === "save" && activeWork()) showSaveSheet(activeWork());
  if (previewSheet === "privacy") showPrivacySheet();
  state.ticker = setInterval(async () => {
    const changed = syncTasks();
    const task = activeTask();
    if (changed) await persistSnapshot();
    if (state.route === "generating" && task?.stage === "preview" && task.status === "succeeded" && task.previewVersionId && state.lastAutoOpenedPreviewTaskId !== task.id) {
      state.lastAutoOpenedPreviewTaskId = task.id;
      state.activeOrderId = task.orderId;
      closeSheet();
      navigate("appearance", { replace: true, orderId: task.orderId });
      return;
    }
    if (state.route === "generating" && task && ["succeeded", "partial"].includes(task.status) && task.workId && state.lastAutoOpenedWorkId !== task.workId) {
      state.lastAutoOpenedWorkId = task.workId;
      state.activeWorkId = task.workId;
      state.gallerySection = "photos";
      closeSheet();
      navigate("work", { replace: true });
      return;
    }
    const tabNeedsLiveProgress = ["home", "profile", "orders", "order"].includes(state.route) && runningTasks().length > 0;
    const detailNeedsRefresh = changed && ["home", "profile", "appearance", "work", "orders", "order"].includes(state.route);
    if (state.route === "generating") render();
    else if (tabNeedsLiveProgress || detailNeedsRefresh) render({ preserveScroll: true });
  }, 600);
}

initialize().catch(error => {
  console.error(error);
  state.initialized = true;
  state.demoState = "error";
  render();
});
