export const MINUTE = 60;
export const HOUR = 60;
export const DAY = MINUTE * HOUR * 24;

/**
 * 写缓存（同步）
 * @param {String} key
 * @param {*} value
 * @param {Number} [cacheTime] 缓存有效时间，单位秒，默认不设置
 */
export const set = (key: string, value: unknown, cacheTime?: number): void => {
  try {
    wx.setStorageSync(key, cacheTime ? { value, et: Date.now() + (cacheTime! * 1000) } : { value });
  } catch (e) {
    console.error(`mp-user-avatar Failed to set cache "${key}"`, (e as Error).message);
  }
};

/**
 * 读缓存（同步）
 * @param {String} key
 * @return {*}
 */
export const get = (key: string): unknown => {
  let data;
  try {
    data = wx.getStorageSync(key);
  } catch (e) {
    console.error(`mp-user-avatar Failed to get cache "${key}"`, (e as Error).message);
  }
  if (!data) {
    return null;
  }
  if (isExpires(data)) {
    removeDelay(key);
    return null;
  }
  return data.value;
};

/**
 * 延迟删除缓存
 * @param {string} key
 * @param {number} [delay=1000]
 * @return {number}
 */
export const removeDelay = (key: string, delay: number = 1000): number => setTimeout(() => {
  wx.removeStorage({
    key,
  });
}, delay);

const isExpires = (data: {et?: number}): boolean => !!(data.et && data.et < Date.now());

export default {
  set,
  get,
  removeDelay,
};
