/* Recadrages au pixel des affiches de campagne pour la brochure : node brochure/recadrages.js
   Règle : aucune personne coupée, aucun reste de texte d'affiche (masque = interpolation). */
// Recadrages précis (pixels source) + masquage de petits restes de texte.
const { chromium } = (()=>{try{return require('playwright')}catch(e){return require('/opt/node22/lib/node_modules/playwright')}})();const fs=require('fs');
const R='/home/user/melodia-funebre/';
const J=[
 // pianiste de dos, piano entier avec son logo ; la petite ligne dorée de l'affiche (745-792, 612-622) est recouverte
 {src:'brochure/img/chaque-vie-sa-melodie.jpg',out:'brochure/img/c-pianiste.jpg',x:206,y:560,w:735,h:780,masques:[[736,540,130,90]]},
 // femme de dos au cimetière, cercueil fleuri — tête entière, aucun texte
 {src:'assets/img/campagne/adieux-en-musique.jpg',out:'brochure/img/c-adieux.jpg',x:430,y:432,w:511,h:694,masques:[]},
 // la plaque QR et le téléphone, sans visage
 {src:'brochure/img/plaque-et-telephone.jpg',out:'brochure/img/c-plaque.jpg',x:0,y:752,w:735,h:540,masques:[]},
];
(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.setContent('<body></body>');
for(const j of J){const d='data:image/jpeg;base64,'+fs.readFileSync(R+j.src).toString('base64');
 const o=await p.evaluate(async(j)=>{const i=new Image();i.src=j.d;await i.decode();const c=document.createElement('canvas');c.width=j.w;c.height=j.h;const g=c.getContext('2d');
  g.drawImage(i,j.x,j.y,j.w,j.h,0,0,j.w,j.h);
  for(const [mx,my,mw,mh] of j.masques){const c2=document.createElement('canvas');c2.width=i.naturalWidth;c2.height=i.naturalHeight;const g2=c2.getContext('2d');g2.drawImage(i,0,0);
   const gauche=g2.getImageData(mx-3,my,1,mh).data,droite=g2.getImageData(mx+mw+2,my,1,mh).data,z=g.createImageData(mw,mh);
   for(let yy=0;yy<mh;yy++)for(let xx=0;xx<mw;xx++){const t=xx/(mw-1),k=(yy*mw+xx)*4,q=yy*4;for(let c=0;c<3;c++)z.data[k+c]=gauche[q+c]*(1-t)+droite[q+c]*t;z.data[k+3]=255;}
   g.putImageData(z,mx-j.x,my-j.y);}
  return c.toDataURL('image/jpeg',.9)},{...j,d});
 fs.writeFileSync(R+j.out,Buffer.from(o.split(',')[1],'base64'));}
await b.close();})();
