import{createHash,timingSafeEqual}from'node:crypto';
export const maxDuration=300;
const SYSTEM_STYLE=`Create a finished, premium social media advertising image for an AI visual-content platform. The result must look art-directed and agency-produced, not like a generic template. Preserve the uploaded product's exact identity, silhouette, materials, hardware, color and proportions. Use a clean white or very pale blue editorial background, deep navy typography, vivid royal-blue emphasis, generous whitespace, rounded image panels, subtle borders and realistic soft shadows. Generate any required derivative product photography inside the composition: clean packshot, lifestyle scene, on-model placement, alternate angle or macro detail. Do not invent a different product. Typography must be crisp, correctly spelled and highly legible. Avoid logos, watermarks, fake UI, decorative clutter, neon, excessive gradients and tiny text.`;
function allowedOrigin(req){let origin=req.headers.origin||'',own=`https://${req.headers.host}`;return origin===own||origin===process.env.ALLOWED_ORIGIN?origin:''}
function authorized(req){let expected=process.env.GENERATION_ACCESS_KEY||'',cookie=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('scs_auth='))?.slice(9)||'',valid=expected?createHash('sha256').update(expected).digest('hex'):'';if(!cookie||!valid)return false;let a=Buffer.from(cookie),b=Buffer.from(valid);return a.length===b.length&&timingSafeEqual(a,b)}
function promptFor({idea,template,platform,brand}){let headline=idea?.hook||idea?.title||'One product. Every image you need.';let support=idea?.message||'Turn one upload into a complete product content kit.';return `${SYSTEM_STYLE}\n\nFORMAT: ${platform||'Instagram square'}, polished 1:1 social post.\nTEMPLATE INTENT: ${template||'Proof Split'}.\nEXACT HEADLINE: "${headline}"\nEXACT SUPPORTING COPY: "${support}"\nBRAND: ${brand?.name||'AI visual content platform'}; voice: ${brand?.voice||'confident, concise, premium'}.\n\nCOMPOSITION: Create a strong left-side message block and a dominant right-side visual system. Show the original upload in a smaller labeled card and show 3–4 premium AI-created outcomes in a structured grid or before/after composition. Use labels only when useful, such as Clean Packshot, On Model, Lifestyle Scene, or Detail Shot. Make the product the hero. Every panel must feel photographic, coherent and commercially usable. Keep all important content inside safe margins. Render the exact supplied headline and support copy without additional body text.`}
export default async function handler(req,res){
  let origin=allowedOrigin(req);if(origin)res.setHeader('Access-Control-Allow-Origin',origin);
  if(req.method==='OPTIONS'){if(!origin)return res.status(403).end();res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');return res.status(204).end()}
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!origin)return res.status(403).json({error:'Origin not allowed'});
  if(!authorized(req))return res.status(401).json({error:'Invalid generation access key'});
  if(!process.env.OPENAI_API_KEY||!process.env.GENERATION_ACCESS_KEY)return res.status(500).json({error:'Backend secrets are not configured'});
  try{
    const{image,idea,template,platform,brand}=req.body||{};
    if(!image||!image.startsWith('data:image/')||image.length>12_000_000)return res.status(400).json({error:'A valid product image under 9MB is required'});
    const response=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-image-2',images:[{image_url:image}],prompt:promptFor({idea,template,platform,brand}),n:1,size:'1024x1024',quality:'high',output_format:'jpeg',output_compression:92})});
    const body=await response.json();
    if(!response.ok)throw new Error(body?.error?.message||'Image generation failed');
    const images=(body.data||[]).map((x,i)=>({src:`data:image/jpeg;base64,${x.b64_json}`,width:1024,height:1024,style:['Product transformation','Quantified proof','Campaign story'][i]||`Direction ${i+1}`,platform:platform||'Instagram'}));
    return res.status(200).json({images});
  }catch(error){return res.status(500).json({error:error.message||'Generation failed'})}
}
