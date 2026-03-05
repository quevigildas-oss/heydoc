<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<title>Dokita</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
<style>
:root{
  --bg:#0D1B2A;--bg2:#162232;--bg3:#1E2E40;--card:#1A2B3C;--border:#253D54;
  --accent:#00C896;--accent2:#4A9EFF;--warn:#F5A623;--danger:#FF4D4D;
  --text:#F0F6FF;--text2:#8BA8C4;--text3:#4A6A8A;--white:#FFFFFF;
  --grad:linear-gradient(135deg,#00C896,#4A9EFF);
  --sb:env(safe-area-inset-bottom,0px);--st:env(safe-area-inset-top,0px);
}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
html,body{height:100%;background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;overflow:hidden;}
#app{height:100%;position:relative;}

.screen{position:absolute;inset:0;display:none;flex-direction:column;overflow:hidden;background:var(--bg);}
.screen.on{display:flex;}

/* HDR */
.hdr{background:var(--bg2);border-bottom:1px solid var(--border);padding:12px 16px;padding-top:calc(12px + var(--st));display:flex;align-items:center;gap:12px;flex-shrink:0;}
.hdr-back{width:36px;height:36px;background:var(--bg3);border:1px solid var(--border);border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;color:var(--text2);}
.hdr-ico{width:36px;height:36px;background:var(--grad);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;}
.hdr-title{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:var(--text);}
.hdr-sub{font-size:11px;color:var(--text3);margin-top:1px;}

/* SCROLL BODY */
.sbody{flex:1;overflow-y:auto;padding:16px;}
.sbody::-webkit-scrollbar{display:none;}

/* ══ ACCUEIL ══ */
#accueilScreen{}
.hero{padding:36px 20px 28px;padding-top:calc(36px + var(--st));background:var(--bg2);border-bottom:1px solid var(--border);position:relative;overflow:hidden;}
.hero::before{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;background:radial-gradient(circle,rgba(0,200,150,.08),transparent 70%);}
.hero::after{content:'';position:absolute;left:-40px;bottom:-40px;width:180px;height:180px;background:radial-gradient(circle,rgba(74,158,255,.06),transparent 70%);}
.logo{font-family:'Syne',sans-serif;font-size:32px;font-weight:800;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-1px;}
.logo-tag{font-size:12px;color:var(--text2);margin-top:3px;}
.hero-badges{display:flex;gap:6px;flex-wrap:wrap;margin-top:14px;}
.hbadge{display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:20px;padding:4px 10px;font-size:10px;color:var(--text2);}

.acc-sections{padding:20px 16px;flex:1;overflow-y:auto;}
.sec-lbl{font-family:'Syne',sans-serif;font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;}

.space-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;margin-bottom:10px;display:flex;align-items:center;gap:14px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;}
.space-card::before{content:'';position:absolute;inset:0;opacity:0;transition:opacity .2s;}
.space-card:active{transform:scale(.98);}
.space-card:active::before{opacity:1;}
.sc-ico{width:46px;height:46px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:21px;flex-shrink:0;}
.sc-title{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:var(--text);margin-bottom:3px;}
.sc-desc{font-size:11.5px;color:var(--text2);line-height:1.4;}
.sc-tags{display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;}
.sc-tag{background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:6px;padding:2px 7px;font-size:9px;color:var(--text3);}
.sc-arr{font-size:20px;color:var(--text3);flex-shrink:0;margin-left:auto;}

