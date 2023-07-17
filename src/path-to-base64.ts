// 图片路径转base64
export const imageUrlToBase64 = (url: string): string | undefined => {
  try {
    const imageBase64 = wx.getFileSystemManager().readFileSync(url, 'base64');
    return `data:image/jpeg;base64,${imageBase64}`;
  } catch (e) {
    console.error(`mp-user-avatar url转base64失败, url: ${url}`, e);
    return;
  }
};
