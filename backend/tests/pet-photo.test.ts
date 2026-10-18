import test from 'node:test';
import assert from 'node:assert/strict';
import { AppError } from '../src/utils/app-error';
import { petPhotoUrl } from '../src/services/pet-photo.service';

test('stored Cloudinary pet URLs remain readable without Cloudinary API credentials', async () => {
  const names = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'] as const;
  const previous = names.map(name => process.env[name]);
  for (const name of names) delete process.env[name];

  try {
    const url = 'https://res.cloudinary.com/petcare/image/upload/v123/pets/42/123e4567-e89b-42d3-a456-426614174000.webp';
    assert.equal(await petPhotoUrl('42', url), url);
    await assert.rejects(petPhotoUrl('43', url), (error: unknown) =>
      error instanceof AppError && error.code === 'PHOTO_REFERENCE_UNSUPPORTED');
  } finally {
    names.forEach((name, index) => {
      if (previous[index] === undefined) delete process.env[name];
      else process.env[name] = previous[index];
    });
  }
});