/* Colors per space */
.sc-patient .sc-ico{background:rgba(0,200,150,.12);}
.sc-patient{border-left:3px solid var(--accent);}
.sc-medecin .sc-ico{background:rgba(74,158,255,.12);}
.sc-medecin{border-left:3px solid var(--accent2);}
.sc-clinique .sc-ico{background:rgba(245,166,35,.12);}
.sc-clinique{border-left:3px solid var(--warn);}
.sc-labo .sc-ico{background:rgba(180,100,255,.12);}
.sc-labo{border-left:3px solid #B464FF;}
.sc-pharma .sc-ico{background:rgba(255,77,77,.12);}
.sc-pharma{border-left:3px solid var(--danger);}

.disc{background:rgba(245,166,35,.06);border:1px solid rgba(245,166,35,.2);border-radius:12px;padding:12px;display:flex;gap:8px;margin-top:4px;}
.disc p{font-size:11px;color:var(--text2);line-height:1.5;}

/* ══ FORMS ══ */
.form-body{flex:1;overflow-y:auto;padding:20px 16px;padding-bottom:calc(20px + var(--sb));}
.form-body::-webkit-scrollbar{display:none;}
.field{margin-bottom:13px;}
.flabel{font-size:10px;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:.8px;margin-bottom:7px;display:block;}
.finput{width:100%;background:var(--bg3);border:1px solid var(--border);border-radius:11px;padding:12px 14px;font-family:'DM Sans',sans-serif;font-size:14px;color:var(--text);outline:none;transition:border-color .2s;}
.finput:focus{border-color:var(--accent);}
.finput::placeholder{color:var(--text3);}
select.finput{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%234A6A8A' d='M5 7L0 2h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;background-color:var(--bg3);}
select.finput option{background:var(--bg3);}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.sex-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.sex-btn{background:var(--bg3);border:1px solid var(--border);border-radius:11px;padding:11px;font-family:'Syne',sans-serif;font-size:12px;font-weight:600;color:var(--text2);cursor:pointer;text-align:center;transition:all .2s;}
.sex-btn.on{background:rgba(0,200,150,.1);border-color:var(--accent);color:var(--accent);}
.btn-p{width:100%;background:var(--grad);border:none;border-radius:12px;padding:14px;font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:#fff;cursor:pointer;margin-top:6px;transition:opacity .2s;}
.btn-p:active{opacity:.85;}
.btn-s{width:100%;background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:12px;font-family:'Syne',sans-serif;font-size:13px;font-weight:600;color:var(--text2);cursor:pointer;margin-top:8px;}
.ferr{font-size:12px;color:var(--danger);margin-top:8px;display:none;}
.ferr.on{display:block;}
.form-intro{text-align:center;padding:8px 0 20px;}
.form-ico{width:56px;height:56px;background:var(--grad);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 12px;}
.form-title{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:var(--text);margin-bottom:6px;}
.form-desc{font-size:12px;color:var(--text2);line-height:1.6;}

/* ══ PROFILS ══ */
.profil-list{flex:1;overflow-y:auto;padding:14px 16px;}
.profil-list::-webkit-scrollbar{display:none;}
.add-btn{background:var(--card);border:1px dashed var(--border);border-radius:14px;padding:14px;margin-bottom:10px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:border-color .2s;}
.add-btn:active{border-color:var(--accent);}
.add-ico{width:42px;height:42px;border-radius:12px;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--text3);flex-shrink:0;}
.add-label{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:var(--text2);}
.add-sub{font-size:11px;color:var(--text3);}
.p-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:10px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:all .2s;}
.p-card:active{transform:scale(.98);}
.p-card.sel{border-color:var(--accent);}
.p-av{width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:17px;font-weight:800;color:#fff;flex-shrink:0;}
.p-nom{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:var(--text);}
.p-info{font-size:11px;color:var(--text2);margin-top:2px;}
.p-acts{margin-left:auto;display:flex;gap:6px;}
.p-act{width:30px;height:30px;border-radius:8px;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;}
.p-act.edit{background:rgba(74,158,255,.1);color:var(--accent2);}
.p-act.del{background:rgba(255,77,77,.1);color:var(--danger);}
.consult-footer{background:var(--bg2);border-top:1px solid var(--border);padding:12px 16px;padding-bottom:calc(12px + var(--sb));display:flex;gap:10px;flex-shrink:0;}
.btn-eph{flex:none;background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:12px 14px;font-family:'Syne',sans-serif;font-size:12px;font-weight:600;color:var(--text2);cursor:pointer;white-space:nowrap;}
.btn-consult{flex:1;background:var(--grad);border:none;border-radius:12px;padding:13px;font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:#fff;cursor:pointer;}
.btn-consult:disabled{opacity:.4;cursor:not-allowed;}

/* ══ CHAT ══ */
.chat-profil{background:var(--bg2);border-bottom:1px solid var(--border);padding:10px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0;}
.cp-av{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:12px;font-weight:800;color:#fff;}
.cp-nom{font-size:12px;font-weight:600;color:var(--text);}
.cp-info{font-size:10px;color:var(--text3);}
.msgs{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:10px;}
.msgs::-webkit-scrollbar{display:none;}
.msg{max-width:86%;animation:mIn .2s ease;}
.msg.user{align-self:flex-end;}
.msg.ai{align-self:flex-start;}
.msg-b{padding:10px 14px;border-radius:16px;font-size:13px;line-height:1.6;}
.msg.user .msg-b{background:var(--grad);color:#fff;border-bottom-right-radius:4px;}
.msg.ai .msg-b{background:var(--card);color:var(--text);border-bottom-left-radius:4px;border:1px solid var(--border);}
.msg-t{font-size:10px;color:var(--text3);margin-top:3px;}
.msg.user .msg-t{text-align:right;}
@keyframes mIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
.typing-d{display:flex;gap:4px;padding:10px 14px;background:var(--card);border-radius:16px;border-bottom-left-radius:4px;border:1px solid var(--border);}
.typing-d span{width:6px;height:6px;background:var(--text3);border-radius:50%;animation:td 1.2s infinite;}
.typing-d span:nth-child(2){animation-delay:.2s;}.typing-d span:nth-child(3){animation-delay:.4s;}
@keyframes td{0%,100%{transform:translateY(0);opacity:.4;}50%{transform:translateY(-5px);opacity:1;}}
.reco-box{background:var(--bg2);border-top:1px solid var(--border);padding:12px 16px;flex-shrink:0;}
.reco-lbl{font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:var(--text);margin-bottom:8px;}
.reco-scroll{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px;}
.reco-scroll::-webkit-scrollbar{display:none;}
.r-card{background:var(--card);border:1px solid var(--border);border-radius:13px;padding:11px;min-width:170px;flex-shrink:0;}
.r-card.best{border-color:var(--accent);}
.r-nom{font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--text);margin-bottom:2px;}
.r-spec{font-size:10px;color:var(--text2);margin-bottom:7px;}
.r-btns{display:flex;gap:5px;}
.rb{flex:1;border:none;border-radius:8px;padding:6px 5px;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;cursor:pointer;}
.rb.call{background:var(--grad);color:#fff;}
.rb.dos{background:var(--bg3);border:1px solid var(--border);color:var(--text2);}
.inp-wrap{background:var(--bg2);border-top:1px solid var(--border);padding:10px 12px;padding-bottom:calc(10px + var(--sb));display:flex;gap:8px;align-items:flex-end;flex-shrink:0;}
.chat-inp{flex:1;background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:10px 13px;font-family:'DM Sans',sans-serif;font-size:14px;color:var(--text);outline:none;resize:none;max-height:90px;transition:border-color .2s;line-height:1.5;}
.chat-inp:focus{border-color:var(--accent);}
.chat-inp::placeholder{color:var(--text3);}
.send-btn{width:40px;height:40px;background:var(--grad);border:none;border-radius:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}
.send-btn:active{opacity:.8;}
.send-btn svg{width:17px;height:17px;fill:#fff;}

/* ══ ESPACES COMING SOON ══ */
.coming-body{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;text-align:center;}
.coming-ico{font-size:52px;margin-bottom:16px;}
.coming-title{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:var(--text);margin-bottom:8px;}
.coming-desc{font-size:13px;color:var(--text2);line-height:1.7;max-width:280px;}
.coming-features{margin-top:24px;width:100%;max-width:320px;}
.feat{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:13px 16px;margin-bottom:8px;display:flex;align-items:center;gap:12px;text-align:left;}
.feat-ico{font-size:18px;flex-shrink:0;}
.feat-txt{font-size:12px;color:var(--text2);line-height:1.4;}
.feat-title{font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--text);margin-bottom:2px;}
.soon-badge{display:inline-flex;align-items:center;gap:5px;border-radius:20px;padding:5px 12px;font-size:11px;font-weight:600;margin-top:20px;}

/* ══ GÉOLOC ══ */
.geo-section{padding:16px;}
.geo-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:10px;}
.geo-nom{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:var(--text);margin-bottom:3px;}
.geo-addr{font-size:11px;color:var(--text2);margin-bottom:8px;}
.geo-badges{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;}
.geo-badge{background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:6px;padding:2px 8px;font-size:10px;color:var(--text2);}
.geo-badge.open{background:rgba(0,200,150,.1);border-color:var(--accent);color:var(--accent);}
.geo-dist{font-size:10px;color:var(--accent);margin-bottom:8px;}
.geo-btn{background:var(--grad);border:none;border-radius:9px;padding:8px 14px;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:#fff;cursor:pointer;margin-right:6px;}
.geo-search{background:var(--bg3);border:1px solid var(--border);border-radius:11px;padding:11px 14px;font-family:'DM Sans',sans-serif;font-size:14px;color:var(--text);outline:none;width:100%;margin-bottom:14px;}
.geo-search::placeholder{color:var(--text3);}
.geo-search:focus{border-color:var(--accent);}
.no-geo{text-align:center;padding:32px 16px;color:var(--text3);font-size:13px;}

/* ══ TOAST ══ */
.toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,.1);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:9px 16px;font-size:12px;color:#fff;z-index:999;white-space:nowrap;}

/* Avatar colors */
.av0{background:#2E86C1;}.av1{background:#00875A;}.av2{background:#8E44AD;}.av3{background:#E67E22;}.av4{background:#E74C3C;}.av5{background:#16A085;}.av6{background:#2C3E50;}.av7{background:#D35400;}
</style>
</head>
<body>
<div id="app">

<!-- ══ ACCUEIL ══ -->
<div class="screen on" id="accueilScreen">
  <div class="hero">
    <div class="logo">Dokita</div>
    <div class="logo-tag">Plateforme médicale • Afrique & Maladies tropicales</div>
    <div class="hero-badges">
      <div class="hbadge">🌍 Afrique</div>
      <div class="hbadge">📋 OMS</div>
      <div class="hbadge">🤖 IA Médicale</div>
    </div>
  </div>
  <div class="acc-sections">
    <div class="sec-lbl">Sélectionnez votre profil</div>
    <div class="space-card sc-patient" onclick="goPatient()">
      <div class="sc-ico">👥</div>
      <div style="flex:1">
        <div class="sc-title">Patient</div>
        <div class="sc-desc">Consultez un médecin IA, décrivez vos symptômes</div>
        <div class="sc-tags"><span class="sc-tag">Profils famille</span><span class="sc-tag">Diagnostic IA</span><span class="sc-tag">Éphémère</span></div>
      </div>
      <div class="sc-arr">›</div>
    </div>
    <div class="space-card sc-medecin" onclick="goMedecin()">
      <div class="sc-ico">🩺</div>
      <div style="flex:1">
        <div class="sc-title">Médecin</div>
        <div class="sc-desc">Dossiers patients, validation prescriptions IA</div>
        <div class="sc-tags"><span class="sc-tag">Référent</span><span class="sc-tag">Note</span><span class="sc-tag">Tarif</span></div>
      </div>
      <div class="sc-arr">›</div>
    </div>
    <div class="space-card sc-clinique" onclick="goClinique()">
      <div class="sc-ico">🏥</div>
      <div style="flex:1">
        <div class="sc-title">Clinique / Hôpital</div>
        <div class="sc-desc">Trouver un établissement, services disponibles</div>
        <div class="sc-tags"><span class="sc-tag">Géolocalisation</span><span class="sc-tag">Services</span><span class="sc-tag">Urgences</span></div>
      </div>
      <div class="sc-arr">›</div>
    </div>
    <div class="space-card sc-labo" onclick="goLabo()">
      <div class="sc-ico">🔬</div>
      <div style="flex:1">
        <div class="sc-title">Laboratoire</div>
        <div class="sc-desc">Analyses biologiques, résultats et interprétation</div>
        <div class="sc-tags"><span class="sc-tag">Géolocalisation</span><span class="sc-tag">Résultats</span><span class="sc-tag">IA</span></div>
      </div>
      <div class="sc-arr">›</div>
    </div>
    <div class="space-card sc-pharma" onclick="goPharma()">
      <div class="sc-ico">💊</div>
      <div style="flex:1">
        <div class="sc-title">Pharmacie</div>
        <div class="sc-desc">Prescriptions, médicaments, livraison</div>
        <div class="sc-tags"><span class="sc-tag">Géolocalisation</span><span class="sc-tag">Prescriptions</span><span class="sc-tag">Stock</span></div>
      </div>
      <div class="sc-arr">›</div>
    </div>
    <div class="disc"><span>⚠️</span><p>Dokita est un outil d'aide à la décision médicale. Il ne remplace pas une consultation professionnelle.</p></div>
  </div>
</div>

<!-- ══ SETUP CLÉ ══ -->
<div class="screen" id="setupScreen">
  <div class="hdr"><div class="hdr-back" onclick="nav('accueilScreen')">←</div><div style="flex:1"><div class="hdr-title">Configuration</div></div></div>
  <div class="form-body">
    <div class="form-intro">
      <div class="form-ico">🔑</div>
      <div class="form-title">Première connexion</div>
      <div class="form-desc">Entrez votre clé d'accès Dokita pour activer l'assistant médical IA.</div>
    </div>
    <div class="field"><label class="flabel">Clé d'accès Dokita</label><input class="finput" id="apiK" type="password" placeholder="Votre clé..."/></div>
    <div class="field"><label class="flabel">Email (optionnel)</label><input class="finput" id="emailU" type="email" placeholder="vous@email.com"/></div>
    <div class="ferr" id="setupErr">Clé invalide — vérifiez et réessayez</div>
    <button class="btn-p" onclick="saveSetup()">Continuer →</button>
  </div>
</div>

<!-- ══ PROFILS ══ -->
<div class="screen" id="profilsScreen">
  <div class="hdr"><div class="hdr-back" onclick="nav('accueilScreen')">←</div><div class="hdr-ico">👤</div><div style="flex:1"><div class="hdr-title">Mes profils</div><div class="hdr-sub">Sélectionnez pour consulter</div></div></div>
  <div class="profil-list" id="profilList"></div>
  <div class="consult-footer">
    <button class="btn-eph" onclick="nav('ephemereScreen')">⚡ Éphémère</button>
    <button class="btn-consult" id="btnConsult" disabled onclick="lancerConsult()">Consulter →</button>
  </div>
</div>

<!-- ══ AJOUT PROFIL ══ -->
<div class="screen" id="addProfilScreen">
  <div class="hdr"><div class="hdr-back" onclick="nav('profilsScreen')">←</div><div class="hdr-ico">✏️</div><div style="flex:1"><div class="hdr-title" id="addTitle">Nouveau profil</div></div></div>
  <div class="form-body">
    <div class="two-col">
      <div class="field"><label class="flabel">Prénom *</label><input class="finput" id="fPrenom" placeholder="Prénom" autocomplete="off"/></div>
      <div class="field"><label class="flabel">Nom *</label><input class="finput" id="fNom" placeholder="Nom" autocomplete="off"/></div>
    </div>
    <div class="field"><label class="flabel">Date de naissance *</label><input class="finput" id="fNaiss" type="date"/></div>
    <div class="field"><label class="flabel">Sexe</label>
      <div class="sex-row"><div class="sex-btn" id="sxH" onclick="setSx('H')">👨 Masculin</div><div class="sex-btn" id="sxF" onclick="setSx('F')">👩 Féminin</div></div>
    </div>
    <div class="two-col">
      <div class="field"><label class="flabel">Taille (cm)</label><input class="finput" id="fTaille" type="number" placeholder="170" min="30" max="250"/></div>
      <div class="field"><label class="flabel">Poids (kg)</label><input class="finput" id="fPoids" type="number" placeholder="70" min="2" max="300"/></div>
    </div>
    <div class="field"><label class="flabel">Téléphone</label><input class="finput" id="fTel" type="tel" placeholder="+225 07 00 00 00"/></div>
    <div class="field"><label class="flabel">Lien familial</label>
      <select class="finput" id="fLien">
        <option value="moi">Moi-même</option><option value="enfant">Mon enfant</option>
        <option value="conjoint">Mon conjoint(e)</option><option value="parent">Mon parent</option><option value="autre">Autre membre</option>
      </select>
    </div>
    <div class="ferr" id="addErr">Prénom, nom et date de naissance requis</div>
    <button class="btn-p" onclick="saveProfil()">Enregistrer</button>
    <button class="btn-s" onclick="nav('profilsScreen')">Annuler</button>
  </div>
</div>

<!-- ══ ÉPHÉMÈRE ══ -->
<div class="screen" id="ephemereScreen">
  <div class="hdr"><div class="hdr-back" onclick="nav('profilsScreen')">←</div><div class="hdr-ico">⚡</div><div style="flex:1"><div class="hdr-title">Consultation éphémère</div><div class="hdr-sub">Sans enregistrement</div></div></div>
  <div class="form-body">
    <div class="form-intro" style="padding-top:0">
      <div class="form-desc">Infos de base pour que l'IA vous aide. Ces données ne sont pas sauvegardées.</div>
    </div>
    <div class="field"><label class="flabel">Prénom *</label><input class="finput" id="ePrenom" placeholder="Votre prénom" autocomplete="off"/></div>
    <div class="two-col">
      <div class="field"><label class="flabel">Âge *</label><input class="finput" id="eAge" type="number" placeholder="30" min="0" max="120"/></div>
      <div class="field"><label class="flabel">Poids (kg)</label><input class="finput" id="ePoids" type="number" placeholder="70"/></div>
    </div>
    <div class="field"><label class="flabel">Sexe</label>
      <div class="sex-row"><div class="sex-btn" id="esxH" onclick="setESx('H')">👨 Masculin</div><div class="sex-btn" id="esxF" onclick="setESx('F')">👩 Féminin</div></div>
    </div>
    <div class="ferr" id="ephErr">Prénom et âge requis</div>
    <button class="btn-p" onclick="lancerEph()">Démarrer →</button>
  </div>
</div>

<!-- ══ CHAT ══ -->
<div class="screen" id="chatScreen">
  <div class="hdr"><div class="hdr-back" onclick="nav('profilsScreen')">←</div><div class="hdr-ico">🤖</div><div style="flex:1"><div class="hdr-title">Dokita IA</div><div class="hdr-sub" id="chatSub">Assistant médical</div></div></div>
  <div class="chat-profil" id="chatPBar" style="display:none;">
    <div class="cp-av" id="chatPAv"></div>
    <div><div class="cp-nom" id="chatPNom"></div><div class="cp-info" id="chatPInfo"></div></div>
  </div>
  <div class="msgs" id="msgsList"></div>
  <div class="reco-box" id="recoBox" style="display:none;">
    <div class="reco-lbl">🏥 Médecins recommandés</div>
    <div class="reco-scroll" id="recoScroll"></div>
  </div>
  <div class="inp-wrap">
    <textarea class="chat-inp" id="chatInp" placeholder="Décrivez vos symptômes..." rows="1" onkeydown="onKey(event)" oninput="autoH(this)"></textarea>
    <button class="send-btn" onclick="sendMsg()">
      <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
    </button>
  </div>
</div>

<!-- ══ CLINIQUE / HÔPITAL ══ -->
<div class="screen" id="cliniqueScreen">
  <div class="hdr"><div class="hdr-back" onclick="nav('accueilScreen')">←</div><div class="hdr-ico">🏥</div><div style="flex:1"><div class="hdr-title">Cliniques & Hôpitaux</div><div class="hdr-sub" id="cliniqueSubtitle">Recherche en cours...</div></div></div>
  <div class="sbody">
    <input class="geo-search" id="cliniqueSearch" placeholder="Rechercher un établissement..." oninput="filterGeo('clinique',this.value)"/>
    <div id="cliniqueList"><div class="no-geo">📍 Activation de la géolocalisation...</div></div>
  </div>
</div>

<!-- ══ LABORATOIRE ══ -->
<div class="screen" id="laboScreen">
  <div class="hdr"><div class="hdr-back" onclick="nav('accueilScreen')">←</div><div class="hdr-ico">🔬</div><div style="flex:1"><div class="hdr-title">Laboratoires</div><div class="hdr-sub" id="laboSubtitle">Recherche en cours...</div></div></div>
  <div class="sbody">
    <input class="geo-search" id="laboSearch" placeholder="Rechercher un laboratoire..." oninput="filterGeo('labo',this.value)"/>
    <div id="laboList"><div class="no-geo">📍 Activation de la géolocalisation...</div></div>
    <div id="laboResultats" style="display:none;">
      <div class="sec-lbl" style="margin-top:8px;">Résultats d'analyse</div>
      <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;text-align:center;color:var(--text3);font-size:13px;">
        🔒 Connexion au portail laboratoire requise<br>
        <span style="font-size:11px;margin-top:4px;display:block;">Fonctionnalité disponible prochainement</span>
      </div>
    </div>
  </div>
</div>

<!-- ══ PHARMACIE ══ -->
<div class="screen" id="pharmacieScreen">
  <div class="hdr"><div class="hdr-back" onclick="nav('accueilScreen')">←</div><div class="hdr-ico">💊</div><div style="flex:1"><div class="hdr-title">Pharmacies</div><div class="hdr-sub" id="pharmacieSubtitle">Recherche en cours...</div></div></div>
  <div class="sbody">
    <input class="geo-search" id="pharmacieSearch" placeholder="Rechercher une pharmacie..." oninput="filterGeo('pharmacie',this.value)"/>
    <div id="pharmacieList"><div class="no-geo">📍 Activation de la géolocalisation...</div></div>
  </div>
</div>

</div><!-- /app -->

<script>
// ══════════════════════════════
// CONFIG
// ══════════════════════════════
var RG='d7b62b',RP='428dc1d8-2fa4-46da-b226-c26a52653ed0',RA='7d26fda3-fe2d-405c-8aed-645df10baa12';
var TURL='https://api-'+RG+'.stack.tryrelevance.com/latest/agents/trigger';
var MAKE_WEBHOOK='https://hook.eu1.make.com/dvv6uq6w32qreff3h2g0dy00jeksnjxz';

// ══════════════════════════════
// STATE
// ══════════════════════════════
var KEY='',CID=null,msgs=[],BEST_MED=null,NOTION_MEDS=[],MEDS_LOADED=false;
var PROFILS=[],SEL=-1,CURRENT=null,SX='',ESX='',EDIT_I=-1;
var USER_LAT=null,USER_LNG=null;
var GEO_DATA={clinique:[],labo:[],pharmacie:[]};

try{KEY=localStorage.getItem('hdk')||'';}catch(e){}
try{var _p=localStorage.getItem('hd_profils');if(_p)PROFILS=JSON.parse(_p);}catch(e){}

// ══════════════════════════════
// NAV
// ══════════════════════════════
function nav(id){
  document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('on');});
  document.getElementById(id).classList.add('on');
}

// ══════════════════════════════
// ACCUEIL
// ══════════════════════════════
function goPatient(){if(!KEY){nav('setupScreen');return;}renderProfils();nav('profilsScreen');}
function goMedecin(){window.open('https://heydoc-medecin.vercel.app','_blank');}
function goClinique(){nav('cliniqueScreen');loadGeo('clinique');}
function goLabo(){nav('laboScreen');loadGeo('labo');}
function goPharma(){nav('pharmacieScreen');loadGeo('pharmacie');}

// ══════════════════════════════
// GÉOLOCALISATION
// ══════════════════════════════
var GEO_TYPES={
  clinique:{query:'hôpital clinique',label:'cliniques et hôpitaux',subtitle:'cliniqueSubtitle',list:'cliniqueList'},
  labo:{query:'laboratoire analyse biologique',label:'laboratoires',subtitle:'laboSubtitle',list:'laboList'},
  pharmacie:{query:'pharmacie',label:'pharmacies',subtitle:'pharmacieSubtitle',list:'pharmacieList'}
};

function loadGeo(type){
  var cfg=GEO_TYPES[type];
  if(USER_LAT){renderGeo(type,GEO_DATA[type]);return;}
  if(!navigator.geolocation){
    document.getElementById(cfg.list).innerHTML='<div class="no-geo">⚠️ Géolocalisation non disponible sur cet appareil</div>';
    document.getElementById(cfg.subtitle).textContent='Géolocalisation indisponible';
    return;
  }
  navigator.geolocation.getCurrentPosition(
    function(pos){
      USER_LAT=pos.coords.latitude;USER_LNG=pos.coords.longitude;
      document.getElementById(cfg.subtitle).textContent='Chargement des '+cfg.label+'...';
      fetchNearby(type,USER_LAT,USER_LNG);
    },
    function(){
      document.getElementById(cfg.list).innerHTML='<div class="no-geo">⚠️ Accès à la position refusé.<br>Activez la géolocalisation et réessayez.</div>';
      document.getElementById(cfg.subtitle).textContent='Position non disponible';
    },
    {timeout:10000}
  );
}

async function fetchNearby(type,lat,lng){
  var cfg=GEO_TYPES[type];
  // Google Places API via proxy — simulé avec données réalistes pour la démo
  // En production: remplacer par appel Google Places API
  var mockData=getMockData(type,lat,lng);
  GEO_DATA[type]=mockData;
  renderGeo(type,mockData);
}

function getMockData(type,lat,lng){
  var base=[
    {nom:'Centre Médical Plateau',addr:'Rue des Jardins, Plateau, Abidjan',dist:'0.8 km',open:true,tel:'+225 27 20 31 10 00',services:['Urgences','Consultation','Chirurgie']},
    {nom:'Polyclinique Internationale',addr:'Boulevard de Marseille, Marcory',dist:'2.1 km',open:true,tel:'+225 27 21 35 00 00',services:['Cardiologie','Pédiatrie','Gynécologie']},
    {nom:'Hôpital Général de Cocody',addr:'Avenue Christiane Tobie Boni, Cocody',dist:'3.4 km',open:true,tel:'+225 27 22 44 67 00',services:['Urgences 24h','Bloc opératoire','Réanimation']},
    {nom:'Clinique Biétry',addr:'Zone 4, Biétry, Abidjan',dist:'4.2 km',open:false,tel:'+225 27 21 25 44 00',services:['Médecine générale','Gynécologie']}
  ];
  var labo=[
    {nom:'BioLab Plateau',addr:'Immeuble Alpha 2000, Plateau',dist:'0.5 km',open:true,tel:'+225 27 20 22 45 00',services:['NFS','Sérologie','Biochimie']},
    {nom:'Laboratoire Pasteur CI',addr:'Rue Lecoeur, Cocody',dist:'1.8 km',open:true,tel:'+225 27 22 41 20 00',services:['Microbiologie','Hématologie','Parasitologie']},
    {nom:'LabExpress Marcory',addr:'Boulevard VGE, Marcory',dist:'2.9 km',open:true,tel:'+225 27 21 36 89 00',services:['Résultats en 2h','Prélèvement à domicile']}
  ];
  var pharma=[
    {nom:'Pharmacie du Plateau',addr:'Avenue Noguès, Plateau',dist:'0.3 km',open:true,tel:'+225 27 20 21 00 12',services:['Médicaments génériques','Ordonnances','Garde']},
    {nom:'Pharmacie de la Paix',addr:'Rue des Combattants, Adjamé',dist:'1.6 km',open:true,tel:'+225 27 20 37 45 00',services:['Parapharmacie','Livraison']},
    {nom:'Pharmacie Bonheur',addr:'Cocody Deux Plateaux, Abidjan',dist:'3.1 km',open:false,tel:'+225 27 22 41 50 00',services:['Médicaments tropicaux','Vaccins']}
  ];
  if(type==='labo')return labo;
  if(type==='pharmacie')return pharma;
  return base;
}

function renderGeo(type,data){
  var cfg=GEO_TYPES[type];
  document.getElementById(cfg.subtitle).textContent=data.length+' '+cfg.label+' trouvés';
  if(!data.length){
    document.getElementById(cfg.list).innerHTML='<div class="no-geo">Aucun établissement trouvé près de vous</div>';
    return;
  }
  var html='';
  data.forEach(function(d){
    html+='<div class="geo-card">'+
      '<div class="geo-nom">'+d.nom+'</div>'+
      '<div class="geo-addr">📍 '+d.addr+'</div>'+
      '<div class="geo-badges">'+
        '<span class="geo-badge'+(d.open?' open':'')+'">'+( d.open?'✓ Ouvert':'✗ Fermé')+'</span>'+
        (d.dist?'<span class="geo-badge">📏 '+d.dist+'</span>':'')+
        d.services.slice(0,2).map(function(s){return '<span class="geo-badge">'+s+'</span>';}).join('')+
      '</div>'+
      (d.tel?'<button class="geo-btn" onclick="window.location.href=\'tel:'+d.tel+'\'">📞 Appeler</button>':'')+
      '<button class="geo-btn" style="background:var(--bg3);border:1px solid var(--border);color:var(--text2);" onclick="openMaps(\''+d.nom+'\')">🗺 Itinéraire</button>'+
    '</div>';
  });
  document.getElementById(cfg.list).innerHTML=html;
}

function filterGeo(type,query){
  var cfg=GEO_TYPES[type];
  var q=query.toLowerCase();
  var filtered=GEO_DATA[type].filter(function(d){
    return d.nom.toLowerCase().indexOf(q)>=0||d.addr.toLowerCase().indexOf(q)>=0||
      d.services.some(function(s){return s.toLowerCase().indexOf(q)>=0;});
  });
  renderGeo(type,filtered);
}

function openMaps(nom){
  var q=encodeURIComponent(nom);
  if(USER_LAT)window.open('https://www.google.com/maps/search/'+q+'/@'+USER_LAT+','+USER_LNG+',14z','_blank');
  else window.open('https://www.google.com/maps/search/'+q,'_blank');
}

// ══════════════════════════════
// SETUP
// ══════════════════════════════
function saveSetup(){
  var k=(document.getElementById('apiK').value||'').trim();
  if(!k||k.length<10){document.getElementById('setupErr').classList.add('on');return;}
  KEY=k;try{localStorage.setItem('hdk',k);}catch(e){}
  var em=(document.getElementById('emailU').value||'').trim();
  if(em)try{localStorage.setItem('hdkemail',em);}catch(e){}
  document.getElementById('setupErr').classList.remove('on');
  renderProfils();nav('profilsScreen');
}

// ══════════════════════════════
// PROFILS
// ══════════════════════════════
var AVC=['av0','av1','av2','av3','av4','av5','av6','av7'];
var LIENS={moi:'Moi-même',enfant:'Enfant',conjoint:'Conjoint(e)',parent:'Parent',autre:'Famille'};

function calcAge(naiss){
  if(!naiss)return null;
  var d=new Date(naiss),n=new Date();
  var a=n.getFullYear()-d.getFullYear();
  if(n.getMonth()<d.getMonth()||(n.getMonth()===d.getMonth()&&n.getDate()<d.getDate()))a--;
  return a;
}

function saveProfils(){try{localStorage.setItem('hd_profils',JSON.stringify(PROFILS));}catch(e){}}

function renderProfils(){
  var el=document.getElementById('profilList');
  var h='<div class="add-btn" onclick="openAdd(-1)">'+
    '<div class="add-ico">＋</div>'+
    '<div><div class="add-label">Ajouter un profil</div><div class="add-sub">Moi-même ou un membre de la famille</div></div>'+
  '</div>';
  if(!PROFILS.length){
    h+='<div style="text-align:center;padding:32px 16px;color:var(--text3);font-size:13px;">Aucun profil — ajoutez le vôtre ci-dessus<br>ou utilisez la consultation éphémère.</div>';
  } else {
    PROFILS.forEach(function(p,i){
      var a=calcAge(p.naiss);
      h+='<div class="p-card'+(SEL===i?' sel':'')+'" onclick="selP('+i+')">'+
        '<div class="p-av '+AVC[i%8]+'">'+p.prenom.charAt(0).toUpperCase()+'</div>'+
        '<div style="flex:1">'+
          '<div class="p-nom">'+p.prenom+' '+p.nom+'</div>'+
          '<div class="p-info">'+(a!==null?a+' ans':'')+
          (p.sx?' · '+(p.sx==='H'?'M':'F'):'')+
          (p.poids?' · '+p.poids+'kg':'')+
          (p.lien&&p.lien!=='moi'?' · '+(LIENS[p.lien]||''):'')+
          '</div>'+
        '</div>'+
        '<div class="p-acts">'+
          '<button class="p-act edit" onclick="event.stopPropagation();openAdd('+i+')">✏️</button>'+
          '<button class="p-act del" onclick="event.stopPropagation();delP('+i+')">🗑</button>'+
        '</div>'+
      '</div>';
    });
  }
  el.innerHTML=h;
  var btn=document.getElementById('btnConsult');
  btn.disabled=SEL<0;
}

function selP(i){SEL=i;renderProfils();}
function delP(i){
  if(!confirm('Supprimer ce profil ?'))return;
  PROFILS.splice(i,1);
  if(SEL===i)SEL=-1;else if(SEL>i)SEL--;
  saveProfils();renderProfils();
}

function setSx(s){SX=s;document.getElementById('sxH').classList.toggle('on',s==='H');document.getElementById('sxF').classList.toggle('on',s==='F');}
function setESx(s){ESX=s;document.getElementById('esxH').classList.toggle('on',s==='H');document.getElementById('esxF').classList.toggle('on',s==='F');}

function openAdd(idx){
  EDIT_I=idx;SX='';
  document.getElementById('addTitle').textContent=idx>=0?'Modifier le profil':'Nouveau profil';
  ['fPrenom','fNom','fNaiss','fTaille','fPoids','fTel'].forEach(function(id){document.getElementById(id).value='';});
  document.getElementById('fLien').value='moi';
  document.getElementById('sxH').classList.remove('on');
  document.getElementById('sxF').classList.remove('on');
  document.getElementById('addErr').classList.remove('on');
  if(idx>=0){
    var p=PROFILS[idx];
    document.getElementById('fPrenom').value=p.prenom||'';
    document.getElementById('fNom').value=p.nom||'';
    document.getElementById('fNaiss').value=p.naiss||'';
    document.getElementById('fTaille').value=p.taille||'';
    document.getElementById('fPoids').value=p.poids||'';
    document.getElementById('fTel').value=p.tel||'';
    document.getElementById('fLien').value=p.lien||'moi';
    if(p.sx)setSx(p.sx);
  }
  nav('addProfilScreen');
}

function saveProfil(){
  var pr=(document.getElementById('fPrenom').value||'').trim();
  var no=(document.getElementById('fNom').value||'').trim();
  var na=document.getElementById('fNaiss').value||'';
  if(!pr||!no||!na){document.getElementById('addErr').classList.add('on');return;}
  document.getElementById('addErr').classList.remove('on');
  var p={prenom:pr,nom:no,naiss:na,sx:SX,
    taille:document.getElementById('fTaille').value||'',
    poids:document.getElementById('fPoids').value||'',
    tel:document.getElementById('fTel').value||'',
    lien:document.getElementById('fLien').value||'moi'};
  if(EDIT_I>=0)PROFILS[EDIT_I]=p;else PROFILS.push(p);
  SEL=EDIT_I>=0?EDIT_I:PROFILS.length-1;
  saveProfils();renderProfils();
  nav('profilsScreen');toast('✅ Profil enregistré');
}

// ══════════════════════════════
// CONSULTATION
// ══════════════════════════════
function lancerConsult(){
  if(SEL<0)return;
  CURRENT=Object.assign({},PROFILS[SEL],{_idx:SEL,_eph:false});
  startChat();
}

function lancerEph(){
  var pr=(document.getElementById('ePrenom').value||'').trim();
  var a=document.getElementById('eAge').value||'';
  if(!pr||!a){document.getElementById('ephErr').classList.add('on');return;}
  CURRENT={prenom:pr,nom:'',naiss:'',sx:ESX,
    poids:document.getElementById('ePoids').value||'',
    taille:'',tel:'',lien:'ephemere',_age:a,_eph:true,_idx:-1};
  startChat();
}

// ══════════════════════════════
// CHAT
// ══════════════════════════════
function startChat(){
  CID=null;msgs=[];BEST_MED=null;NOTION_MEDS=[];MEDS_LOADED=false;
  document.getElementById('msgsList').innerHTML='';
  document.getElementById('recoBox').style.display='none';
  document.getElementById('chatInp').value='';

  var p=CURRENT;
  var a=p._age||calcAge(p.naiss);
  var nom=p.prenom+(p.nom?' '+p.nom:'');
  var info=(a!==null&&a!==undefined?a+' ans':'')+
    (p.sx?' · '+(p.sx==='H'?'Masculin':'Féminin'):'')+
    (p.poids?' · '+p.poids+'kg':'')+
    (p._eph?' · Éphémère':'');

  if(!p._eph){
    document.getElementById('chatPBar').style.display='flex';
    var av=document.getElementById('chatPAv');
    av.textContent=p.prenom.charAt(0).toUpperCase();
    av.className='cp-av '+(p._idx>=0?AVC[p._idx%8]:'av0');
    document.getElementById('chatPNom').textContent=nom;
    document.getElementById('chatPInfo').textContent=info;
  } else {
    document.getElementById('chatPBar').style.display='none';
  }
  document.getElementById('chatSub').textContent=nom+(a?' — '+a+' ans':'');

  var w='Bonjour '+p.prenom+' ! 👋\n\n';
  w+='Je suis Dokita, votre assistant médical IA.\n\n';
  w+='Pour un diagnostic précis, **décrivez-moi un maximum de symptômes dès maintenant** :\n\n';
  w+='• Depuis combien de temps ?\n• Où exactement ? (localisation)\n• Intensité (1 à 10) ?\n• Ce qui aggrave ou soulage ?\n• Autres symptômes associés ?\n\n';
  if(a&&a<15)w+='_Je prends en compte que '+p.prenom+' est un enfant de '+a+' ans._';
  addMsg('ai',w);
  nav('chatScreen');
}

function addMsg(role,text){
  var t=new Date();
  var ti=t.getHours().toString().padStart(2,'0')+':'+t.getMinutes().toString().padStart(2,'0');
  msgs.push({role:role,text:text,time:ti});
  var d=document.createElement('div');
  d.className='msg '+role;
  d.innerHTML='<div class="msg-b">'+
    text.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/_(.+?)_/g,'<em>$1</em>').replace(/\n/g,'<br>')+
  '</div><div class="msg-t">'+ti+'</div>';
  document.getElementById('msgsList').appendChild(d);
  document.getElementById('msgsList').scrollTop=999999;
}

function showTyping(){
  var d=document.createElement('div');d.className='msg ai';d.id='typ';
  d.innerHTML='<div class="typing-d"><span></span><span></span><span></span></div>';
  document.getElementById('msgsList').appendChild(d);
  document.getElementById('msgsList').scrollTop=999999;
}
function hideTyping(){var t=document.getElementById('typ');if(t)t.remove();}
function autoH(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,90)+'px';}
function onKey(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}}

