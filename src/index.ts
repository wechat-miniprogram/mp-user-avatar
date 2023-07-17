import IAnyObject = WechatMiniprogram.IAnyObject;
import { imageUrlToBase64 } from './path-to-base64';
import { set, get } from './cache';
import { setUserInfo, getUserInfo } from './cloud';

const enum DisplayType {
  NICKNAME = 'nickname',
  AVATAR = 'avatar',
  NICKNAME_AND_AVATAR = 'both',
}

const enum Direction {
  ROW = 'row',
  COLUMN = 'column',
}

const enum DataSource {
  LOCAL_STORAGE = 'localStorage',
  CLOUD = 'cloud',
  PROPS = 'props',
}

// 当前基础库版本是否具有校验昵称能力
const canUseReviewNickname = wx.canIUse('input.bindnicknamereview');

// 可枚举的参数校验模型
const propertiesScheme = {
  display: {
    defaultValue: DisplayType.NICKNAME_AND_AVATAR,
    valid: [DisplayType.AVATAR, DisplayType.NICKNAME, DisplayType.NICKNAME_AND_AVATAR],
  },
  direction: {
    defaultValue: Direction.ROW,
    valid: [Direction.ROW, Direction.COLUMN],
  },
  dataSource: {
    defaultValue: DataSource.LOCAL_STORAGE,
    valid: [DataSource.PROPS, DataSource.LOCAL_STORAGE, DataSource.CLOUD],
  },
} as const;

