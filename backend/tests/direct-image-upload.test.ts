import assert from 'node:assert/strict';
import { test } from 'node:test';
import { v2 as cloudinary } from 'cloudinary';
import { signDirectImageUpload } from '../src/services/direct-image-upload.service';
import type { AuthUser } from '../src/types/auth';

const previous={cloud:process.env.CLOUDINARY_CLOUD_NAME,key:process.env.CLOUDINARY_API_KEY,secret:process.env.CLOUDINARY_API_SECRET};
process.env.CLOUDINARY_CLOUD_NAME='petcare-test';
process.env.CLOUDINARY_API_KEY='test-public-key';
process.env.CLOUDINARY_API_SECRET='test-secret-key';
const admin:AuthUser={id:'42',firstName:'Admin',lastName:'Test',email:'admin@example.test',phone:null,role:'ADMIN',permissions:['store.banners.manage']};

test('emite una firma Cloudinary de WebP acotada a la carpeta y no expone el secreto',()=>{
  const result=signDirectImageUpload(admin,{kind:'banner'});
  assert.equal(result.uploadUrl,'https://api.cloudinary.com/v1_1/petcare-test/image/upload');
  assert.equal(result.params.folder,'banners');
  assert.equal(result.params.format,'webp');
  assert.equal(result.maxBytes,15*1024*1024);
  assert.equal(result.maxPixels,25_000_000);
  assert.equal('api_secret' in result,false);
  assert.equal(result.signature,cloudinary.utils.api_sign_request(result.params,process.env.CLOUDINARY_API_SECRET!));
});

test('rechaza firmar imágenes administrativas sin el permiso específico',()=>{
  assert.throws(()=>signDirectImageUpload({...admin,permissions:['products.view']},{kind:'banner'}),{status:403});
});

test.after(()=>{
  if(previous.cloud===undefined)delete process.env.CLOUDINARY_CLOUD_NAME;else process.env.CLOUDINARY_CLOUD_NAME=previous.cloud;
  if(previous.key===undefined)delete process.env.CLOUDINARY_API_KEY;else process.env.CLOUDINARY_API_KEY=previous.key;
  if(previous.secret===undefined)delete process.env.CLOUDINARY_API_SECRET;else process.env.CLOUDINARY_API_SECRET=previous.secret;
});
