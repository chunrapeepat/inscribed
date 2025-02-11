export const getImageDimensions = (
  base64: string
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };
  });
};
