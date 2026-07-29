import{createHash,timingSafeEqual}from'node:crypto';
import{handleUpload}from'@vercel/blob/client';
function sameOrigin(req){let origin=req.headers.origin||'',own=`https://${req.headers.host}`;return origin===own||origin===process.env.ALLOWED_ORIGIN}
function equal(a,b){let x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length===y.length&&x.length>0&&timingSafeEqual(x,y)}
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(req.query?.action==='media-upload'){
    try{
      if(req.body?.type==='blob.generate-client-token'&&!sameOrigin(req))return res.status(403).json({error:'Origin not allowed'});
      let result=await handleUpload({
        body:req.body,
        request:req,
        onBeforeGenerateToken:async(pathname)=>({
          allowedContentTypes:['video/mp4','video/webm','video/quicktime','video/x-m4v'],
          maximumSizeInBytes:500_000_000,
          addRandomSuffix:true,
          tokenPayload:JSON.stringify({pathname,kind:'scheduled-video'})
        }),
        onUploadCompleted:async()=>{}
      });
      return res.status(200).json(result);
    }catch(error){
      console.error('Media upload failed',error);
      return res.status(400).json({error:error.message||'Video upload failed'});
    }
  }
  if(!sameOrigin(req))return res.status(403).json({error:'Origin not allowed'});
  let expected=process.env.GENERATION_ACCESS_KEY||'',supplied=req.body?.accessKey||'';
  if(!equal(supplied,expected))return res.status(401).json({error:'Invalid generation passphrase'});
  let token=createHash('sha256').update(expected).digest('hex');
  res.setHeader('Set-Cookie',`scs_auth=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`);
  return res.status(200).json({connected:true});
}