async function sendMsg(){
  var inp=document.getElementById('chatInp');
  var txt=(inp.value||'').trim();if(!txt)return;
  inp.value='';inp.style.height='auto';
  addMsg('user',txt);showTyping();
  var p=CURRENT;
  var a=p._age||calcAge(p.naiss);
  var ctx='[PATIENT: '+p.prenom+(p.nom?' '+p.nom:'')+
    (a?', '+a+' ans':'')+
    (p.sx?', '+(p.sx==='H'?'Homme':'Femme'):'')+
    (p.poids?', '+p.poids+'kg':'')+'] ';
  var isFirst=msgs.filter(function(m){return m.role==='user';}).length===1;
  var fullTxt=isFirst?ctx+txt:txt;
  try{
    var ah=RP+':'+KEY;
    var b={message:{role:'user',content:fullTxt},agent_id:RA};
    if(CID)b.conversation_id=CID;
    var r=await fetch(TURL,{method:'POST',headers:{'Content-Type':'application/json','Authorization':ah},body:JSON.stringify(b)});
    var d=await r.json();
    if(d.conversation_id)CID=d.conversation_id;
    var sid=d.job_info&&d.job_info.studio_id,jid=d.job_info&&d.job_info.job_id;
    if(sid&&jid){var rep=await poll(sid,jid,ah);hideTyping();if(rep){addMsg('ai',rep);checkDiag(rep);}}
    else{hideTyping();addMsg('ai','Une erreur est survenue.');}
  }catch(e){hideTyping();addMsg('ai','Erreur: '+e.message);}
}

