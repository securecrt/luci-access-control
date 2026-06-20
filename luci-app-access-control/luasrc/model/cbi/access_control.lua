--[[
LuCI - Lua Configuration Interface - Internet access control

Copyright 2015,2016 Krzysztof Szuster.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

$Id$
]]--


local CONFIG_FILE_RULES = "firewall"  
local CONFIG_FILE_AC    = "access_control"
local Days = {'mon','tue','wed','thu','fri','sat','sun'}
local Days1 = translate('MTWTFSS')
local mr, ma, o 

local function time_elapsed (tend) 
    local now = math.floor (os.time() / 60)  --  [min]
    return now > math.floor (tonumber (tend) / 60) 
end


local ma = Map(CONFIG_FILE_AC, translate("Internet Access Control"),
    translate("Access Control allows you to manage Internet access for specific local hosts.<br/>\
       Each rule defines when a device should be blocked from having Internet access. The rules may be active permanently or during certain times of the day.<br/>\
       The rules may also be restricted to specific days of the week.<br/>\
       Any device that is blocked may obtain a ticket suspending the restriction for a specified time.") ..
    [[<style>
        .cbi-section-table th { white-space: nowrap; }
        .cbi-section-table input[name*="start_time"], .cbi-section-table input[name*="stop_time"] { width: 70px !important; text-align: center; }
        
        /* Apply natural elastic flex to the 7 days. 14% flex-basis guarantees they wrap to a new line (since the previous line is 98% full) and exactly 7 of them will fill the new row evenly! */
        td[data-name="mon"], td[data-name="tue"], td[data-name="wed"], td[data-name="thu"], td[data-name="fri"], td[data-name="sat"], td[data-name="sun"] { 
            flex: 1 1 14% !important; 
            text-align: center !important; 
            border: none !important;
            padding: 8px 0 !important;
        }
        
        /* Center the mobile labels for the 7 days without overriding their native 'display' state */
        td[data-name="mon"]::before, td[data-name="tue"]::before, td[data-name="wed"]::before, td[data-name="thu"]::before, td[data-name="fri"]::before, td[data-name="sat"]::before, td[data-name="sun"]::before { 
            text-align: center !important; 
            width: 100% !important; 
            padding-bottom: 4px;
        }

        /* Apply natural elastic flex. On PC (table), this is safely ignored. 
           On mobile, start_time and stop_time share the row. 
           We let stop_time grow to fill the row so that the 7 days are FORCED to start on a brand new row and never break in the middle! */
        td[data-name="start_time"] { 
            flex: 0 0 49% !important; 
            max-width: 49% !important; 
            border: none !important;
            box-sizing: border-box !important;
        }
        td[data-name="stop_time"] { 
            flex: 1 1 49% !important; 
            border: none !important;
            box-sizing: border-box !important;
        }

    </style>]])
if CONFIG_FILE_AC==CONFIG_FILE_RULES then
    mr = ma
else
    mr = Map(CONFIG_FILE_RULES)
end

function mr.on_after_commit (self)
    os.execute ("/etc/init.d/inetac restart >/dev/null 2>/dev/null")
end

--=============================================================================================
--  General section

local s_gen = ma:section(NamedSection, "general", "access_control", translate("General settings"))
    local o_global_enable = s_gen:option(Flag, "enabled", translate("Enabled"),
        translate ("Must be set to enable the internet access blocking"))
        o_global_enable.rmempty = false
    local o_ticket = s_gen:option(Value, "ticket", translate("Ticket time [min]"), 
	      translate("Time granted when a ticket is issued"))
        o_ticket.datatype = "uinteger"
        o_ticket.default = 60
        
--=============================================================================================
-- Rule table section

local s_rule = mr:section(TypedSection, "rule", translate("Client Rules"))
    s_rule.addremove = true
    s_rule.anonymous = true
--    s_rule.sortable  = true
    s_rule.template = "cbi/tblsection"
    -- hidden option
    s_rule.defaults.ac_suspend = nil
    -- hidden, constant options
    s_rule.defaults.enabled = "0"
    s_rule.defaults.src     = "lan"
    s_rule.defaults.dest    = "wan"
    s_rule.defaults.target  = "REJECT"
    s_rule.defaults.proto   = "all"
    
    -- only AC-related rules
    s_rule.filter = function (self, section)
	      return self.map:get (section, "ac_enabled") ~= nil
    end

-----------------------------------------------------------               
        
    o = s_rule:option(Flag, "ac_enabled", translate("Enabled"))
        o.default = '1'
        o.rmempty  = false

        -- ammend "enabled" and "ac_suspend" optiona, and set weekdays  
        function o.write(self, section, value)        
            wd_write (self, section)
            
            local key = o_global_enable:cbid (o_global_enable.section.section)
            --  "cbid.access_control.general.enabled"
            local enable = (o_global_enable.map:formvalue (key)=='1') and (value=='1')
            if not enable then  --  disabled rule => clear ticket, if any
                self.map:del(section, "ac_suspend")
            else  -- check ticket  
                local ac_susp = self.map:get(section, "ac_suspend")
                if ac_susp then  
                    if time_elapsed (ac_susp) then
                        self.map:del (section, "ac_suspend")
                        ac_susp = nil
                    end
                end
                if ac_susp then  --  ticked issued => temporarily disable rule
                    enable = false
                end
            end
            	
            self.map:set(section, "enabled", enable and '1' or '0')
