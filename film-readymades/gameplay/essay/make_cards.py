from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
R=Path(__file__).parent
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def card(name,eyebrow,title,lines,footer):
 im=Image.new('RGB',(1280,720),'#10231f');d=ImageDraw.Draw(im)
 d.rectangle((54,51,1226,57),fill='#c4f46a')
 d.text((60,84),eyebrow,font=ImageFont.truetype(bold,20),fill='#c4f46a')
 d.multiline_text((56,150),title,font=ImageFont.truetype(bold,58),fill='#f4e8cc',spacing=8)
 y=340
 for line in lines:
  d.text((60,y),line,font=ImageFont.truetype(font,25),fill='#f4e8cc');y+=47
 d.text((60,648),footer,font=ImageFont.truetype(font,17),fill='#b7c3b1')
 im.save(R/name)
card('intro.png','FILM BUTTER / A PLAYABLE LANGUAGE GAME','The shopper and\nthe detective',['One list specifies what to acquire.','One notebook records what was witnessed.','Two LLM operators act inside the same native shop.'],'Based on Watson Hartsoe’s supplied working paper · 18 September 2026')
card('end.png','INTENTION / OBSERVATION / COMMITMENT','Three items. One receipt.',['Shopper: bananas, bread, carrots','Maggie: banana → bread → carrot','Receipt: carrots $0.80 · bread $2.00 · bananas $1.20','Paid: $4.00 · no notebook corrections in this run'],'Local two-tab test · phone WebRTC unverified · inventory transfer, no structural solver')
