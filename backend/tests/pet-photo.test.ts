import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { optimizePetPhoto } from '../src/services/pet-photo.service';

async function jpeg(width:number,height:number){
  return sharp({create:{width,height,channels:3,background:{r:40,g:120,b:80}}}).jpeg({quality:85}).toBuffer();
}

test('accepts and downsizes a large valid photo while keeping backend pixel bounds',async()=>{
  const source=await jpeg(4000,3000);
  const optimized=await optimizePetPhoto(source.toString('base64'));
  const metadata=await sharp(optimized).metadata();
  assert.equal(metadata.format,'webp');
  assert.ok((metadata.width??Infinity)<=1200);
  assert.ok((metadata.height??Infinity)<=1200);
});

test('accepts a normal JPEG and normalizes it to WebP',async()=>{
  const source=await jpeg(640,480);
  const optimized=await optimizePetPhoto(source.toString('base64'));
  assert.equal((await sharp(optimized).metadata()).format,'webp');
});

test('rejects unsupported formats, corrupt images, and payloads over the 5 MiB source limit',async()=>{
  const svg=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>').toString('base64');
  const corrupt=Buffer.from('not-an-image').toString('base64');
  const oversized=Buffer.alloc(5*1024*1024+1,1).toString('base64');
  await assert.rejects(optimizePetPhoto(svg));
  await assert.rejects(optimizePetPhoto(corrupt));
  await assert.rejects(optimizePetPhoto(oversized));
});
