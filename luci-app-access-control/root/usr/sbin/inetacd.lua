#!/bin/sh

while true; do
	tnow=$(date +%s)
	
	# Get all ac_suspend values. Format of each line: cfgxxxxxx=timestamp
	suspends=$(uci show firewall | grep "\.ac_suspend=" | sed -E "s/firewall\.([^.]+)\.ac_suspend='?([0-9]+)'?/\1=\2/")
	
	has_active_tickets=0
	
	if [ -n "$suspends" ]; then
		for item in $suspends; do
			section=$(echo "$item" | cut -d'=' -f1)
			suspend_val=$(echo "$item" | cut -d'=' -f2)
			
			if [ "$tnow" -ge "$suspend_val" ]; then
				uci set firewall."$section".enabled='1'
				uci del firewall."$section".ac_suspend
			else
				has_active_tickets=1
			fi
		done
		
		if [ -n "$(uci changes firewall)" ]; then
			uci commit firewall
			/etc/init.d/firewall restart
		fi
	fi
	
	if [ "$has_active_tickets" -eq 1 ]; then
		sleep 5
	else
		sleep 30
	fi
done