async function poll(sid,jid,ah){
  var u='https://api-'+RG+'.stack.tryrelevance.com/latest/studios/'+sid+'/async_poll/'+jid;
  for(var i=0;i<30;i++){
    await new Promise(function(r){setTimeout(r,2000);});
    try{
      var r=await fetch(u,{headers:{'Authorization':ah}});
      var d=await r.json();
      for(var up of(d.updates||[])){
        if(up.type==='agent-complete'){
          if(up.output&&up.output.answer)return up.output.answer;
          if(up.message&&up.message.content)return up.message.content;
        }
      }
      if(d.status==='complete'||d.status==='failed')break;
    }catch(e){}
  }
  return null;
}

var DKEYS=['diagnostic','recommande','traitement','consultez','paludisme','fievre','infection','medicament','maladie','suspicion','bilan','pathologie','urgence','typhoide','tuberculose','trypanosomiase'];
function checkDiag(txt){
  if(DKEYS.some(function(k){return txt.toLowerCase().indexOf(k)>=0;}))loadMeds();
}

async function loadMeds(){
  if(MEDS_LOADED&&NOTION_MEDS.length){renderMeds(NOTION_MEDS);return;}
  try{
    var ah=RP+':'+KEY;
    var b={message:{role:'user',content:'Liste tous les médecins dans la base Notion. Réponds UNIQUEMENT avec un tableau JSON (sans markdown) avec: nom, specialite, tel, email, tarif, note, referent.'},agent_id:RA};
    var r=await fetch(TURL,{method:'POST',headers:{'Content-Type':'application/json','Authorization':ah},body:JSON.stringify(b)});
    var d=await r.json();
    var sid=d.job_info&&d.job_info.studio_id,jid=d.job_info&&d.job_info.job_id;
    if(sid&&jid){
      var rep=await poll(sid,jid,ah);
      if(rep){
        var c=rep.replace(/```json|```/g,'').trim();
        var idx=c.indexOf('[');if(idx>=0)c=c.slice(idx);
        NOTION_MEDS=JSON.parse(c);MEDS_LOADED=true;renderMeds(NOTION_MEDS);
      }
    }
  }catch(e){renderMeds([]);}
}

