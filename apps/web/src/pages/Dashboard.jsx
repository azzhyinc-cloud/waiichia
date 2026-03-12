import { useState, useEffect } from "react"
import { useAuthStore, useDeviseStore, usePageStore } from "../stores/index.js"

const PERIODS=[{id:"7d",label:"7j"},{id:"30d",label:"30j"},{id:"90d",label:"90j"},{id:"1y",label:"1an"}]
const fmtK=n=>n>=1000000?(n/1000000).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"K":String(n||0)
const MOCK_KPI=[{icon:"🎧",label:"Écoutes",value:42870,delta:"+12%",color:"#f5a623"},{icon:"💰",label:"Revenus",value:186400,delta:"+8%",color:"#2dc653",suffix:true},{icon:"👥",label:"Nouveaux fans",value:1240,delta:"+23%",color:"#9b59f5"},{icon:"📤",label:"Sons actifs",value:34,delta:"+2",color:"#4d9fff"}]
const MOCK_GEO=[{pays:"🇰🇲 Comores",pct:54,v:23148},{pays:"🇲🇬 Madagascar",pct:18,v:7717},{pays:"🇫🇷 France",pct:12,v:5144},{pays:"🇹🇿 Tanzanie",pct:8,v:3430},{pays:"🇷🇪 Réunion",pct:5,v:2144},{pays:"🌍 Autres",pct:3,v:1287}]
const MOCK_TOP=[{rank:1,title:"Twarab ya Komori",plays:8420,rev:21050,trend:"↑"},{rank:2,title:"Moroni Flow",plays:6180,rev:15450,trend:"↑"},{rank:3,title:"Island Vibe",plays:4930,rev:7395,trend:"→"},{rank:4,title:"Masiwa Matatu",plays:3760,rev:5640,trend:"↑"},{rank:5,title:"Komori Nights",plays:2890,rev:4335,trend:"↓"}]
const MOCK_REV=[{label:"Ventes directes",pct:42,color:"#f5a623"},{label:"Streaming",pct:28,color:"#2dc653"},{label:"Événements",pct:18,color:"#9b59f5"},{label:"Publicité",pct:8,color:"#4d9fff"},{label:"Boutique",pct:4,color:"#e63946"}]
const MOCK_TX=[{icon:"💰",label:"Vente — Twarab ya Komori",amount:"+2500",type:"credit",date:"Auj. 09:14"},{icon:"⏳",label:"Location × 3 — Moroni Flow",amount:"+600",type:"credit",date:"Auj. 08:30"},{icon:"🎟️",label:"Billet — Concert Moroni Live",amount:"+12000",type:"credit",date:"Hier 20:10"},{icon:"🛒",label:"Boost Feed campagne",amount:"-3000",type:"debit",date:"Hier 16:45"},{icon:"💰",label:"Vente — Island Vibe",amount:"+1500",type:"credit",date:"Lun. 14:20"},{icon:"🎁",label:"Tips concert live",amount:"+3200",type:"credit",date:"Lun. 11:30"},{icon:"📢",label:"Campagne pub 2j",amount:"-5000",type:"debit",date:"Dim. 10:00"}]

