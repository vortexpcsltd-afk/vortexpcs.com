import{r as h,j as s,_ as U}from"./three-DYdjUtCm.js";import{e as ne,l as p,D as se,z as re,E as oe,F as ae,J as ie,B as f,U as le,C as $,I as ce,K as de,N as ue,O as me,Z as pe,Q as ge}from"./index-C09NoPC0.js";import{A as W,a as z}from"./avatar-BcE2GWxe.js";import{S as he}from"./send-BGSUsxhY.js";import{D as fe}from"./dollar-sign-IO6ipdcE.js";import"./contentful-6-L6ww-u.js";import"./firebase-D5dyMTPx.js";/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I=ne("Bot",[["path",{d:"M12 8V4H8",key:"hb8ula"}],["rect",{width:"16",height:"12",x:"4",y:"8",rx:"2",key:"enze0r"}],["path",{d:"M2 14h2",key:"vft8re"}],["path",{d:"M20 14h2",key:"4cs60a"}],["path",{d:"M15 13v2",key:"1xurst"}],["path",{d:"M9 13v2",key:"rq6x2g"}]]);function Ce({isOpen:K,onClose:L}){const[g,u]=h.useState([{id:1,type:"bot",content:`Hello! I'm VortexAI, your professional IT consultant. I specialise in helping you build your dream PC with expert component recommendations and troubleshooting PC issues. Whether you're planning a gaming rig, workstation, or need help diagnosing problems, I'm here to guide you with professional advice.

I can help with:
• Custom PC builds tailored to your budget and needs
• Component compatibility and upgrade planning
• Performance troubleshooting and diagnostics
• Technical questions about hardware and software

What can I help you with today?`,timestamp:new Date,suggestions:["Build a gaming PC under £1500","My PC won't boot - help diagnose","Compare AMD vs Intel for my needs","Plan an upgrade path"]}]),[T,M]=h.useState(""),[G,y]=h.useState(!1),[B,R]=h.useState(!1),[S,F]=h.useState(!1),[b,V]=h.useState("hybrid"),j=h.useRef(null),O=()=>{var t;(t=j.current)==null||t.scrollIntoView({behavior:"smooth"})};h.useEffect(()=>{O()},[g]),h.useEffect(()=>{try{const t=localStorage.getItem("vortexAI_chat");if(t){const e=JSON.parse(t);if(Array.isArray(e)&&e.every(r=>r&&typeof r.content=="string")){const r=e.map((n,o)=>({id:n.id??o+1,type:n.type==="user"||n.type==="bot"||n.type==="system"?n.type:"bot",content:n.content,timestamp:n.timestamp?new Date(n.timestamp):new Date,suggestions:n.suggestions,recommendedBuild:n.recommendedBuild,mode:n.mode}));r.length&&u(n=>[n[0],...r.slice(1).filter(o=>o.id!==n[0].id)])}}}catch(t){p.warn("Failed to load VortexAI conversation",{error:t})}},[]),h.useEffect(()=>{try{const t=g.slice(0,50).map(e=>({id:e.id,type:e.type,content:e.content,timestamp:e.timestamp.toISOString(),suggestions:e.suggestions,recommendedBuild:e.recommendedBuild,mode:e.mode}));localStorage.setItem("vortexAI_chat",JSON.stringify(t))}catch(t){p.warn("Failed saving VortexAI conversation",{error:t})}},[g]);const P={gaming:{content:`For a gaming PC, the key components are your GPU (most important for FPS) and CPU (important for high refresh rates and simulation games). Let me help you build a balanced system.

Could you tell me:
• What's your budget range?
• What resolution and refresh rate will you game at? (1080p/1440p/4K)
• Any specific games or genres you focus on?

This will help me recommend the perfect components for your needs.`,suggestions:["Budget gaming £600-900","1440p high refresh gaming","4K gaming build","Competitive esports setup"]},budget:{content:`I'll help you build an excellent PC within your budget. To provide the best recommendations, I need to understand your priorities.

Please share:
• Your budget range (e.g., £800-1200)
• Primary use case (gaming, work, content creation, general use)
• Any specific requirements (resolution target, software you'll run)

With this info, I can suggest a balanced build that maximises value for your specific needs.`,suggestions:["£500-800 budget build","£800-1500 mid-range","£1500-2500 high-end","£2500+ enthusiast"]},compatibility:{content:`I'll help verify your component compatibility. Key checks include:

**Critical Compatibility:**
• CPU socket matches motherboard (AM5, LGA1700, LGA1851)
• RAM type supported (DDR4 vs DDR5)
• PSU has enough wattage + correct connectors
• GPU fits in case (length, width, height)
• CPU cooler clearance (RAM, case height)

Please list your components or describe what you're planning, and I'll check for any issues.`,suggestions:["Check my full build list","Will X CPU work with Y motherboard?","PSU wattage calculation","GPU clearance check"]},workstation:{content:`For professional workstation builds, the priorities differ from gaming systems. I'll focus on:

**Key Considerations:**
• CPU: Core count and single-thread performance based on your software
• RAM: Capacity more important than speed (32GB minimum, often 64GB+)
• Storage: Fast NVMe for project files, large capacity for archives
• GPU: Depends on workload (NVIDIA for CUDA, AMD for raw compute)

What type of work will you be doing? (e.g., video editing, 3D rendering, CAD, software development, data analysis)`,suggestions:["Video editing workstation","3D rendering build","Software development setup","CAD/Engineering workstation"]},troubleshooting:{content:`I'll help diagnose your PC issue systematically. To start troubleshooting, please describe:

**Essential Information:**
• What's happening? (won't boot, crashing, slow performance, etc.)
• When did it start? (after new hardware, Windows update, suddenly, etc.)
• Any error messages or beep codes?
• Recent changes to the system?

With these details, I can guide you through targeted diagnostics to identify and fix the problem.`,suggestions:["PC won't turn on / no POST","Random crashes or freezing","Poor gaming performance","Boot errors or BSOD"]},upgrade:{content:`I'll help plan your upgrade path for maximum value and compatibility.

**Smart Upgrade Strategy:**
• Identify your current bottleneck (CPU, GPU, RAM, storage)
• Check compatibility with existing components
• Consider cost-effectiveness vs full rebuild
• Plan for future upgrades (platform longevity)

What's your current system, and what's not meeting your needs? (e.g., 'low FPS in games', 'slow rendering', 'running out of storage')`,suggestions:["What should I upgrade first?","GPU upgrade recommendations","CPU + motherboard upgrade","RAM and storage upgrades"]}},_=t=>{const e=t.toLowerCase();return/won't boot|no post|not starting|black screen|won't turn on|boot loop|beep|crash|freeze|bsod|blue screen|error|problem|issue|fix|broken|diagnose|troubleshoot|slow|lag|stutter|overheat|thermal|driver/.test(e)?"troubleshooting":/compare|vs|versus|difference between|better|which/.test(e)?"compare":/compatib|socket|fit|clearance|psu enough|will.*work|can.*use/.test(e)?"compatibility":/upgrade|improve|replace|bottleneck|future|path/.test(e)?"upgrade":/budget|£|cost|price|cheap|affordable|value/.test(e)?"budget":/render|editing|workstation|productiv|work|professional|cad|video|stream/.test(e)?"workstation":/game|gaming|fps|1440p|4k|1080p|play|esports|competitive/.test(e)?"gaming":/power|psu|watt|supply/.test(e)?"power":"general"},H=t=>{const e=t.match(/£\s?(\d{3,5})/);if(e)return parseInt(e[1],10)},q=t=>t<800?[{category:"CPU",name:"Ryzen 5 7500F",rationale:"Strong value gaming",approxPrice:"£140"},{category:"GPU",name:"RX 7600",rationale:"1080p high settings",approxPrice:"£240"},{category:"RAM",name:"16GB DDR5-5600",rationale:"Gaming sweet spot",approxPrice:"£60"},{category:"Storage",name:"1TB NVMe Gen4",rationale:"Fast OS + games",approxPrice:"£60"},{category:"Motherboard",name:"B650",rationale:"Upgrade path AM5",approxPrice:"£120"},{category:"PSU",name:"650W 80+ Gold",rationale:"Headroom & efficiency",approxPrice:"£75"},{category:"Case",name:"Airflow Mid-Tower",rationale:"Thermals & future space",approxPrice:"£70"}]:t<1300?[{category:"CPU",name:"Ryzen 5 7600",rationale:"Great 1440p pairing",approxPrice:"£200"},{category:"GPU",name:"RTX 4070",rationale:"1440p ultra + DLSS3",approxPrice:"£500"},{category:"RAM",name:"32GB DDR5-6000",rationale:"Multitask & future-proof",approxPrice:"£120"},{category:"Storage",name:"2TB NVMe Gen4",rationale:"Room for large library",approxPrice:"£130"},{category:"Motherboard",name:"B650 Performance",rationale:"PCIe Gen4 lanes",approxPrice:"£160"},{category:"PSU",name:"750W 80+ Gold Modular",rationale:"Efficiency & upgrade headroom",approxPrice:"£95"},{category:"Cooling",name:"240mm AIO",rationale:"Low noise sustained boost",approxPrice:"£85"}]:t<2e3?[{category:"CPU",name:"Intel i7-13700K",rationale:"High FPS + creation",approxPrice:"£380"},{category:"GPU",name:"RTX 4080",rationale:"4K / 1440p high refresh",approxPrice:"£1050"},{category:"RAM",name:"32GB DDR5-6400",rationale:"High bandwidth tasks",approxPrice:"£180"},{category:"Storage",name:"2TB NVMe Gen4 + 2TB HDD",rationale:"Fast + bulk media",approxPrice:"£190"},{category:"Motherboard",name:"Z790",rationale:"Robust VRM & IO",approxPrice:"£260"},{category:"PSU",name:"850W 80+ Gold",rationale:"Ample for RTX 4080",approxPrice:"£130"},{category:"Cooling",name:"360mm AIO",rationale:"Thermal overhead",approxPrice:"£150"}]:[{category:"CPU",name:"Ryzen 9 7950X3D",rationale:"Elite gaming & creation",approxPrice:"£600"},{category:"GPU",name:"RTX 4090",rationale:"Top-tier 4K + RT",approxPrice:"£1500"},{category:"RAM",name:"64GB DDR5-6000",rationale:"Heavy multitask / VMs",approxPrice:"£300"},{category:"Storage",name:"4TB NVMe Gen4",rationale:"Large fast library",approxPrice:"£300"},{category:"Motherboard",name:"X670E",rationale:"PCIe Gen5 readiness",approxPrice:"£350"},{category:"PSU",name:"1000W 80+ Platinum",rationale:"Efficiency at high draw",approxPrice:"£230"},{category:"Cooling",name:"Custom loop / 420mm AIO",rationale:"Thermal + acoustic headroom",approxPrice:"£250"}],Z=t=>{const e=t.match(/(\b\w+\s?[\d]{3,4}\w?\b)[^a-zA-Z0-9]+vs[^a-zA-Z0-9]+(\b\w+\s?[\d]{3,4}\w?\b)/i);if(!e)return;const r=e[1].toLowerCase(),n=e[2].toLowerCase(),o={"9800x3d_7800x3d":`**9800X3D vs 7800X3D** (Gaming CPU Showdown - Nov 2025)

🔴 **Ryzen 7 9800X3D:**
• 8C/16T + 3D V-Cache
• £450-480
• 5-10% faster than 7800X3D
• Better thermals
• **Current gaming champion**
• Unlocked for overclocking

🔴 **Ryzen 7 7800X3D:**
• 8C/16T + 3D V-Cache
• £360-390 (price dropped)
• Still excellent gaming
• More mature, better availability
• **Best value gaming CPU**

**Winner:** 9800X3D if budget allows, 7800X3D for best value`,"9600x_14600k":`**9600X vs 14600K** (Mid-Range Gaming)

� **Ryzen 5 9600X:**
• 6C/12T Zen 5
• £250-280
• Better efficiency
• AM5 longevity
• Great 1440p

🔵 **i5-14600K:**
• 14C/20T
• £260-290
• Better productivity
• Mature platform
• More cores

**Winner:** 14600K for all-around, 9600X for pure gaming efficiency`,"7600x_13600k":`**7600X vs 13600K** (Previous Gen Comparison)

🔴 **Ryzen 5 7600X:**
• 6C/12T, up to 5.3GHz
• £200-220
• Lower power (105W TDP)
• AM5 upgrade path
• Great 1440p gaming

🔵 **Intel i5-13600K:**
• 14C/20T (6P+8E), up to 5.1GHz  
• £250-270
• Better productivity (more cores)
• Slight gaming lead (3-5%)
• More heat/power

**Winner:** 13600K for all-rounder, 7600X for value + longevity`,"7800x3d_14700k":`**7800X3D vs 14700K** (High-End Battle - Nov 2025)

🔴 **Ryzen 7 7800X3D:**
• 8C/16T + 3D V-Cache
• £360-390 (price dropped)
• **Best gaming value**
• Low power, runs cool
• Locked (no OC)

🔵 **Intel i7-14700K:**
• 20C/28T (8P+12E)
• £340-370
• Better productivity (more cores)
• Good deals now
• Overclockable

**Winner:** 7800X3D for pure gaming, 14700K for mixed use at similar price`,"4070super_7800xt":`**RTX 4070 Super vs RX 7800 XT**

💚 **RTX 4070 Super:**
• £550-600
• 12GB VRAM
• DLSS 3 Frame Gen
• Superior RT
• 200W TDP

� **RX 7800 XT:**
• £480-530
• 16GB VRAM
• Better raster
• More VRAM
• £70 cheaper

**Winner:** 7800 XT for value/VRAM, 4070 Super for RT/DLSS`,"4070_4070ti":`**RTX 4070 vs 4070 Ti** (Superseded by Super variants)

Note: These have been replaced by 4070 Super and 4070 Ti Super.

💚 **RTX 4070:**
• £500-550 (older stock)
• 12GB VRAM
• Good 1440p

💚 **RTX 4070 Ti:**
• £700-750 (older stock)
• 15-20% faster

**Recommendation:** Get the newer Super variants instead for better value`,"4080super_4090":`**RTX 4080 Super vs RTX 4090** (4K Powerhouses)

💚 **RTX 4080 Super:**
• £1000-1100
• 16GB VRAM
• 320W TDP
• Excellent 4K
• Better value

� **RTX 4090:**
• £1500-1700
• 24GB VRAM
• 450W TDP
• 25-30% faster
• Futureproof

**Winner:** 4080 Super for sensible 4K, 4090 for no compromises`},a=`${r.replace(/\s+/g,"")}_${n.replace(/\s+/g,"")}`,i=`${n.replace(/\s+/g,"")}_${r.replace(/\s+/g,"")}`;return o[a]?o[a]:o[i]?o[i]:`Comparison: ${r} vs ${n}

**Key Factors to Consider:**
• Architecture & IPC (instructions per clock)
• Core / thread count
• Gaming turbo frequencies
• Productivity scaling (multi-core)
• Thermals & power efficiency
• Price & availability

**General Guidance:**
- Raw gaming FPS? → Favour higher single-core boost
- Streaming/rendering? → Prioritise core/thread count
- Future-proofing? → Check platform upgrade path

Tell me your specific use case for a detailed recommendation!`},N=t=>{const r=t.split(/\r?\n/).map(v=>v.trim()).filter(Boolean).filter(v=>/:\s+/.test(v));if(r.length<3)return;const n={};for(const v of r){const[C,A]=v.split(/:\s+/,2);C&&A&&(n[C.toLowerCase()]=A)}const o=n.cpu,a=n.gpu,i=n.psu||n.power||n["power supply"],l=n.motherboard||n.mobo,c=n.cooler,d=n.case,m=n.ram||n.memory,w=n.storage||n.drive;return{cpu:o,gpu:a,psu:i,mobo:l,cooler:c,case:d,ram:m,storage:w}},J=t=>{const e=[],r=[],n=t.gpu||"",o=t.psu||"",a=parseInt(o.replace(/[^\d]/g,""))||0,i=[{test:/4090|4080|7900\s?xtx/i,need:850},{test:/4070|7800\s?xt/i,need:750},{test:/4060|7600/i,need:650}];for(const d of i)if(d.test.test(n)){a&&a<d.need&&(e.push(`PSU may be undersized for ${n}. Recommended ${d.need}W+.`),r.push("Consider higher wattage PSU (Gold-rated)"));break}const l=t.cpu||"",c=t.mobo||"";return/ryzen|amd/i.test(l)&&!/am5|am4/i.test(c)&&(e.push("Motherboard socket may not match AMD CPU (expect AM5/AM4)."),r.push("Verify CPU socket support in motherboard specs")),/intel|i[3579]-\d{4,5}/i.test(l)&&!/lga\s?1700|z790|b760|h770/i.test(c)&&(e.push("Motherboard may not list LGA1700/compatible chipset for Intel CPU."),r.push("Confirm chipset generation matches CPU (e.g., Z790/B760)")),t.cooler&&t.case&&(e.push("Ensure cooler height/radiator size fits the case limits."),r.push("Check case CPU cooler max height / radiator clearance")),e.length||e.push("No critical issues detected from the list provided."),{notes:e,actions:r}},Q=t=>{const e=[],r=[],n=t.cpu||"(unspecified)",o=t.gpu||"(unspecified)",a=t.psu||"(unspecified)",i=t.ram||"(unspecified)",l=t.storage||"(unspecified)",c=[];/gtx|rx\s?(4|5)\d{2}|1050|1060|1070|1080/i.test(o)&&(c.push("Upgrade GPU to RTX 4070 (1440p) or RTX 4060 (1080p) for major FPS gains"),r.push(`GPU: ${o} → RTX 4070/4060`)),/nvme|gen4|gen\s?4/i.test(l)||(c.push("Add 1–2TB NVMe Gen4 SSD as primary drive for OS/games"),r.push(`Storage: ${l} → 1–2TB NVMe Gen4`)),(/8\s?gb/i.test(i)||i==="(unspecified)")&&(c.push("Increase RAM to 16–32GB DDR4/DDR5 depending on platform"),r.push(`RAM: ${i} → 16–32GB`)),c.length&&e.push({title:"Phase 1 – Immediate FPS & responsiveness",items:c});const d=[];(/ryzen\s?[1-3]|i[3-7]-?\d{3,4}\b/i.test(n)||/am4\b|lga\s?115|lga\s?1200/i.test(t.mobo||""))&&(d.push("Move to a modern platform (AM5 or Intel 13th/14th gen)"),d.push("CPU: Ryzen 5 7600 or Intel i5-13600K"),d.push("Motherboard: B650 (AM5) or B760/Z790 (LGA1700)"),d.push("Memory: 32GB DDR5-6000 EXPO/XMP"),r.push(`CPU/Mobo/RAM: ${n} → Ryzen 5 7600 + B650 + 32GB DDR5-6000`)),d.length&&e.push({title:"Phase 2 – Platform longevity & smoothness",items:d});const m=[],w=parseInt(a.replace(/[^\d]/g,""))||0;return w&&w<750&&(m.push("Upgrade PSU to 750–850W 80+ Gold (ATX 3.0 ready)"),r.push(`PSU: ${a} → 750–850W 80+ Gold`)),t.cooler&&m.push("Consider 240/360mm AIO or premium air for lower noise"),t.case&&m.push("High-airflow case for sustained boost & acoustics"),m.length&&e.push({title:"Phase 3 – Silence, thermals & headroom",items:m}),e.length||e.push({title:"Plan",items:["System already balanced. Provide target resolution/games for nuance."]}),{phases:e,diffs:r}},k=t=>{const e=t.toLowerCase();if(/^(silent|rgb|small form factor|budget|productivity)\s*variant$/i.test(e.trim())){const i=e.replace(/\s*variant$/i,"").trim();return{content:`To apply a ${i} variant, click the "${i}" refinement chip above the chat input. This will transform the latest recommended build with optimised components.`,suggestions:["Show latest build","Start new build","Compare options"]}}if(/modular\s*(vs|versus)?\s*non.?modular/i.test(e))return{content:`**Modular vs Non-Modular PSU:**

✅ **Modular Advantages:**
• Cleaner cable management
• Better airflow (no unused cables)
• Easier installation
• Premium aesthetic

💰 **Non-Modular:**
• £10-20 cheaper
• All cables permanently attached
• Fine for budget builds

**Recommendation:** Go modular if budget allows (most 750W+ PSUs are modular anyway). It's worth the £15 premium for cleaner builds.`,suggestions:["PSU wattage calculator","Best PSU brands","80+ ratings explained"]};if(/am5\s*(vs|versus)?\s*lga\s?1700/i.test(e)||/amd\s*(vs|versus)?\s*intel\s*platform/i.test(e))return{content:`**AM5 (AMD) vs LGA1700 (Intel) Platform Comparison:**

🔴 **AM5 Advantages:**
• Longer upgrade path (AMD commits to 2025+)
• Better value CPUs (7600/7700X)
• PCIe Gen5 on more boards
• Lower motherboard entry cost

🔵 **LGA1700 Advantages:**
• Slight gaming lead (13600K/14600K)
• Better DDR4 compatibility (budget option)
• Mature platform, more board choices

**Verdict:** AM5 for longevity, LGA1700 for peak gaming FPS. Both excellent in 2024.`,suggestions:["7600X vs 13600K","Best AM5 motherboard","Best Z790 board"]};const r=H(t);if(r){const i=q(r);let l="";return/4k|2160p/i.test(e)?l=" optimised for 4K gaming":/1440p/i.test(e)?l=" balanced for 1440p":/1080p/i.test(e)&&(l=" tuned for 1080p"),/rgb|light|aesthetic/i.test(e)&&(l+=" with RGB emphasis"),/silent|quiet/i.test(e)&&(l+=" with low-noise components"),/compact|sff|small/i.test(e)&&(l+=" in compact form factor"),/render|creat|edit/i.test(e)&&(l+=" for content creation"),{content:`${l?`Here's your ~£${r} build${l}:`:`Proposed build for ~£${r} (balanced performance):`}

${i.map(d=>`• ${d.category}: ${d.name}
  → ${d.rationale}`).join(`

`)}

💡 Want variations? Try Silent, RGB, or Small Form Factor refinements!`,suggestions:["Show pricing","Silent variant","RGB variant","Upgrade path"],recommendedBuild:i}}const n=Z(t);if(n)return{content:n,suggestions:["Gaming focus","Productivity focus","Thermal differences"]};if(/upgrade\s?path|upgrade\s?plan|phase/i.test(e)||/\bcurrent:\b/i.test(e)){const i=N(t);if(!i)return{content:`To create a phased upgrade plan, paste your current specs like:

CPU: [your CPU]
GPU: [your GPU]
PSU: [your PSU wattage]
Motherboard: [your board]
RAM: [your RAM]

I'll analyse and suggest optimal upgrade priorities.`,suggestions:["£1200 new build instead","Check compatibility first"]};const l=Q(i);return{content:`Upgrade plan based on your current spec:

${l.phases.map(d=>`• ${d.title}
  - ${d.items.join(`
  - `)}`).join(`

`)}${l.diffs.length?`

Diff summary:
${l.diffs.map(d=>`• ${d}`).join(`
`)}`:""}

Ask for pricing or a silent/RGB variant to refine further.`,suggestions:["Show pricing","Silent variant","RGB variant"]}}const o=N(t);if(o){const i=J(o);return{content:`Compatibility review:
`+i.notes.map(l=>`• ${l}`).join(`
`)+(i.actions.length?`

Suggested next steps:
${i.actions.map(l=>`• ${l}`).join(`
`)}`:"")+`

Paste more details (exact models) for a deeper check.`,suggestions:["Check PSU sizing","Verify cooler clearance","BIOS/Chipset compatibility"]}}if(e.includes("what cpu should i choose")||e.includes("cpu recommendations"))return{content:`For CPU recommendations, here's what I suggest based on different use cases:

🎮 **Gaming**: AMD Ryzen 7 9800X3D (£450-480, best gaming CPU) or Ryzen 7 7800X3D (£380-420, excellent value)
💻 **Mid-Range**: AMD Ryzen 5 9600X (£250-280) or Intel i5-14600K (£260-290)
� **Productivity**: AMD Ryzen 9 9900X (£450-500) or Intel i7-14700K (£360-400) for content creation
🚀 **High-End**: AMD Ryzen 9 9950X (£600-650) or Intel i9-14900K (£500-550) for maximum performance

What's your primary use case and budget range?`,suggestions:["Gaming CPU under £300","Best productivity CPU","9800X3D vs 7800X3D"]};if(e.includes("best graphics card for gaming")||e.includes("gpu for gaming"))return{content:`Here are my top GPU recommendations for gaming (November 2025):

🎯 **1080p/1440p**: RTX 5070 (£600-700, DLSS 4) or Intel Arc B580 (£200-240, best budget)
🎮 **1440p/4K**: RTX 5070 Ti (£800-900) or RTX 4070 Ti Super (£650-750, good deals)
🚀 **4K Ultra**: RTX 5080 (£1100-1300) or RTX 5090 (£1800-2000, absolute best)
💎 **Best Value**: RX 7900 XT (£600-700, excellent raster) or RTX 4080 Super (£850-950, prev gen deal)

**RTX 50-series** brings DLSS 4, better RT, lower power. **Previous gen** (4070S/4080S) now excellent value. What resolution and budget?`,suggestions:["RTX 5070 vs 4070 Ti Super","Best 4K gaming GPU","Should I buy RTX 50-series or wait?"]};if(e.includes("ssd vs hdd")||e.includes("storage options"))return{content:`Here's the breakdown between SSD and HDD storage:

⚡ **SSD Advantages**:
• 10x faster loading times
• Silent operation
• More reliable
• Better for OS and games

💾 **HDD Advantages**:
• Much cheaper per GB
• Great for mass storage
• Good for backups

**Recommendation**: 1TB NVMe SSD for OS + games, 2TB HDD for storage`,suggestions:["Best gaming SSDs","NVMe vs SATA","Storage capacity planning"]};if(e.includes("power supply")||e.includes("psu")||e.includes("how much power"))return{content:`PSU wattage depends on your components:

⚡ **Budget Build** (RTX 4060): 650W PSU
🎮 **Mid-Range** (RTX 4070): 750W PSU
🚀 **High-End** (RTX 4080/4090): 850W+ PSU

**Key factors**: GPU power draw, CPU power, future upgrades
**Recommended brands**: Corsair, EVGA, Seasonic (80+ Gold rated)

What GPU are you planning to use?`,suggestions:["PSU calculator","Modular vs non-modular","80+ efficiency ratings"]};if(e.includes("best pc build for £1000")||e.includes("budget builds"))return{content:`Here's an excellent £1000 gaming build:

🎮 **£1000 Gaming Build**:
• CPU: AMD Ryzen 5 7600 (£200)
• GPU: RTX 4060 Ti (£400)
• RAM: 16GB DDR5-5600 (£80)
• Storage: 1TB NVMe SSD (£60)
• Motherboard: B650 (£120)
• PSU: 650W 80+ Gold (£80)
• Case: Mid-tower (£60)

This build handles 1440p gaming at high settings beautifully!`,suggestions:["£800 budget build","£1500 high-end build","Upgrade priority order"]};if(e.includes("gaming")||e.includes("game"))return P.gaming;if(e.includes("budget")||e.includes("price")||e.includes("cost"))return P.budget;if(e.includes("compatible")||e.includes("compatibility"))return P.compatibility;if(e.includes("work")||e.includes("professional")||e.includes("editing"))return P.workstation;if(e.includes("ryzen")||e.includes("intel"))return{content:"Great choice! Both AMD Ryzen and Intel offer excellent processors. Ryzen typically offers better value and more cores, while Intel often has slightly better gaming performance. What's your specific use case?",suggestions:["Ryzen vs Intel","Best gaming CPU","Productivity CPU"]};if(e.includes("rtx")||e.includes("nvidia")||e.includes("graphics"))return{content:"NVIDIA RTX cards are excellent for gaming and creative work with features like ray tracing and DLSS. The RTX 4070 is great for 1440p, while the RTX 4080/4090 handle 4K gaming beautifully.",suggestions:["RTX 4070 vs 4080","Ray tracing games","DLSS benefits"]};if(e.includes("cooling")||e.includes("temperature"))return{content:"Good cooling is essential! For most CPUs, a quality air cooler like the Noctua NH-D15 is sufficient. For high-end CPUs or compact builds, consider AIO liquid cooling.",suggestions:["Air vs liquid cooling","Best CPU coolers","Case airflow tips"]};switch(_(t)){case"troubleshooting":return P.troubleshooting;case"compatibility":return{content:`Compatibility checklist:
1. CPU socket matches motherboard (e.g. AM5 vs LGA1700)
2. BIOS version supports chosen CPU
3. Case GPU clearance vs GPU length
4. PSU wattage & 12VHPWR connectors (if needed)
5. RAM speed supported (EXPO/XMP)
6. Cooler height vs case limit

Want me to validate a specific list? Paste it in.`,suggestions:["Check PSU sizing","Verify cooler clearance","BIOS update steps"]};case"upgrade":return P.upgrade;case"power":return{content:"Power sizing: Aim for 40–50% typical load for peak efficiency on Gold units. Provide GPU + CPU and I can estimate transient spikes. Consider ATX 3.0 for next-gen GPUs.",suggestions:["Transient spike info","ATX 3.0 benefits","Efficiency curves"]};case"workstation":return{content:`For professional workstations, let's optimise based on your workflow:

**Core Components:**
• CPU: High core count (Ryzen 9 / i7-i9) for parallel tasks
• RAM: 32-64GB minimum for heavy multitasking
• Storage: NVMe Gen4 for scratch disk performance
• GPU: VRAM matters (24GB for 3D/AI, 8GB+ for video)

**What's your budget and primary workload?** (Video editing, 3D rendering, CAD, programming, AI/ML?)`,suggestions:["£2000 video editing rig","£3500 3D rendering beast","Programming workstation"]};case"gaming":return/1080p|1440p|4k|2160p|ultra|high|low/i.test(e)?{content:`Great! For the best gaming experience at your target resolution, I need to know your budget to recommend the right GPU/CPU tier.

**Typical price points:**
• £800-1000: Solid 1080p/1440p gaming
• £1200-1800: High-end 1440p / entry 4K
• £2000+: Premium 4K / high refresh

What's your budget range?`,suggestions:["£1200 1440p build","£2000 4K gaming rig","£800 budget gaming"]}:{content:`Let's build you an amazing gaming PC! To give you the perfect recommendation, I need two details:

**1. Budget:** What's your total budget? (£)
**2. Target:** What resolution/refresh rate? (1080p, 1440p, 4K)

Example: *'£1500 for 1440p high refresh'* or *'£2500 4K gaming monster'*`,suggestions:["£1200 1440p gaming","£2000 4K ultra","£800 1080p esports"]};case"compare":return{content:`I can compare CPUs or GPUs head-to-head! Format your request like:

• 'Compare 7600X vs 13600K for gaming'
• 'RTX 4070 vs RX 7800 XT'
• '7900X vs 13900K productivity'

Or just tell me what you're deciding between!`,suggestions:["7600X vs 13600K","RTX 4070 vs 4070 Ti","AM5 vs LGA1700"]};default:return/top|best|high.end|extreme|monster|beast/i.test(e)&&/gaming/i.test(e)?{content:`Building a top-tier gaming rig! Let's aim high:

**Elite Gaming Spec:**
• RTX 4090 or 4080 Super (4K powerhouse)
• Ryzen 9 7950X3D or i9-14900K
• 32-64GB DDR5-6000+
• Gen4 NVMe 2TB+
• 1000W+ Platinum PSU

**What's your budget ceiling?** This helps me fine-tune the exact components.`,suggestions:["£3000 elite build","£4000+ no compromise","£2500 sweet spot"]}:{content:`I'm your AI PC building consultant! I can:

✅ Generate full custom builds from your budget
✅ Compare CPUs/GPUs with real-world context  
✅ Check part compatibility & identify issues
✅ Map multi-phase upgrade paths

**Try asking:**
• '*£1500 silent 1440p gaming build*'
• '*Compare 7800X3D vs 13700K*'
• '*Upgrade path for my i5-10400 + GTX 1660*'

What can I help you build today?`,suggestions:["Generate 1440p build","Compare two CPUs","Check PSU sizing","Plan upgrade phases"]}}},D=async t=>{var e;try{const r=g.slice(-6).map(a=>({type:a.type,content:a.content})),n=new AbortController,o=setTimeout(()=>n.abort(),3e4);try{const a=await fetch("/api/ai/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[...r,{type:"user",content:t}],expertMode:S}),signal:n.signal});if(clearTimeout(o),!a.ok){let d=null;try{d=await a.json()}catch{}const m=d&&typeof d=="object"&&"code"in d?d.code:void 0;throw p.error("AI API non-OK response",{status:a.status,statusText:a.statusText,body:d}),new Error(m?`AI API failed (${m})`:"AI API failed")}const i=(e=a.body)==null?void 0:e.getReader(),l=new TextDecoder;let c="";if(!i)throw p.error("No readable stream available"),new Error("Stream not available");for(p.debug("Starting AI stream read");;){const{done:d,value:m}=await i.read();if(d){p.debug("Stream complete",{length:c.length});break}const v=l.decode(m,{stream:!0}).split(`
`);for(const C of v)if(C.startsWith("data: ")){const A=C.slice(6);if(A==="[DONE]")break;try{const E=JSON.parse(A);E.content&&(c+=E.content)}catch{p.debug("Chunk parse skipped",{sample:C.substring(0,50)})}}}if(!c)throw p.error("Stream completed but no content received"),new Error("Empty response from AI");return p.info("AI response received successfully",{length:c.length}),c}catch(a){throw clearTimeout(o),a}}catch(r){const n=r instanceof Error?r.message:String(r);return p.error("Real AI error",{message:n}),n.includes("AbortError")||n.includes("timeout")?"AI response timed out. Using rule-based responses for now.":n.includes("insufficient_quota")?"AI quota exceeded (429). Using rule-based responses for now.":n.includes("invalid_api_key")?"AI key issue detected. Please verify server configuration. Falling back to rule-based responses.":n.includes("Stream not available")||n.includes("Empty response")?"AI communication error. Using rule-based responses for now.":"AI mode temporarily unavailable. Using rule-based responses."}},x=(t,e)=>{R(!0);const r=t.split(/(\n\n+)/);let n="",o=0;const a=g.length+2,i=new Date,l=()=>{if(o>=r.length){R(!1);return}n+=r[o];const c={id:a,type:"bot",content:n,timestamp:i,suggestions:e.suggestions,recommendedBuild:e.recommendedBuild,mode:S?"detailed":"concise"};u(d=>[...d.filter(w=>w.id!==a),c]),o++,setTimeout(l,180+Math.random()*140)};l()},X=async()=>{if(!T.trim()||B)return;const t={id:g.length+1,type:"user",content:T,timestamp:new Date};if(u(r=>[...r,t]),M(""),y(!0),b==="ai-only"||b==="hybrid"){R(!0);const r=await D(t.content);if(y(!1),r.includes("unavailable")||r.includes("quota exceeded")||r.includes("key issue")){p.warn("AI API failed, falling back to mock responses");const o=k(t.content);x(o.content,{suggestions:o.suggestions,recommendedBuild:o.recommendedBuild})}else x(r,{suggestions:["Tell me more","Another option","Compare alternatives","Check compatibility"]})}else{y(!1);const r=k(t.content);if(x(r.content,{suggestions:r.suggestions,recommendedBuild:r.recommendedBuild}),r.recommendedBuild){const n={id:Date.now(),type:"bot",content:"Fetching live pricing adjustments...",timestamp:new Date};u(o=>[...o,n]);try{const{fetchPrices:o}=await U(async()=>{const{fetchPrices:l}=await import("./pricing-7AN3FaBl.js");return{fetchPrices:l}},[]),a=await o(r.recommendedBuild),i={id:Date.now()+1,type:"bot",content:`Updated component prices:
${a.map(l=>`• ${l.category}: ${l.name} — ${l.approxPrice}`).join(`
`)}

(Prices are simulated and may vary.)`,timestamp:new Date,recommendedBuild:a};u(l=>[...l,i])}catch{const o={id:Date.now()+2,type:"bot",content:"Pricing service unavailable. Skipping live updates.",timestamp:new Date};u(a=>[...a,o])}}}},Y=async t=>{if(B)return;const e={id:g.length+1,type:"user",content:t,timestamp:new Date};if(u(n=>[...n,e]),y(!0),b!=="rules"){R(!0);const n=await D(t);if(y(!1),n.includes("unavailable")||n.includes("quota exceeded")||n.includes("key issue")){p.warn("AI API failed, falling back to mock responses");const a=k(t);x(a.content,{suggestions:a.suggestions,recommendedBuild:a.recommendedBuild})}else x(n,{suggestions:["Tell me more","Another option","Compare alternatives","Check compatibility"]})}else{y(!1);const n=k(t);if(x(n.content,{suggestions:n.suggestions,recommendedBuild:n.recommendedBuild}),n.recommendedBuild){const o={id:Date.now(),type:"bot",content:"Fetching live pricing adjustments...",timestamp:new Date};u(a=>[...a,o]);try{const{fetchPrices:a}=await U(async()=>{const{fetchPrices:c}=await import("./pricing-7AN3FaBl.js");return{fetchPrices:c}},[]),i=await a(n.recommendedBuild),l={id:Date.now()+1,type:"bot",content:`Updated component prices:
${i.map(c=>`• ${c.category}: ${c.name} — ${c.approxPrice}`).join(`
`)}

(Prices are simulated and may vary.)`,timestamp:new Date,recommendedBuild:i};u(c=>[...c,l])}catch{const a={id:Date.now()+2,type:"bot",content:"Pricing service unavailable. Skipping live updates.",timestamp:new Date};u(i=>[...i,a])}}}},ee=async t=>{if(B)return;const e={id:g.length+1,type:"user",content:t,timestamp:new Date};if(u(n=>[...n,e]),y(!0),b!=="rules"){R(!0);const n=await D(t);if(y(!1),n.includes("unavailable")||n.includes("quota exceeded")||n.includes("key issue")){p.warn("AI API failed, falling back to mock responses");const a=k(t);x(a.content,{suggestions:a.suggestions,recommendedBuild:a.recommendedBuild})}else x(n,{suggestions:["Tell me more","Another option","Compare alternatives","Check compatibility"]})}else{y(!1);const n=k(t);if(x(n.content,{suggestions:n.suggestions,recommendedBuild:n.recommendedBuild}),n.recommendedBuild){const o={id:Date.now(),type:"bot",content:"Fetching live pricing adjustments...",timestamp:new Date};u(a=>[...a,o]);try{const{fetchPrices:a}=await U(async()=>{const{fetchPrices:c}=await import("./pricing-7AN3FaBl.js");return{fetchPrices:c}},[]),i=await a(n.recommendedBuild),l={id:Date.now()+1,type:"bot",content:`Updated component prices:
${i.map(c=>`• ${c.category}: ${c.name} — ${c.approxPrice}`).join(`
`)}

(Prices are simulated and may vary.)`,timestamp:new Date,recommendedBuild:i};u(c=>[...c,l])}catch{const a={id:Date.now()+2,type:"bot",content:"Pricing service unavailable. Skipping live updates.",timestamp:new Date};u(i=>[...i,a])}}}},te=[{icon:ue,label:"CPU Guide",message:"What CPU should I choose for my build?"},{icon:me,label:"GPU Selection",message:"Best graphics card for my needs?"},{icon:pe,label:"Troubleshooting",message:"My PC won't boot - help me diagnose the issue"},{icon:ge,label:"Storage Guide",message:"What storage should I get?"},{icon:fe,label:"Build Planning",message:"Help me plan a complete PC build"}];return s.jsx(se,{open:K,onOpenChange:L,children:s.jsxs(re,{className:"z-[80] w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[65vw] 2xl:w-[60vw] max-w-[1400px] max-w-none sm:max-w-none md:max-w-none lg:max-w-none xl:max-w-none 2xl:max-w-none h-[90vh] sm:h-[85vh] bg-gradient-to-br from-black/95 via-slate-900/95 to-blue-950/95 backdrop-blur-xl border-sky-500/20 text-white flex flex-col p-0",children:[s.jsxs(oe,{className:"border-b border-sky-500/20 pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6",children:[s.jsxs(ae,{className:"flex items-center space-x-2 sm:space-x-3",children:[s.jsx("div",{className:"w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0",children:s.jsx(I,{className:"w-4 h-4 sm:w-5 sm:h-5 text-white"})}),s.jsxs("div",{className:"min-w-0 flex-1",children:[s.jsx("span",{className:"text-lg sm:text-xl bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent block truncate",children:"VortexAI - IT Professional Assistant"}),s.jsx("div",{className:"text-xs sm:text-sm text-gray-400 font-normal truncate",children:"Expert PC Building & Technical Support"})]})]}),s.jsx(ie,{className:"sr-only",children:"VortexAI is your professional IT consultant specialising in custom PC builds, component recommendations, compatibility checks, and troubleshooting PC issues. Get expert guidance for building your dream PC or diagnosing technical problems."})]}),s.jsxs("div",{className:"flex-1 flex flex-col lg:flex-row overflow-hidden",children:[s.jsxs("div",{className:"flex-1 flex flex-col min-h-0",children:[s.jsxs("div",{className:"flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4",children:[g.some(t=>t.type==="bot"&&t.recommendedBuild)&&s.jsx("div",{className:"flex flex-wrap gap-2 mb-2",children:["Silent","RGB","Small Form Factor","Budget","Productivity"].map(t=>s.jsx(f,{size:"sm",variant:"outline",className:"h-7 px-2 text-[10px] sm:text-[11px] border-sky-500/30 text-sky-300 hover:bg-sky-500/20 hover:text-white",onClick:()=>{const e=[...g].reverse().find(i=>i.recommendedBuild);if(!(e!=null&&e.recommendedBuild))return;let n=[...e.recommendedBuild];const o=(i,l,c)=>{n=n.map(d=>d.category===i?{...d,name:l,rationale:c}:d)};switch(t){case"Silent":o("Cooling","High-end Air Cooler","Low-noise thermal performance"),o("Case","Silent Optimised Mid-Tower","Sound-dampened panels & airflow balance");break;case"RGB":o("Case","Tempered Glass RGB Mid-Tower","Showcase lighting & fans"),o("Cooling","240mm RGB AIO","Enhanced aesthetics + cooling");break;case"Small Form Factor":o("Case","Compact SFF Case","Space-efficient footprint"),o("Cooling","Low-profile Air Cooler","Fits SFF constraints");break;case"Budget":o("GPU","RTX 4060","Cost-saving while retaining 1080p performance"),o("CPU","Ryzen 5 7500F","Lower cost balanced gaming CPU");break;case"Productivity":o("CPU","Ryzen 7 7700X","More cores for creation workloads"),o("RAM","64GB DDR5-6000","Heavy multitasking & editing capacity");break}const a={id:Date.now(),type:"bot",content:`${t} variant applied. Adjusted key components for target preference. Ask for pricing to refresh costs.`,timestamp:new Date,recommendedBuild:n,suggestions:["Show pricing","Another variant","Copy build"]};u(i=>[...i,a])},children:t},t))}),g.map(t=>s.jsx("div",{className:`flex ${t.type==="user"?"justify-end":"justify-start"}`,children:s.jsxs("div",{className:`flex space-x-2 sm:space-x-3 max-w-[85%] sm:max-w-[80%] md:max-w-[70%] ${t.type==="user"?"flex-row-reverse space-x-reverse":""}`,children:[s.jsx(W,{className:"w-8 h-8 sm:w-10 sm:h-10 mt-1 flex-shrink-0",children:s.jsx(z,{className:t.type==="user"?"bg-gradient-to-r from-sky-600 to-blue-600 text-white":"bg-gradient-to-r from-sky-500 to-blue-600 text-white",children:t.type==="user"?s.jsx(le,{className:"w-3 h-3 sm:w-4 sm:h-4"}):s.jsx(I,{className:"w-3 h-3 sm:w-4 sm:h-4"})})}),s.jsxs("div",{className:`flex flex-col space-y-2 min-w-0 flex-1 ${t.type==="user"?"items-end":"items-start"}`,children:[s.jsxs($,{className:`p-3 sm:p-4 backdrop-blur-sm whitespace-pre-line break-words ${t.type==="user"?"bg-gradient-to-r from-sky-600/90 to-blue-600/90 text-white border-sky-500/30":"bg-white/10 border-white/20 text-white"}`,children:[s.jsx("p",{className:"leading-relaxed text-xs sm:text-sm md:text-[15px]",children:t.content}),t.recommendedBuild&&s.jsxs("div",{className:"mt-3 sm:mt-4 space-y-2",children:[s.jsx("div",{className:"text-[10px] sm:text-xs uppercase tracking-wide text-sky-300 font-semibold",children:"Recommended Build Breakdown"}),s.jsx("div",{className:"grid grid-cols-1 gap-2",children:t.recommendedBuild.map((e,r)=>s.jsxs("div",{className:"bg-white/5 border border-white/10 rounded-md p-2 flex flex-col gap-1 hover:border-sky-500/30 transition",children:[s.jsxs("div",{className:"flex items-center justify-between gap-2",children:[s.jsx("span",{className:"text-[10px] sm:text-[11px] text-gray-400 font-medium truncate",children:e.category}),e.approxPrice&&s.jsx("span",{className:"text-[10px] sm:text-[11px] text-sky-300 flex-shrink-0",children:e.approxPrice})]}),s.jsx("div",{className:"text-[11px] sm:text-xs text-white font-semibold break-words",children:e.name}),s.jsx("div",{className:"text-[10px] sm:text-[11px] text-gray-400 break-words",children:e.rationale})]},r))}),s.jsxs("div",{className:"flex flex-wrap gap-1.5 sm:gap-2",children:[s.jsx(f,{size:"sm",variant:"outline",onClick:()=>{var r;const e=(t.recommendedBuild??[]).map(n=>`${n.category}: ${n.name} (${n.rationale}${n.approxPrice?", "+n.approxPrice:""})`).join(`
`);(r=navigator.clipboard)==null||r.writeText(e)},className:"text-[10px] sm:text-[11px] h-6 sm:h-7 px-1.5 sm:px-2 bg-white/5 border-sky-500/30 text-sky-300 hover:bg-sky-500/20 hover:text-white",children:"Copy Build"}),s.jsx(f,{size:"sm",variant:"outline",onClick:()=>{const e=JSON.stringify(t.recommendedBuild??[],null,2),r=new Blob([e],{type:"application/json"}),n=URL.createObjectURL(r),o=document.createElement("a");o.href=n,o.download=`vortex-build-${t.id}.json`,o.click(),URL.revokeObjectURL(n)},className:"text-[10px] sm:text-[11px] h-6 sm:h-7 px-1.5 sm:px-2 bg-white/5 border-sky-500/30 text-sky-300 hover:bg-sky-500/20 hover:text-white",children:"Export JSON"}),s.jsx(f,{size:"sm",variant:"outline",onClick:()=>{const e=(t.recommendedBuild??[]).map(a=>`${a.category}: ${a.name} - ${a.rationale}${a.approxPrice?" ("+a.approxPrice+")":""}`),r=new Blob([e.join(`
`)],{type:"text/plain"}),n=URL.createObjectURL(r),o=document.createElement("a");o.href=n,o.download=`vortex-build-${t.id}.txt`,o.click(),URL.revokeObjectURL(n)},className:"text-[10px] sm:text-[11px] h-6 sm:h-7 px-1.5 sm:px-2 bg-white/5 border-sky-500/30 text-sky-300 hover:bg-sky-500/20 hover:text-white",children:"Export TXT"})]})]})]}),t.suggestions&&s.jsx("div",{className:"flex flex-wrap gap-1.5 sm:gap-2 max-w-full",children:t.suggestions.map((e,r)=>s.jsx(f,{variant:"outline",size:"sm",onClick:()=>Y(e),className:"text-[10px] sm:text-xs border-sky-500/30 text-sky-300 hover:bg-sky-500/20 hover:text-white hover:border-sky-400/50",children:e},r))}),s.jsx("span",{className:"text-xs text-gray-500",children:t.timestamp.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})})]})]})},t.id)),(G||B)&&s.jsx("div",{className:"flex justify-start",children:s.jsxs("div",{className:"flex space-x-3",children:[s.jsx(W,{className:"w-10 h-10 mt-1",children:s.jsx(z,{className:"bg-gradient-to-r from-sky-500 to-blue-600 text-white",children:s.jsx(I,{className:"w-4 h-4"})})}),s.jsx($,{className:"bg-white/10 border-white/20 p-4",children:s.jsxs("div",{className:"flex space-x-1",children:[s.jsx("div",{className:"w-2 h-2 bg-sky-400 rounded-full animate-bounce"}),s.jsx("div",{className:"w-2 h-2 bg-sky-400 rounded-full animate-bounce delay-100"}),s.jsx("div",{className:"w-2 h-2 bg-sky-400 rounded-full animate-bounce delay-200"})]})})]})}),s.jsx("div",{ref:j})]}),s.jsxs("div",{className:"border-t border-sky-500/20 p-3 sm:p-4",children:[s.jsxs("div",{className:"flex flex-wrap gap-1.5 sm:gap-2 md:gap-3 mb-2 sm:mb-3",children:[s.jsx(f,{variant:S?"default":"outline",size:"sm",onClick:()=>F(t=>!t),className:S?"bg-gradient-to-r from-sky-600 to-blue-600 text-[10px] sm:text-xs h-7 sm:h-8":"border-sky-500/30 text-sky-300 text-[10px] sm:text-xs h-7 sm:h-8",children:S?"Expert: ON":"Expert"}),s.jsxs(f,{variant:b!=="rules"?"default":"outline",size:"sm",onClick:()=>{V(t=>t==="rules"?"hybrid":t==="hybrid"?"ai-only":"rules")},className:b!=="rules"?"bg-gradient-to-r from-purple-600 to-pink-600 text-[10px] sm:text-xs h-7 sm:h-8":"border-purple-500/30 text-purple-300 text-[10px] sm:text-xs h-7 sm:h-8",title:"Rules: Fast, free responses | Hybrid: Smart fallback to AI | AI-Only: Full AI power",children:[b==="rules"&&"🔧 Rules",b==="hybrid"&&"🤖 Hybrid",b==="ai-only"&&"✨ AI"]}),s.jsx(f,{variant:"outline",size:"sm",onClick:()=>{u([g[0],{id:Date.now(),type:"system",content:"Context cleared. Ask a fresh question!",timestamp:new Date}])},className:"border-red-500/40 text-red-300 hover:bg-red-500/20 text-[10px] sm:text-xs h-7 sm:h-8",children:"Reset"})]}),s.jsxs("div",{className:"flex space-x-2 sm:space-x-3",children:[s.jsx(ce,{value:T,onChange:t=>M(t.target.value),onKeyPress:t=>t.key==="Enter"&&X(),placeholder:"Ask me anything about PC building...",className:"flex-1 bg-white/10 border-sky-500/30 text-white placeholder-gray-400 text-sm"}),s.jsx(f,{onClick:X,disabled:!T.trim()||G,className:"bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 flex-shrink-0",children:s.jsx(he,{className:"w-4 h-4"})})]})]})]}),s.jsxs("div",{className:"hidden lg:block lg:w-72 xl:w-80 border-l border-sky-500/20 p-4 overflow-y-auto",children:[s.jsxs("h3",{className:"font-bold text-white mb-4 flex items-center text-sm",children:[s.jsx(de,{className:"w-4 h-4 mr-2 text-sky-400"}),"Quick Actions"]}),s.jsx("div",{className:"space-y-2.5",children:te.map((t,e)=>s.jsx(f,{variant:"ghost",onClick:()=>ee(t.message),className:"w-full justify-start text-left p-2.5 h-auto border border-sky-500/20 hover:bg-sky-500/10 hover:border-sky-400/30",children:s.jsxs("div",{className:"flex items-start space-x-2.5",children:[s.jsx("div",{className:"w-7 h-7 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0",children:s.jsx(t.icon,{className:"w-3.5 h-3.5 text-white"})}),s.jsxs("div",{className:"flex-1 text-left min-w-0",children:[s.jsx("div",{className:"font-medium text-white text-xs truncate",children:t.label}),s.jsx("div",{className:"text-[11px] text-gray-400 mt-0.5 line-clamp-2",children:t.message})]})]})},e))}),s.jsxs("div",{className:"mt-4 p-3 bg-gradient-to-r from-sky-600/10 to-blue-600/10 border border-sky-500/20 rounded-lg space-y-2",children:[s.jsx("h4",{className:"font-medium text-sky-300 mb-2 text-xs",children:"💡 Tips & Capabilities"}),s.jsxs("ul",{className:"text-[11px] text-gray-300 space-y-1 list-disc list-inside",children:[s.jsx("li",{className:"line-clamp-2",children:'Ask: "Compare 7600X vs 13600K gaming" for head-to-head guidance.'}),s.jsx("li",{className:"line-clamp-2",children:'Provide budget: "£1300 quiet 1440p build" for tailored parts.'}),s.jsx("li",{className:"line-clamp-2",children:"Paste your part list to get compatibility sanity-checks."}),s.jsx("li",{children:"Toggle Expert Mode for deeper technical nuance."}),s.jsx("li",{children:"Use Reset Context to start a fresh planning thread."})]})]})]})]})]})})}export{Ce as AIAssistant};
