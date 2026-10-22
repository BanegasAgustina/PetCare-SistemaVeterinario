import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidProfilePhotoAsset } from '../src/utils/profile-photo';

const validAsset = { base64: 'a'.repeat(64), fileSize: 1024, width: 800, height: 800 };

test('accepts an image within the profile photo limits', () => {
  assert.equal(isValidProfilePhotoAsset(validAsset), true);
});

test('accepts an image exactly at the file and pixel limits', () => {
  assert.equal(isValidProfilePhotoAsset({ ...validAsset, fileSize: 5 * 1024 * 1024, width: 5000, height: 5000 }), true);
});

test('rejects an image without base64 data', () => {
  assert.equal(isValidProfilePhotoAsset({ ...validAsset, base64: null }), false);
});

test('rejects an image above the encoded size limit', () => {
  assert.equal(isValidProfilePhotoAsset({ ...validAsset, base64: 'a'.repeat(7_000_001) }), false);
});

test('rejects an image above the file size limit', () => {
  assert.equal(isValidProfilePhotoAsset({ ...validAsset, fileSize: 5 * 1024 * 1024 + 1 }), false);
});

test('rejects an image above the pixel limit', () => {
  assert.equal(isValidProfilePhotoAsset({ ...validAsset, width: 5001, height: 5000 }), false);
});