Component<{
  // 用户信息
  userInfo: MpUserInfo.UserInfo,
  // 类型枚举
  displayType: Record<keyof typeof DisplayType, DisplayType>,
  // 展示方向枚举
  directionType: Record<keyof typeof Direction, Direction>,
  // 数据来源枚举
  dataSourceType: Record<keyof typeof DataSource, DataSource>,
}, IAnyObject, IAnyObject, {
  afterChangeNickname: string, // 修改后的用户昵称
}, true>({
  externalClasses: ['avatar-class', 'nickname-class'],
  properties: {
    // 组件展示类型
    display: {
      type: String,
      value: DisplayType.NICKNAME_AND_AVATAR,
    },
    // 默认昵称
    defaultNickname: {
      type: String,
      value: '微信用户',
    },
    // 默认头像
    defaultAvatar: {
      type: String,
      value: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
    },
    // 用户信息缓存key
    localStorageKey: {
      type: String,
      value: 'UserInfo',
    },
    // 当头像和昵称都展示时展示方向
    direction: {
      type: String,
      value: Direction.ROW,
    },
    // 用户信息是否可获取还是仅仅展示
    editable: {
      type: Boolean,
      value: true,
    },
    // 展示的用户信息的数据来源
    dataSource: {
      type: String,
      value: DataSource.LOCAL_STORAGE,
    },
    // 当数据来源为CLOUD时，需有用户openid做唯一标识，用于存储和读取信息
    openid: String,
    // 当数据来源为CLOUD时，需传入存储文件的fileId前缀，用于读取存储的数据
    cloudFileIdPrefix: String,
    // 昵称
    nickname: {
      type: String,
      value: '',
    },
    // 头像
    avatar: {
      type: String,
      value: '',
    },
  },
  data: {
    userInfo: {},
    displayType: {
      NICKNAME: DisplayType.NICKNAME,
      AVATAR: DisplayType.AVATAR,
      NICKNAME_AND_AVATAR: DisplayType.NICKNAME_AND_AVATAR,
    },
    directionType: {
      ROW: Direction.ROW,
      COLUMN: Direction.COLUMN,
    },
    dataSourceType: {
      LOCAL_STORAGE: DataSource.LOCAL_STORAGE,
      CLOUD: DataSource.CLOUD,
      PROPS: DataSource.PROPS,
    },
  },
  attached() {
    this.propertiesValidate();
    this.checkEssentialProps();
    this.checkUserInfo();
  },
  methods: {
    // 参数校验
    propertiesValidate() {
      // 判断枚举值传参是否在范围内
      Object.keys(propertiesScheme).forEach((item: string) => {
        const propertyValue = this.properties[item];
        const propertyScheme = propertiesScheme[item];
        const defaultValue = propertyScheme.defaultValue;
        const propertyValid = propertyScheme.valid;
        if (propertyValid) {
          if (!propertyValid.includes(propertyValue)) {
            this.setData({
              [item]: defaultValue,
            });
            console.warn(`mp-user-avatar 参数${item}不在可选值范围内 重置为默认值${defaultValue}`);
          }
        }
      });
    },

    // 校验必传的属性
    checkEssentialProps() {
      const { dataSource, openid, cloudFileIdPrefix } = this.data;
      if (dataSource === DataSource.CLOUD) {
        let errorMessage;
        if (!openid || !cloudFileIdPrefix) {
          errorMessage = 'mp-user-avatar 当dataSource为cloud时，openid和cloudFileIdPrefix必传';
        } else if (!(/^cloud:\/\/.*\/$/.test(cloudFileIdPrefix))) {
          errorMessage ='mp-user-avatar cloudFileIdPrefix格式不对，需以cloud://开头,以/结尾';
        }
        if (errorMessage) {
          console.error(errorMessage)
          this.triggerEvent('error', new Error(errorMessage));
        }
      }
    },

    // 获取之前用户保存的用户信息
    async checkUserInfo() {
      const { dataSource, openid, cloudFileIdPrefix, localStorageKey } = this.data;

      // 如果数据从props传递过来，无需读取数据
      if (dataSource === DataSource.PROPS) {
        return;
      }

      // 读取本地缓存
      const userInfo = get(localStorageKey) as MpUserInfo.UserInfo | undefined;
      if (userInfo) {
        this.setData({
          userInfo,
        });
        return;
      }

      // 当数据来源为云存储时，本地缓存中没有用户信息时，从云存储读取
      if (dataSource === DataSource.CLOUD) {
        let userInfo: MpUserInfo.UserInfo;
        try {
          userInfo = await getUserInfo(openid, cloudFileIdPrefix);
        } catch (e) {
          console.error('mp-user-avatar 从云存储读取用户信息失败', e);
          this.triggerEvent('error', new Error(`从云存储读取用户信息失败 ${(e as Error).message}`));
          return;
        }
        if (userInfo) {
          this.setData({
            userInfo,
          });
          set(localStorageKey, userInfo);
        }
      }
    },

    // 修改头像
    async onChooseAvatar(e: WechatMiniprogram.TouchEvent) {
      this.checkEssentialProps();

      const { avatarUrl } = e.detail;
      const avatarBase64 = imageUrlToBase64(avatarUrl);
      if (avatarBase64) {
        const userInfo = {
          avatar: avatarBase64,
          nickname: this.data.userInfo.nickname,
        };
        this.setData({
          'userInfo.avatar': avatarBase64,
        });
        this.saveUserInfo(userInfo);
      }
    },

    // 修改昵称
    onNicknameChanged(e: WechatMiniprogram.InputBlur) {
      const { value } = e.detail;

      // 如果具有检验昵称的能力，校验后再保存
      if (canUseReviewNickname) {
        this.afterChangeNickname = value;
        return;
      }

      this.checkEssentialProps();
      this.saveNickname(value);
    },

    // 用户昵称审核完毕后触发
    onNicknameChangedAfterReview(e: { detail: { pass: boolean }}) {
      this.checkEssentialProps();

      const { pass } = e.detail;
      if (pass) {
        this.saveNickname(this.afterChangeNickname);
      }
    },

    // 保存昵称
    saveNickname(nickname: string) {
      const userInfo = {
        avatar: this.data.userInfo.avatar,
        nickname,
      };
      this.setData({
        userInfo,
      });
      this.saveUserInfo(userInfo);
    },

    // 保存用户信息
    async saveUserInfo(userInfo: MpUserInfo.UserInfo) {
      const { dataSource, openid, localStorageKey } = this.data;
      // 触发事件
      this.triggerEvent('change', { userInfo });

      // 如果数据从props传递过来，组件内无需保存数据
      if (dataSource === DataSource.PROPS) {
        return;
      }

      // 当数据来源为云存储时，保存至云存储
      if (dataSource === DataSource.CLOUD) {
        try {
          await setUserInfo(openid, userInfo);
        } catch (e) {
          console.error('mp-user-avatar 将用户信息保存至云存储失败', e);
          this.triggerEvent('error', new Error(`将用户信息保存至云存储失败 ${(e as Error).message}`));
          return;
        }
      }

      // 保存至本地缓存
      set(localStorageKey, userInfo);
    },
  },
});