function genChart(n){return Array.from({length:n},()=>({e:800+Math.floor(Math.random()*1200),r:3000+Math.floor(Math.random()*5000)}))}
function genHeat(){return["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(d=>({day:d,hours:Array.from({length:24},(_,h)=>{const pk=(h>=6&&h<=9)||(h>=12&&h<=14)||(h>=19&&h<=23);return pk?Math.floor(Math.random()*80+20):Math.floor(Math.random()*20)})}))}

function Spark({data,color}){
  const max=Math.max(...data),min=Math.min(...data),r=max-min||1,W=80,H=28
  const pts=data.map((v,i)=>`${(i/(data.length-1))*W},${H-((v-min)/r)*(H-4)-2}`).join(" ")
  return <svg width={W} height={H}><polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round"/></svg>
}
function MainChart({data}){
  const W=800,H=160,maxE=Math.max(...data.map(d=>d.e)),maxR=Math.max(...data.map(d=>d.r))
  const ptE=data.map((d,i)=>`${(i/(data.length-1))*(W-40)+20},${H-((d.e/maxE)*(H-20))-10}`).join(" ")
  const ptR=data.map((d,i)=>`${(i/(data.length-1))*(W-40)+20},${H-((d.r/maxR)*(H-20))-10}`).join(" ")
  return(<svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:H,display:"block"}} preserveAspectRatio="none">
    {[0,.25,.5,.75,1].map(p=><line key={p} x1={20} y1={H-p*(H-20)-10} x2={W-20} y2={H-p*(H-20)-10} stroke="var(--border)" strokeWidth={0.5} strokeDasharray="4,4"/>)}
    <polyline points={ptE} fill="none" stroke="#f5a623" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"/>
    <polyline points={ptR} fill="none" stroke="#2dc653" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" strokeDasharray="6,3"/>
  </svg>)
}
function Heatmap({data}){
  const maxV=Math.max(...data.flatMap(r=>r.hours))
  return(<div style={{overflowX:"auto"}}>
    <div style={{display:"flex",gap:2,minWidth:600}}>
      <div style={{display:"flex",flexDirection:"column",gap:2,paddingTop:18}}>
        {data.map(r=><div key={r.day} style={{height:16,width:26,fontSize:9,color:"var(--text3)",display:"flex",alignItems:"center"}}>{r.day}</div>)}
      </div>
      <div>
        <div style={{display:"flex",gap:2,marginBottom:2}}>{Array.from({length:24},(_,h)=><div key={h} style={{width:16,fontSize:8,color:h%6===0?"var(--text3)":"transparent"}}>{h}h</div>)}</div>
        {data.map(r=><div key={r.day} style={{display:"flex",gap:2,marginBottom:2}}>{r.hours.map((v,h)=><div key={h} title={`${r.day} ${h}h — ${v}`} style={{width:16,height:16,borderRadius:2,background:`rgba(245,166,35,${0.08+(v/maxV)*0.92})`}}/>)}</div>)}
      </div>
    </div>
  </div>)
}

