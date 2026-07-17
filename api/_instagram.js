import{createCipheriv,createDecipheriv,createHash,randomBytes}from'node:crypto';
function key(){let value=process.env.INSTAGRAM_SESSION_SECRET;if(!value)throw new Error('INSTAGRAM_SESSION_SECRET is missing');return createHash('sha256').update(value).digest()}
export function seal(value){let iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(),iv),data=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]),tag=cipher.getAuthTag();return[iv,tag,data].map(x=>x.toString('base64url')).join('.')}
export function unseal(value){try{let[iv,tag,data]=(value||'').split('.').map(x=>Buffer.from(x,'base64url')),decipher=createDecipheriv('aes-256-gcm',key(),iv);decipher.setAuthTag(tag);return JSON.parse(Buffer.concat([decipher.update(data),decipher.final()]).toString('utf8'))}catch{return null}}
export function cookie(req,name){return(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)||''}
export function setCookie(name,value,maxAge){return`${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`}
export function callbackUrl(req){let protocol=(req.headers['x-forwarded-proto']||'https').split(',')[0],host=req.headers['x-forwarded-host']||req.headers.host;return`${protocol}://${host}/api/instagram/callback`}
export function home(req,result){let protocol=(req.headers['x-forwarded-proto']||'https').split(',')[0],host=req.headers['x-forwarded-host']||req.headers.host;return`${protocol}://${host}/?instagram=${result}`}
