import crypto from 'node:crypto';

const SECRET_CONTEXT='bhutan-center-marketing-secrets-v1';

function secretKey(){
  const material=String(process.env.MARKETING_SECRETS_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if(!material) throw new Error('Server secret encryption is not configured');
  return crypto.createHash('sha256').update(`${SECRET_CONTEXT}:${material}`).digest();
}

export function encryptSecret(value:string){
  const clean=String(value||'').trim();
  if(!clean) return '';
  const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv('aes-256-gcm',secretKey(),iv);
  const encrypted=Buffer.concat([cipher.update(clean,'utf8'),cipher.final()]);
  const tag=cipher.getAuthTag();
  return ['v1',iv.toString('base64url'),tag.toString('base64url'),encrypted.toString('base64url')].join(':');
}

export function decryptSecret(payload:string){
  const clean=String(payload||'').trim();
  if(!clean) return '';
  const [version,ivB64,tagB64,dataB64]=clean.split(':');
  if(version!=='v1' || !ivB64 || !tagB64 || !dataB64) throw new Error('Unsupported encrypted secret format');
  const decipher=crypto.createDecipheriv('aes-256-gcm',secretKey(),Buffer.from(ivB64,'base64url'));
  decipher.setAuthTag(Buffer.from(tagB64,'base64url'));
  const decrypted=Buffer.concat([decipher.update(Buffer.from(dataB64,'base64url')),decipher.final()]);
  return decrypted.toString('utf8');
}

export function maskSecret(value:string){
  const clean=String(value||'').trim();
  if(!clean) return null;
  const suffix=clean.slice(-6);
  return `••••••••••${suffix}`;
}

export async function readMarketingSecret(supabase:any,id:string){
  const {data,error}=await supabase
    .from('marketing_secret_settings')
    .select('encrypted_value,updated_at')
    .eq('id',id)
    .maybeSingle();
  if(error){
    if(String(error.code||'')==='42P01') return {value:'',updatedAt:null,storageReady:false};
    throw error;
  }
  if(!data?.encrypted_value) return {value:'',updatedAt:data?.updated_at||null,storageReady:true};
  return {value:decryptSecret(String(data.encrypted_value)),updatedAt:data.updated_at||null,storageReady:true};
}

export async function writeMarketingSecret(supabase:any,id:string,value:string,updatedBy:string){
  const clean=String(value||'').trim();
  if(!clean) throw new Error('Secret value is empty');
  const encryptedValue=encryptSecret(clean);
  const {error}=await supabase.from('marketing_secret_settings').upsert({
    id,
    encrypted_value:encryptedValue,
    updated_by:String(updatedBy||''),
    updated_at:new Date().toISOString(),
  });
  if(error) throw error;
}

export async function deleteMarketingSecret(supabase:any,id:string){
  const {error}=await supabase.from('marketing_secret_settings').delete().eq('id',id);
  if(error && String(error.code||'')!=='42P01') throw error;
}