--            self.map:set(section, "src",  "*")
--            self.map:set(section, "dest", "wan")
--            self.map:set(section, "target", "REJECT")
--            self.map:set(section, "proto", "0")
--            self.map:set(section, "extra", "--kerneltz")
            return Flag.write(self, section, value)
        end
      
-----------------------------------------------------------        
    s_rule:option(Value, "name", translate("Description"))
        
-----------------------------------------------------------        
     o = s_rule:option(Value, "src_mac", translate("MAC address")) 
        o.rmempty = false
        o.datatype = "macaddr"
        luci.sys.net.mac_hints(function(mac, name)
            o:value(mac, "%s (%s)" %{ mac, name })
        end)

-----------------------------------------------------------        
    function time_cfgvalue(self, section)
        local val = Value.cfgvalue(self, section)
        if val then
            local hh, mm = string.match(val, "^(%d?%d):(%d%d)")
            if hh and mm then
                return string.format("%02d:%02d", tonumber(hh), tonumber(mm))
            end
        end
        return val
    end

    function validate_time(self, value, section)
        local hh, mm
        hh,mm = string.match (value, "^(%d?%d):(%d%d)")
        hh = tonumber (hh)
        mm = tonumber (mm)
        if hh and mm and hh <= 23 and mm <= 59 then
            return string.format("%02d:%02d:00", hh, mm)
        else
            return nil, translate("Time value must be HH:MM or empty")
        end
    end
    
    o = s_rule:option(Value, "start_time", translate("Start time"))
        o.rmempty = true  -- do not validae blank
        o.validate = validate_time 
        o.cfgvalue = time_cfgvalue
        o.size = 5
    o = s_rule:option(Value, "stop_time", translate("End time"))
        o.rmempty = true  -- do not validae blank
        o.validate = validate_time
        o.cfgvalue = time_cfgvalue
        o.size = 5
        
-----------------------------------------------------------        
    function make_day (nday)
        local day = Days[nday]
        local label = Days1:sub (nday,nday)
        local o = s_rule:option(Flag, day, label)
        o.rmempty = false  --  always call write
        
        -- read from weekdays actually
        function o.cfgvalue (self, section)
            local days = self.map:get (section, "weekdays")
            if days==nil then
                return '1'
            end
            return string.find (days, day) and '1' or '0'
        end
     
        --  prevent saveing option in config file   
        function o.write(self, section, value)
            self.map:del (section, self.option)
        end
    end
  
    for i=1,7 do   
        make_day (i)
    end   
    
    function wd_write(self, section)
        local value=''
        local cnt=0
        for _,day in ipairs (Days) do
            local key = "cbid."..self.map.config.."."..section.."."..day
            if mr:formvalue(key) then
                value = value..' '..day
                cnt = cnt+1
            end
        end
        if cnt==7  then  --all days means no filtering 
            value = ''
        end
        self.map:set(section, "weekdays", value)
    end

-----------------------------------------------------------        
    o = s_rule:option(Button, "_ticket", translate("Ticket")) 
        o:depends ("ac_enabled", "1")

        function o.cfgvalue(self, section)
            local ac_susp = self.map:get(section, "ac_suspend")
            if ac_susp then
                if time_elapsed (ac_susp) then
                    self.map:del (section, "ac_suspend")
                    ac_susp = nil
                else
                    local tend = os.date ("%H:%M", ac_susp)
                    self.inputtitle = tend.."\n"
                    self.inputtitle = self.inputtitle..translate("Cancel")
                    self.inputstyle = 'remove'
                end
            end
            if not ac_susp then
                self.inputtitle = translate("Issue")
                self.inputstyle = 'add'
            end
        end
                
        function o.write(self, section, value)
            local ac_susp = self.map:get(section, "ac_suspend")
--            local key = o_ticket:cbid (o_ticket.section.section)
--            local t = o_ticket.map:formvalue (key)
            local t = o_ticket.map:get (o_ticket.section.section, o_ticket.option)  --  "general", "ticket"
            t =  tonumber (t) * 60  --  to seconds
            if ac_susp then
--                ac_susp = ac_susp + t
                ac_susp = ""
            else
                ac_susp = os.time() + t
            end
            self.map:set(section, "ac_suspend", ac_susp)
        end

--========================================================================================================

if CONFIG_FILE_AC==CONFIG_FILE_RULES then
  return ma
else
  return ma, mr
end

