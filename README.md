# 互联网访问控制 / Internet Access Control for OpenWrt

基于 [k-szuster/luci-access-control](https://github.com/k-szuster/luci-access-control) 的二次开发版本，针对移动端使用场景进行了界面优化，并添加了对 OpenWrt 25.12+ APK 包格式的完整支持。

> A fork of [k-szuster/luci-access-control](https://github.com/k-szuster/luci-access-control) with a mobile-friendly UI redesign and OpenWrt 25.12+ APK package support.

---

## 功能特性

- 管理局域网内特定设备的互联网访问权限
- 支持永久断网或按时段断网（指定每天时段 + 每周指定星期）
- 被屏蔽的设备可通过"**临时上网**"按钮获得一段时间的临时访问权限
- **界面针对手机端优化**：布局、按钮和交互更适合在手机浏览器上操作管理
- 支持 OpenWrt 25.12+ APK 包格式（同时提供旧版 IPK）

---

## 界面截图

![互联网访问控制界面](snapshot1.png)

---

## 安装方法（OpenWrt 25.12+，APK）

### 1. 添加软件源公钥

```sh
wget -P /etc/apk/keys https://securecrt.github.io/luci-access-control/keys/securecrt.pem
```

### 2. 添加软件源

```sh
echo "https://securecrt.github.io/luci-access-control/x86_64/action" >> /etc/apk/repositories
```

### 3. 安装

```sh
apk update
apk add luci-app-access-control
```

### 4. 重启服务

```sh
/etc/init.d/inetac enable
/etc/init.d/inetac start
/etc/init.d/rpcd restart
```

---

## 安装方法（旧版 OpenWrt，IPK）

前往 [Releases](https://github.com/securecrt/luci-access-control/releases) 下载对应的 `.ipk` 文件，上传到路由器后执行：

```sh
opkg install luci-app-access-control_*.ipk
/etc/init.d/inetac enable
/etc/init.d/inetac start
```

---

## 从源码编译

将 `luci-app-access-control` 文件夹放入 OpenWrt 源码的：

```
<openwrt>/feeds/luci/applications/
```

然后执行：

```sh
./scripts/feeds update luci
./scripts/feeds install -a luci
make menuconfig   # 选中 LuCI -> applications -> luci-app-access-control
make
```

---

## 版本说明

| 版本 | 说明 |
|------|------|
| v0.4.5 | 移动端 UI 优化；支持 OpenWrt 25.12 APK 签名发布 |
| v0.4.4 | 修复防火墙规则卸载逻辑 |
| v0.4.x | 新增临时上网（Ticket）功能 |

---

## 原始项目

- 原作者：[k-szuster](https://github.com/k-szuster)
- 原始仓库：https://github.com/k-szuster/luci-access-control
