import{cookieHeader}from'../../../../lib/instagram-session.js';
export async function POST(){return new Response(null,{status:204,headers:{'Set-Cookie':cookieHeader('scs_instagram','',0)}})}
