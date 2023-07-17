declare namespace MpUserInfo {
  interface UserInfo {
    avatar?: string;
    nickname?: string;
  }

  interface UserInfoChangeEvent {
    detail: {
      userInfo: UserInfo,
    },
  }
}
