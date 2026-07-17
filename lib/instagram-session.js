const encoder=new TextEncoder(),decoder=new TextDecoder();
const bytesToBase64=b=>Buffer.from(b).toString('base64url');
const base64ToBytes=s=>new Uint8Array(Buffer.from(s,'base64url'));
async function key(){let secret=process.env.INSTAGRAM_SESSION_SECRET;if(!secret)throw new Error('INSTAGRAM_SESSION_SECRET is missing');let digest=await crypto.subtle.digest('SHA-256',encoder.encode(secret));return crypto.subtle.importKey('raw',digest,{name:'AES-GCM'},false,['encrypt','decrypt'])}
export async function seal(value){let iv=crypto.getRandomValues(new Uint8Array(12)),cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(),encoder.encode(JSON.stringify(value)));return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(cipher))}`}
export async function unseal(value){try{let[iv,data]=(value||'').split('.');if(!iv||!data)return null;let plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:base64ToBytes(iv)},await key(),base64ToBytes(data));return JSON.parse(decoder.decode(plain))}catch{return null}}
export function cookie(request,name){return request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)||''}
export function cookieHeader(name,value,maxAge){return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`}
export function callbackUrl(request){return `${new URL(request.url).origin}/api/instagram/callback`}
