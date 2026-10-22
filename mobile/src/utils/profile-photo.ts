export type ProfilePhotoAssetMetadata = {
  base64?: string | null;
  fileSize?: number | null;
  width: number;
  height: number;
};

const MAX_BASE64_LENGTH = 7_000_000;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_PIXELS = 25_000_000;

export function isValidProfilePhotoAsset(asset: ProfilePhotoAssetMetadata): boolean {
  return Boolean(asset.base64)
    && asset.base64!.length <= MAX_BASE64_LENGTH
    && (asset.fileSize ?? 0) <= MAX_FILE_SIZE
    && asset.width * asset.height <= MAX_PIXELS;
}
