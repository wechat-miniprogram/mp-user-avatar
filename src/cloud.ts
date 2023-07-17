const fs = wx.getFileSystemManager();

const enum ErrCodeEnum {
  EMPTY_DOWNLOAD_URL = -403003,
}

// 云存储中头像昵称文件的保存路径
const cosFilePath = 'mp-user-avatar';

export const setUserInfo = async (
  openId: string,
  userInfo: MpUserInfo.UserInfo,
): Promise<string> => new Promise((
  resolve: (fileId: string) => void,
  reject: (err: Error) => void,
) => {
  const filePath = `${wx.env.USER_DATA_PATH}/${openId}.json`;
  fs.writeFile({
    filePath,
    data: JSON.stringify(userInfo),
    encoding: 'utf8',
    fail(err: WechatMiniprogram.WriteFailCallbackResult) {
      console.error(`mp-user-avatar 将用户${openId}的数据写入本地失败`, err.errMsg);
      reject(new Error(`将用户${openId}的数据写入本地失败 ${err.errMsg}`));
    },
    success() {
      wx.cloud.uploadFile({
        cloudPath: `${cosFilePath}/${openId}`,
        filePath,
        success(res: ICloud.UploadFileResult) {
          resolve(res.fileID);
        },
        fail(err: IAPIError) {
          console.error(`mp-user-avatar 将用户${openId}的信息上传至云存储失败`, err.errMsg);
          reject(new Error(`将用户${openId}的信息上传至云存储失败 ${err.errMsg}`));
        },
      });
    },
  });
});

export const getUserInfo = (
  openId: string,
  cloudFileIdPrefix: string,
): Promise<MpUserInfo.UserInfo> => new Promise((
  resolve: (userInfo?: MpUserInfo.UserInfo) => void,
  reject: (err: Error) => void,
) => {
  wx.cloud.downloadFile({
    fileID: `${cloudFileIdPrefix}${cosFilePath}/${openId}`,
    fail(err: { errCode: number, errMsg: string }) {
      if (err.errCode === ErrCodeEnum.EMPTY_DOWNLOAD_URL) {
        console.log(`mp-user-avatar 用户${openId}信息不存在`);
        resolve();
        return;
      }
      console.error(`mp-user-avatar 从云存储读取用户${openId}信息失败`, err.errMsg);
      reject(new Error(`从云存储读取用户${openId}信息失败 ${err.errMsg}`));
    },
    success(file: ICloud.DownloadFileResult) {
      fs.readFile({
        filePath: file.tempFilePath,
        encoding: 'utf8',
        success(res: WechatMiniprogram.ReadFileSuccessCallbackResult) {
          resolve(JSON.parse(res.data as string));
        },
        fail(err: WechatMiniprogram.ReadFileFailCallbackResult) {
          console.error(`mp-user-avatar 从下载文件读取用户${openId}的信息失败`, err.errMsg);
          reject(new Error(`从下载文件读取用户${openId}的信息失败 ${err.errMsg}`));
        },
      });
    },
  });
});
