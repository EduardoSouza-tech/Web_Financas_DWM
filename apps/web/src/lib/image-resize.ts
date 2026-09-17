/**
 * Prepara uma foto de perfil no navegador: recorta em quadrado (centro), reduz e comprime.
 * O resultado é uma data URL pequena, pronta para guardar junto do perfil.
 */

export const AVATAR_SIZE = 256;
const MAX_INPUT_BYTES = 15 * 1024 * 1024; // fotos de celular grandes ainda passam
const MAX_OUTPUT_CHARS = 200_000; // mesmo limite da coluna no banco

export class ImageError extends Error {}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageError('Não foi possível ler esta imagem. Use JPG, PNG ou WebP.'));
    };
    img.src = url;
  });
}

export async function prepareAvatar(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new ImageError('Escolha um arquivo de imagem.');
  if (file.size > MAX_INPUT_BYTES) throw new ImageError('Imagem muito grande (máximo 15 MB).');

  const img = await loadImage(file);
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  if (!side) throw new ImageError('Imagem inválida.');

  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageError('Seu navegador não conseguiu processar a imagem.');

  ctx.imageSmoothingQuality = 'high';
  // Recorte quadrado centralizado
  ctx.drawImage(
    img,
    (img.naturalWidth - side) / 2,
    (img.naturalHeight - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE
  );

  // WebP quando o navegador suporta; senão JPEG. Reduz a qualidade se passar do limite.
  for (const quality of [0.85, 0.7, 0.55]) {
    let dataUrl = canvas.toDataURL('image/webp', quality);
    if (!dataUrl.startsWith('data:image/webp')) dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (dataUrl.length <= MAX_OUTPUT_CHARS) return dataUrl;
  }
  throw new ImageError('Não foi possível reduzir a imagem o suficiente. Tente outra foto.');
}
