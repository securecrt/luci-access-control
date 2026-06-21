# Copyright (C) 2016 Openwrt.org
#
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI Internet Access Control
LUCI_NAME:=luci-app-access-control
PKG_VERSION:=0.4.5
PKG_RELEASE:=1

define Package/luci-app-access-control/postinst
#!/bin/sh
if [ -z "$${IPKG_INSTROOT}" ]; then
	/etc/init.d/inetac enable
	/etc/init.d/inetac start
	rm -f /tmp/luci-indexcache*
	/etc/init.d/rpcd restart

	# Restore enabled='1' for access-control rules that should be active after upgrade
	rules=$$(uci show firewall | grep "\.ac_enabled='1'" | cut -d'.' -f2)
	changed=0
	for r in $$rules; do
		susp=$$(uci get firewall."$$r".ac_suspend 2>/dev/null)
		if [ -z "$$susp" ]; then
			uci set firewall."$$r".enabled='1'
			changed=1
		fi
	done
	if [ "$$changed" -eq 1 ]; then
		uci commit firewall
		/etc/init.d/firewall restart
	fi
fi
exit 0
endef

define Package/luci-app-access-control/prerm
#!/bin/sh
if [ -z "$${IPKG_INSTROOT}" ]; then
	/etc/init.d/inetac stop
	/etc/init.d/inetac disable

	# Disable all firewall rules managed by access control to restore internet
	rules=$$(uci show firewall | grep "\.ac_enabled=" | cut -d'.' -f2)
	changed=0
	for r in $$rules; do
		uci set firewall."$$r".enabled='0'
		uci delete firewall."$$r".ac_suspend
		changed=1
	done
	if [ "$$changed" -eq 1 ]; then
		uci commit firewall
		/etc/init.d/firewall restart
	fi
fi
exit 0
endef

define Package/luci-app-access-control/postrm
#!/bin/sh
if [ -z "$${IPKG_INSTROOT}" ]; then
	rm -f /tmp/luci-indexcache*
	/etc/init.d/rpcd restart
fi
exit 0
endef

include $(TOPDIR)/feeds/luci/luci.mk
#
# call BuildPackage - OpenWrt buildroot signature