export default function Dashboard(){
  const {user}=useAuthStore()
  const {devise}=useDeviseStore()
  const {setPage}=usePageStore()
  const dc=devise?.code||"KMF"
  const [period,setPeriod]=useState("30d")
  const [txFilter,setTxFilter]=useState("Tout")
  const [chart,setChart]=useState(()=>genChart(30))
  const [heat]=useState(()=>genHeat())

  useEffect(()=>{
    const d=period==="7d"?7:period==="30d"?30:period==="90d"?90:365
    setChart(genChart(d))
  },[period])

  if(!user)return(<div style={{textAlign:"center",padding:80}}><div style={{fontSize:48,marginBottom:12}}>🔒</div><div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800,marginBottom:8}}>Connectez-vous pour accéder aux analytics</div><button onClick={()=>setPage("login")} style={{padding:"10px 24px",borderRadius:50,border:"none",background:"var(--gold)",color:"#000",fontSize:13,fontWeight:700,cursor:"pointer"}}>Se connecter</button></div>)

  const txFiltered=MOCK_TX.filter(t=>txFilter==="Tout"||t.label.toLowerCase().includes(txFilter.toLowerCase()))

  return(<div style={{paddingBottom:40}}>
    {/* HEADER */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
      <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800}}>📊 Analytics</div>
      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 14px",background:"var(--card)",border:"1px solid var(--border)",borderRadius:50,fontSize:12,color:"var(--text2)"}}>
          <span style={{width:8,height:8,borderRadius:"50%",background:"#2dc653",display:"inline-block",animation:"pulse 2s infinite"}}/>En direct
        </div>
        <div style={{display:"flex",background:"var(--card)",border:"1px solid var(--border)",borderRadius:50,overflow:"hidden"}}>
          {PERIODS.map(p=><button key={p.id} onClick={()=>setPeriod(p.id)} style={{padding:"6px 14px",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:period===p.id?"var(--gold)":"transparent",color:period===p.id?"#000":"var(--text2)"}}>{p.label}</button>)}
        </div>
      </div>
    </div>

    {/* KPI CARDS */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginBottom:20}}>
      {MOCK_KPI.map((k,i)=>{
        const spark=Array.from({length:12},()=>Math.random()*100)
        return(<div key={i} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:18,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.color}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <span style={{fontSize:22}}>{k.icon}</span>
            <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:50,background:`${k.color}22`,color:k.color}}>{k.delta}</span>
          </div>
          <div style={{fontFamily:"Space Mono,monospace",fontSize:24,fontWeight:700,color:k.color,marginBottom:4}}>{fmtK(k.value)}{k.suffix?` ${dc}`:""}</div>
          <div style={{fontSize:12,color:"var(--text3)",marginBottom:10}}>{k.label}</div>
          <Spark data={spark} color={k.color}/>
        </div>)
      })}
    </div>

    {/* CHART */}
    <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:20,marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:14}}>📈 Écoutes & Revenus</div>
        <div style={{display:"flex",gap:14,fontSize:11,color:"var(--text2)"}}>
          <span><span style={{display:"inline-block",width:10,height:3,background:"#f5a623",borderRadius:2,marginRight:5,verticalAlign:"middle"}}/>Écoutes</span>
          <span><span style={{display:"inline-block",width:10,height:3,background:"#2dc653",borderRadius:2,marginRight:5,verticalAlign:"middle"}}/>Revenus</span>
        </div>
      </div>
      <MainChart data={chart}/>
    </div>

    {/* GEO + TOP */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:20}}>
        <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:14,marginBottom:14}}>🌍 Audience par pays</div>
        {MOCK_GEO.map((g,i)=><div key={i} style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span>{g.pays}</span><strong style={{color:"#f5a623"}}>{g.pct}%</strong></div>
          <div style={{height:6,background:"var(--card2)",borderRadius:3,overflow:"hidden"}}><div style={{width:`${g.pct}%`,height:"100%",background:"linear-gradient(90deg,#f5a623,#e8920a)",borderRadius:3}}/></div>
        </div>)}
      </div>
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:20}}>
        <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:14,marginBottom:14}}>🔥 Top 5 sons</div>
        {MOCK_TOP.map((t,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<4?"1px solid var(--border)":"none"}}>
          <div style={{width:24,height:24,borderRadius:6,background:i===0?"var(--gold)":i===1?"rgba(245,166,35,.4)":"var(--card2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:i<2?"#000":"var(--text3)",flexShrink:0}}>{t.rank}</div>
          <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div><div style={{fontSize:11,color:"var(--text3)"}}>{t.plays.toLocaleString()} écoutes</div></div>
          <div style={{textAlign:"right",flexShrink:0}}><div style={{fontFamily:"Space Mono,monospace",fontSize:11,fontWeight:700,color:"#2dc653"}}>+{t.rev.toLocaleString()}</div><div style={{fontSize:12,color:t.trend==="↑"?"#2dc653":t.trend==="↓"?"#e63946":"var(--text3)"}}>{t.trend}</div></div>
        </div>)}
      </div>
    </div>

    {/* HEATMAP */}
    <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:20,marginBottom:16}}>
      <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:14,marginBottom:14}}>🕐 Heatmap écoutes par heure</div>
      <Heatmap data={heat}/>
      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:10,fontSize:10,color:"var(--text3)"}}>
        <span>Moins</span>{[0.08,0.3,0.55,0.8,1].map((a,i)=><div key={i} style={{width:12,height:12,borderRadius:2,background:`rgba(245,166,35,${a})`}}/>)}<span>Plus</span>
      </div>
    </div>

    {/* SOURCES REVENUS */}
    <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:20,marginBottom:16}}>
      <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:14,marginBottom:14}}>💚 Sources de revenus</div>
      {MOCK_REV.map((s,i)=><div key={i} style={{marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span>{s.label}</span><strong style={{color:s.color}}>{s.pct}%</strong></div>
        <div style={{height:6,background:"var(--card2)",borderRadius:3,overflow:"hidden"}}><div style={{width:`${s.pct}%`,height:"100%",background:s.color,borderRadius:3}}/></div>
      </div>)}
    </div>

    {/* TRANSACTIONS */}
    <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:16,marginBottom:12}}>📋 Transactions récentes</div>
    <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
      {["Tout","Streaming","Billets","Boutique","Pub"].map(f=><button key={f} onClick={()=>setTxFilter(f)} style={{padding:"6px 16px",borderRadius:50,border:txFilter===f?"none":"1px solid var(--border)",cursor:"pointer",fontSize:12,fontWeight:600,background:txFilter===f?"var(--gold)":"var(--card)",color:txFilter===f?"#000":"var(--text2)"}}>{f}</button>)}
    </div>
    <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden"}}>
      {txFiltered.map((t,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 20px",borderBottom:i<txFiltered.length-1?"1px solid var(--border)":"none",transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background="var(--card2)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <div style={{width:36,height:36,borderRadius:10,background:t.type==="credit"?"rgba(44,198,83,.12)":"rgba(230,57,70,.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{t.icon}</div>
        <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.label}</div><div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>{t.date}</div></div>
        <div style={{fontFamily:"Space Mono,monospace",fontSize:14,fontWeight:700,color:t.type==="credit"?"#2dc653":"#e63946",flexShrink:0}}>{t.amount} {dc}</div>
      </div>)}
    </div>
  </div>)
}
