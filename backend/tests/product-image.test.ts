import assert from 'node:assert/strict';
import test from 'node:test';
import { isProductPhotoKey,isProfilePhotoKey } from '../src/services/pet-photo.service';
import { productImage } from '../src/validators/clinic.validator';

const key = 'products/123e4567-e89b-42d3-a456-426614174000.webp';

test('accepts only stable product image keys or HTTPS legacy URLs', () => {
  assert.equal(isProductPhotoKey(key), true);
  assert.equal(productImage(key), key);
  assert.equal(productImage('https://images.example.test/item.webp'), 'https://images.example.test/item.webp');
  assert.equal(isProductPhotoKey('pets/1/123e4567-e89b-42d3-a456-426614174000.webp'), false);
});

test('rejects temporary, private or malformed image references', () => {
  assert.throws(() => productImage('file:///data/user/0/cache/photo.jpg'));
  assert.throws(() => productImage('products/invalid.webp'));
  assert.throws(() => productImage('http://images.example.test/item.webp'));
});

test('profile images use their own stable private prefix',()=>{
  assert.equal(isProfilePhotoKey('profiles/123e4567-e89b-42d3-a456-426614174000.webp'),true);
  assert.equal(isProfilePhotoKey(key),false);
});
