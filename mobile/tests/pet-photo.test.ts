import test from 'node:test';
import assert from 'node:assert/strict';
import { PET_PHOTO_MAX_BASE64_LENGTH,petPhotoResizePlan } from '../src/utils/pet-photo';

test('large gallery images are downsampled without changing their aspect ratio',()=>{
  const plan=petPhotoResizePlan(6000,4000);
  assert.deepEqual(plan.map(({width,height})=>[width,height]),[[1200,800],[960,640],[720,480],[480,320]]);
  assert.ok(plan.every(item=>item.width<=1200&&item.height<=1200));
});

test('normal images are not enlarged and invalid dimensions are rejected before decoding',()=>{
  assert.deepEqual(petPhotoResizePlan(800,600)[0],{width:800,height:600,quality:0.82});
  assert.deepEqual(petPhotoResizePlan(0,600),[]);
  assert.deepEqual(petPhotoResizePlan(Number.NaN,600),[]);
  assert.equal(PET_PHOTO_MAX_BASE64_LENGTH,5_592_408);
});