function renderMeds(list){
  var box=document.getElementById('recoBox');
  var sc=document.getElementById('recoScroll');
  box.style.display='block';
  if(!list||!list.length){sc.innerHTML='<div style="font-size:12px;color:var(--text3);padding:8px;">Aucun médecin trouvé</div>';return;}
  BEST_MED=list[0];
  sc.innerHTML=list.slice(0,4).map(function(m,i){
    var tel=(m.tel||'').replace(/[^+\d]/g,'');
    var em=m.email||'';
    var ns=m.nom.replace(/'/g,"\\'"),es=em.replace(/'/g,"\\'");
    return '<div class="r-card'+(i===0?' best':'')+'">'+
      (i===0?'<div style="font-size:9px;font-weight:700;color:var(--accent);margin-bottom:3px;">✓ MEILLEUR CHOIX</div>':'')+
      '<div class="r-nom">'+m.nom+'</div>'+
      '<div class="r-spec">'+m.specialite+(m.note?' · ⭐'+m.note:'')+(m.tarif?' · '+m.tarif:'')+'</div>'+
      '<div class="r-btns">'+
        (tel?'<button class="rb call" onclick="window.location.href=\'tel:'+tel+'\'">📞 Appeler</button>':'')+
        (em?'<button class="rb dos" onclick="envoyerDossier(\''+es+'\',\''+ns+'\')">📋 Dossier</button>':'')+
      '</div>'+
    '</div>';
  }).join('');
}

// ══════════════════════════════
// ENVOI DOSSIER → NOTION
// ══════════════════════════════
async function envoyerDossier(email,nomMed){
  var p=CURRENT;
  var a=p._age||calcAge(p.naiss);
  var nom=p.prenom+(p.nom?' '+p.nom:'');
  var dateISO=new Date().toISOString().split('T')[0];
  var id='DOS-'+Date.now().toString().slice(-6);
  var symptomes=msgs.filter(function(m){return m.role==='user';}).map(function(m){return m.text;}).join(' | ').slice(0,500);
  var diagIA=msgs.filter(function(m){return m.role==='ai'&&m.text.length>80;}).slice(-2).map(function(m){return m.text;}).join(' ').slice(0,800);
  var payload={id:id,patient_nom:nom,patient_age:String(a||''),
    patient_poids:String(p.poids||''),patient_ville:'Non renseignée',patient_voyage:'Aucun',
    symptomes:symptomes,diagnostic_ia:diagIA,recommandations_oms:'',examens_recommandes:'',
    statut:'en_attente',medecin:nomMed,date:dateISO};
  try{
    await fetch(MAKE_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    toast('✅ Dossier envoyé à '+nomMed);
  }catch(e){toast('⚠️ Erreur: '+e.message);}
  var ds=new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'});
  var resume=msgs.map(function(m){return '['+m.time+'] '+(m.role==='user'?'Patient':'IA')+': '+m.text;}).join('\n');
  var sub=encodeURIComponent('[Dokita] Dossier — '+nom+' — '+ds);
  var body=encodeURIComponent('Bonjour Dr. '+nomMed+',\n\nNouveau dossier patient Dokita!\n\nPatient: '+nom+'\nÂge: '+a+' ans\nSexe: '+(p.sx==='H'?'Masculin':p.sx==='F'?'Féminin':'—')+'\nPoids: '+(p.poids||'—')+'kg\n\nConsultation:\n'+resume+'\n\n---\nDokita — Outil d\'aide à la décision médicale');
  window.location.href='mailto:'+email+'?subject='+sub+'&body='+body;
}

// ══════════════════════════════
// UTILS
// ══════════════════════════════
function toast(msg){
  var t=document.createElement('div');t.className='toast';t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(function(){t.style.opacity='0';t.style.transition='opacity .3s';setTimeout(function(){t.remove();},300);},2500);
}
</script>
</body>
</html>
