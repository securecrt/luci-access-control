'use strict';
'require form';
'require uci';
'require view';
'require rpc';

var callHostHints = rpc.declare({
    object: 'luci-rpc',
    method: 'getHostHints',
    expect: { '': {} }
});

var callInitAction = rpc.declare({
    object: 'luci',
    method: 'setInitAction',
    params: [ 'name', 'action' ],
    expect: { '': true }
});

return view.extend({
    load: function() {
        return Promise.all([
            uci.load('access_control'),
            uci.load('firewall'),
            callHostHints()
        ]);
    },

    handleSaveApply: function(ev, mode) {
        return this.super('handleSaveApply', [ev, mode]).then(function() {
            return callInitAction('inetac', 'restart');
        });
    },

    render: function(data) {
        var host_hints = data[2] || {};
        var m, s, o;

        // Custom styling for weekday selector inside the modal
        var style = document.createElement('style');
        style.textContent = `
            .weekday-selector {
                display: flex !important;
                gap: 6px !important;
                flex-wrap: wrap !important;
                align-items: center !important;
                justify-content: flex-start !important;
                margin-top: 6px !important;
            }
            .weekday-selector input[type="checkbox"] {
                display: none !important;
            }
            .weekday-selector label {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 34px !important;
                height: 34px !important;
                border-radius: 50% !important;
                border: 1px solid rgba(255, 255, 255, 0.12) !important;
                background-color: rgba(255, 255, 255, 0.05) !important;
                color: #e4e4e7 !important;
                font-size: 13px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                user-select: none !important;
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
                margin: 2px !important;
                padding: 0 !important;
            }
            .weekday-selector input[type="checkbox"]:checked + label {
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
                border-color: #3b82f6 !important;
                color: #ffffff !important;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4) !important;
                transform: scale(1.05) !important;
            }
            .weekday-selector label.sunday {
                color: #f87171 !important;
                border-color: rgba(248, 113, 113, 0.2) !important;
            }
            .weekday-selector input[type="checkbox"]:checked + label.sunday {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
                border-color: #ef4444 !important;
                color: #ffffff !important;
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4) !important;
            }
            .weekday-selector label.saturday {
                color: #fb923c !important;
                border-color: rgba(251, 146, 60, 0.2) !important;
            }
            .weekday-selector input[type="checkbox"]:checked + label.saturday {
                background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
                border-color: #f97316 !important;
                color: #ffffff !important;
                box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4) !important;
            }
            .weekday-selector label:hover {
                transform: translateY(-1px) scale(1.03) !important;
                border-color: rgba(255, 255, 255, 0.25) !important;
                background-color: rgba(255, 255, 255, 0.08) !important;
            }

            /* Custom UI Styling Overrides under container */
            .access-control-container .cbi-section {
                background: rgba(30, 30, 36, 0.6) !important;
                border: 1px solid rgba(255, 255, 255, 0.06) !important;
                border-radius: 16px !important;
                padding: 24px !important;
                margin-bottom: 28px !important;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25) !important;
                backdrop-filter: blur(12px) !important;
            }
            .access-control-container h2,
            .access-control-container h3,
            .access-control-container .cbi-section-title {
                color: #3b82f6 !important;
                font-size: 1.25rem !important;
                font-weight: 700 !important;
                letter-spacing: -0.02em !important;
                margin-bottom: 20px !important;
                border-bottom: none !important;
            }
            .access-control-container .cbi-section-table {
                width: 100% !important;
                border-collapse: separate !important;
                border-spacing: 0 8px !important;
                margin-top: 12px !important;
            }
            .access-control-container .cbi-section-table-titles th {
                background: rgba(37, 37, 41, 0.8) !important;
                color: #a1a1aa !important;
                font-weight: 600 !important;
                text-transform: uppercase !important;
                font-size: 0.75rem !important;
                letter-spacing: 0.05em !important;
                padding: 14px 16px !important;
                border: none !important;
            }
            .access-control-container .cbi-section-table-titles th:first-child {
                border-radius: 10px 0 0 10px !important;
            }
            .access-control-container .cbi-section-table-titles th:last-child {
                border-radius: 0 10px 10px 0 !important;
            }
            .access-control-container .cbi-section-table-row {
                background: rgba(32, 32, 36, 0.7) !important;
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }
            .access-control-container .cbi-section-table-row:hover {
                background: rgba(39, 39, 44, 0.9) !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2) !important;
            }
            .access-control-container .cbi-section-table-row td {
                padding: 14px 16px !important;
                border: none !important;
                border-top: 1px solid rgba(255, 255, 255, 0.03) !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.03) !important;
                color: #e4e4e7 !important;
                vertical-align: middle !important;
                font-size: 13px !important;
            }
            .access-control-container .cbi-section-table-row td:first-child {
                border-left: 1px solid rgba(255, 255, 255, 0.03) !important;
                border-radius: 10px 0 0 10px !important;
            }
            .access-control-container .cbi-section-table-row td:last-child {
                border-right: 1px solid rgba(255, 255, 255, 0.03) !important;
                border-radius: 0 10px 10px 0 !important;
            }
            .access-control-container .cbi-button {
                border-radius: 8px !important;
                font-weight: 600 !important;
                font-size: 13px !important;
                padding: 8px 16px !important;
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
                border: none !important;
                cursor: pointer !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 6px !important;
            }
            .access-control-container .cbi-button-add {
                background: #2563eb !important;
                color: #ffffff !important;
            }
            .access-control-container .cbi-button-add:hover {
                background: #1d4ed8 !important;
                box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35) !important;
            }
            .access-control-container .cbi-button-remove {
                background: #dc2626 !important;
                color: #ffffff !important;
            }
            .access-control-container .cbi-button-remove:hover {
                background: #b91c1c !important;
                box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35) !important;
            }
            .access-control-container .cbi-button-reset {
                background: #4b5563 !important;
                color: #ffffff !important;
            }
            .access-control-container .cbi-button-reset:hover {
                background: #374151 !important;
            }
            .access-control-container .cbi-button-action,
            .access-control-container .cbi-button.action {
                background: #0d9488 !important;
                color: #ffffff !important;
            }
            .access-control-container .cbi-button-action:hover,
            .access-control-container .cbi-button.action:hover {
                background: #0f766e !important;
                box-shadow: 0 4px 12px rgba(13, 148, 136, 0.35) !important;
            }
            .access-control-container .cbi-value {
                padding: 18px 0 !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
                display: flex !important;
                align-items: center !important;
                flex-wrap: wrap !important;
            }
            .access-control-container .cbi-value:last-child {
                border-bottom: none !important;
            }
            .access-control-container .cbi-value-title {
                font-weight: 600 !important;
                color: #e4e4e7 !important;
                width: 180px !important;
                min-width: 180px !important;
                font-size: 14px !important;
            }
            .access-control-container .cbi-value-field {
                flex: 1 !important;
                color: #a1a1aa !important;
                font-size: 13px !important;
            }
            .access-control-container input[type="text"],
            .access-control-container select {
                background: #141416 !important;
                border: 1px solid rgba(255, 255, 255, 0.12) !important;
                color: #ffffff !important;
                border-radius: 8px !important;
                padding: 8px 12px !important;
                font-size: 14px !important;
                transition: all 0.2s ease !important;
                outline: none !important;
            }
            .access-control-container input[type="text"]:focus,
            .access-control-container select:focus {
                border-color: #3b82f6 !important;
                box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25) !important;
            }
            .access-control-container input[type="checkbox"] {
                width: 18px !important;
                height: 18px !important;
                accent-color: #3b82f6 !important;
                cursor: pointer !important;
            }

            /* Responsive layout for mobile (table to card layout) matching conceptual mockup */
            @media (max-width: 768px) {
                .access-control-container .cbi-section-table, 
                .access-control-container .cbi-section-table tbody, 
                .access-control-container .cbi-section-table tr, 
                .access-control-container .cbi-section-table td,
                .access-control-container .cbi-section-table .tr,
                .access-control-container .cbi-section-table .td,
                .access-control-container .cbi-section-node {
                    display: block !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                }
                
                .access-control-container .cbi-section-table thead,
                .access-control-container .cbi-section-table tr.cbi-section-table-titles,
                .access-control-container .cbi-section-table .thead {
                    display: none !important;
                }
                
                .access-control-container .cbi-section-table-row,
                .access-control-container .cbi-section-table .tr {
                    display: flex !important;
                    flex-direction: column !important;
                    background: rgba(30, 30, 36, 0.8) !important;
                    border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    border-radius: 16px !important;
                    margin-bottom: 24px !important;
                    padding: 20px !important;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;
                    box-sizing: border-box !important;
                }
                
                .access-control-container .cbi-section-table-row td,
                .access-control-container .cbi-section-table .tr .td {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: space-between !important;
                    padding: 12px 0 !important;
                    border: none !important;
                    border-bottom: 1px dashed rgba(255, 255, 255, 0.08) !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                    min-height: 48px !important;
                }
                
                .access-control-container .cbi-section-table-row td:last-child,
                .access-control-container .cbi-section-table .tr .td:last-child {
                    border-bottom: none !important;
                    justify-content: flex-end !important;
                    padding-top: 18px !important;
                    gap: 8px !important;
                }
                
                .access-control-container .cbi-section-table-row td[data-label]::before,
                .access-control-container .cbi-section-table .tr .td[data-label]::before {
                    content: attr(data-label) !important;
                    font-weight: 600 !important;
                    font-size: 14px !important;
                    color: #a1a1aa !important;
                }
                
                .access-control-container .cbi-section-table-row td[data-label=""]::before,
                .access-control-container .cbi-section-table-row td:last-child::before,
                .access-control-container .cbi-section-table .tr .td:last-child::before {
                    display: none !important;
                }
            }
        `;
        document.head.appendChild(style);

        m = new form.Map('access_control', _('Internet Access Control'),
            _('Access Control allows you to manage Internet access for specific local hosts.<br/> Each rule defines a device to block from having Internet access. The rules may be active permanently or during certain times of the day.<br/> The rules may also be restricted to specific days of the week.<br/> Any device that is blocked may obtain a ticket suspending the restriction for a specified time.'));

        s = m.section(form.NamedSection, 'general', 'access_control', _('General settings'));
        
        o = s.option(form.Flag, 'enabled', _('Enabled'), _('Must be set to enable the internet access blocking'));
        o.rmempty = false;

        o = s.option(form.Value, 'ticket', _('Ticket time [min]'), _('Time granted when a ticket is issued'));
        o.datatype = 'uinteger';
        o.default = '60';

        // Second Map for Firewall rules using GridSection
        var m2 = new form.Map('firewall');
        
        var s2 = m2.section(form.GridSection, 'rule', _('Client Rules'));
        s2.anonymous = true;
        s2.addremove = true;
        s2.sortable = true;
        
        s2.filter = function(section_id) {
            var val = uci.get('firewall', section_id, 'ac_enabled');
            return (val !== undefined && val !== null);
        };

        s2.add = function(name) {
            var section_id = form.GridSection.prototype.add.call(this, name);
            if (section_id) {
                uci.set('firewall', section_id, 'ac_enabled', '1');
                uci.set('firewall', section_id, 'enabled', '0');
                uci.set('firewall', section_id, 'src', 'lan');
                uci.set('firewall', section_id, 'dest', 'wan');
                uci.set('firewall', section_id, 'target', 'REJECT');
                uci.set('firewall', section_id, 'utc_time', '0');
            }
            return section_id;
        };

        // Grid Section options
        o = s2.option(form.Flag, 'ac_enabled', _('Enabled'));
        o.editable = true;
        o.rmempty = false;

        o = s2.option(form.Value, 'name', _('Description'));

        o = s2.option(form.Value, 'src_mac', _('MAC address'));
        o.datatype = 'macaddr';
        o.rmempty = false;
        o.modalonly = true; // Mac selection in modal only to keep grid compact
        
        for (var mac in host_hints) {
            var host = host_hints[mac];
            var label = mac;
            if (host.name) {
                label = mac + ' (' + host.name + ')';
            } else if (host.ipaddrs && host.ipaddrs.length > 0) {
                label = mac + ' (' + host.ipaddrs[0] + ')';
            }
            o.value(mac, label);
        }

        var validateTime = function(section_id, value) {
            if (value === '' || value === null || value === undefined) {
                return true;
            }
            var match = value.match(/^(\d?\d):(\d\d)(?::(\d\d))?$/);
            if (match) {
                var hh = parseInt(match[1], 10);
                var mm = parseInt(match[2], 10);
                var ss = match[3] ? parseInt(match[3], 10) : 0;
                if (hh <= 23 && mm <= 59 && ss <= 59) {
                    return true;
                }
            }
            return _('Time value must be HH:MM:SS or empty');
        };

        o = s2.option(form.Value, 'start_time', _('Start time'));
        o.validate = validateTime;
        o.renderWidget = function(section_id, option_index, cfgvalue) {
            var node = form.Value.prototype.renderWidget.apply(this, arguments);
            var input = (node.tagName === 'INPUT') ? node : (node.querySelector ? node.querySelector('input') : null);
            if (input) {
                input.setAttribute('type', 'time');
                input.setAttribute('step', '1');
                input.placeholder = 'HH:MM:SS';
            }
            return node;
        };

        o = s2.option(form.Value, 'stop_time', _('End time'));
        o.validate = validateTime;
        o.renderWidget = function(section_id, option_index, cfgvalue) {
            var node = form.Value.prototype.renderWidget.apply(this, arguments);
            var input = (node.tagName === 'INPUT') ? node : (node.querySelector ? node.querySelector('input') : null);
            if (input) {
                input.setAttribute('type', 'time');
                input.setAttribute('step', '1');
                input.placeholder = 'HH:MM:SS';
            }
            return node;
        };

        // Custom Weekday render: summary in grid, checkboxes in modal
        o = s2.option(form.Value, 'weekdays', _('Weekdays'));
        o.textvalue = function(section_id) {
            var val = uci.get('firewall', section_id, 'weekdays') || '';
            if (val === '') {
                return _('Every day');
            } else {
                var active_days = val.split(' ');
                var day_labels = {
                    'mon': _('ac_Mon') === 'ac_Mon' ? 'M' : _('ac_Mon'),
                    'tue': _('ac_Tue') === 'ac_Tue' ? 'T' : _('ac_Tue'),
                    'wed': _('ac_Wed') === 'ac_Wed' ? 'W' : _('ac_Wed'),
                    'thu': _('ac_Thu') === 'ac_Thu' ? 'T' : _('ac_Thu'),
                    'fri': _('ac_Fri') === 'ac_Fri' ? 'F' : _('ac_Fri'),
                    'sat': _('ac_Sat') === 'ac_Sat' ? 'S' : _('ac_Sat'),
                    'sun': _('ac_Sun') === 'ac_Sun' ? 'S' : _('ac_Sun')
                };
                var active_labels = active_days.map(function(d) {
                    return day_labels[d.toLowerCase()] || d;
                });
                return active_labels.join(' ');
            }
        };

        o.render = function(section_id) {
            var val = uci.get('firewall', section_id, 'weekdays') || '';
            var val_lower = val.toLowerCase();
            var cbid = this.cbid(section_id);

            // Container
            var container = document.createElement('div');
            container.className = 'weekday-selector';

            // Hidden input
            var input = document.createElement('input');
            input.type = 'hidden';
            input.name = cbid;
            input.id = cbid;
            input.value = val;
            container.appendChild(input);

            var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            var day_labels = {
                'Mon': _('ac_Mon') === 'ac_Mon' ? 'M' : _('ac_Mon'),
                'Tue': _('ac_Tue') === 'ac_Tue' ? 'T' : _('ac_Tue'),
                'Wed': _('ac_Wed') === 'ac_Wed' ? 'W' : _('ac_Wed'),
                'Thu': _('ac_Thu') === 'ac_Thu' ? 'T' : _('ac_Thu'),
                'Fri': _('ac_Fri') === 'ac_Fri' ? 'F' : _('ac_Fri'),
                'Sat': _('ac_Sat') === 'ac_Sat' ? 'S' : _('ac_Sat'),
                'Sun': _('ac_Sun') === 'ac_Sun' ? 'S' : _('ac_Sun')
            };

            var self = this;
            days.forEach(function(d) {
                var checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = cbid + '_' + d;
                checkbox.value = d;

                // Check default: if no weekdays specified, it means all days
                if (val === '' || val_lower.split(' ').indexOf(d.toLowerCase()) !== -1) {
                    checkbox.checked = true;
                }

                var label = document.createElement('label');
                label.setAttribute('for', checkbox.id);
                label.textContent = day_labels[d];
                if (d === 'Sun') label.className = 'sunday';
                if (d === 'Sat') label.className = 'saturday';

                checkbox.addEventListener('change', function() {
                    var selected = [];
                    var allChecked = true;
                    var noneChecked = true;
                    days.forEach(function(day) {
                        var cb = container.querySelector('#' + cbid.replace(/\./g, '\\.') + '_' + day);
                        if (cb && cb.checked) {
                            selected.push(day);
                            noneChecked = false;
                        } else {
                            allChecked = false;
                        }
                    });

                    if (allChecked || noneChecked) {
                        input.value = '';
                    } else {
                        input.value = selected.join(' ');
                    }
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                });

                container.appendChild(checkbox);
                container.appendChild(label);
            });

            var label_el = document.createElement('label');
            label_el.className = 'cbi-value-title';
            label_el.textContent = this.title;

            var val_el = document.createElement('div');
            val_el.className = 'cbi-value-field';
            val_el.appendChild(container);

            var wrapper = document.createElement('div');
            wrapper.className = 'cbi-value';
            wrapper.appendChild(label_el);
            wrapper.appendChild(val_el);

            return wrapper;
        };

        // Ticket Button inline in grid
        o = s2.option(form.Button, '_ticket', _('Ticket'));
        o.inputstyle = 'action';
        o.render = function(section_id, option_index) {
            var ac_susp = uci.get('firewall', section_id, 'ac_suspend');
            var btn = document.createElement('button');
            btn.className = 'cbi-button';

            if (ac_susp) {
                var expiry = parseInt(ac_susp, 10);
                var now = Math.floor(Date.now() / 1000);
                if (now > expiry) {
                    uci.remove('firewall', section_id, 'ac_suspend');
                    uci.set('firewall', section_id, 'enabled', uci.get('firewall', section_id, 'ac_enabled') === '1' ? '1' : '0');
                    btn.textContent = _('Issue');
                    btn.className += ' cbi-button-add';
                } else {
                    var date = new Date(expiry * 1000);
                    var hh = ('0' + date.getHours()).slice(-2);
                    var mm = ('0' + date.getMinutes()).slice(-2);
                    btn.textContent = hh + ':' + mm + ' ' + _('Cancel');
                    btn.className += ' cbi-button-remove';
                }
            } else {
                btn.textContent = _('Issue');
                btn.className += ' cbi-button-add';
            }

            var self = this;
            btn.addEventListener('click', function(ev) {
                ev.preventDefault();
                btn.disabled = true;
                var current_susp = uci.get('firewall', section_id, 'ac_suspend');
                if (current_susp) {
                    uci.remove('firewall', section_id, 'ac_suspend');
                    uci.set('firewall', section_id, 'enabled', uci.get('firewall', section_id, 'ac_enabled') === '1' ? '1' : '0');
                } else {
                    var duration = parseInt(uci.get('access_control', 'general', 'ticket'), 10) || 60;
                    var expiry = Math.floor(Date.now() / 1000) + duration * 60;
                    uci.set('firewall', section_id, 'ac_suspend', expiry.toString());
                    uci.set('firewall', section_id, 'enabled', '0');
                }
                uci.save();
                uci.commit('firewall').then(function() {
                    callInitAction('inetac', 'restart').then(function() {
                        location.reload();
                    });
                });
            });

            var wrapper = document.createElement('div');
            wrapper.className = 'cbi-value-field';
            wrapper.appendChild(btn);
            return wrapper;
        };

        // Hook save of firewall map to centralize enabled state calculations
        m2.save = function() {
            var global_enabled = uci.get('access_control', 'general', 'enabled') === '1';
            var sections = uci.sections('firewall', 'rule');
            sections.forEach(function(s) {
                var ac_enabled = uci.get('firewall', s['.name'], 'ac_enabled');
                if (ac_enabled !== undefined && ac_enabled !== null) {
                    if (uci.get('firewall', s['.name'], 'src') !== 'lan') {
                        uci.set('firewall', s['.name'], 'src', 'lan');
                    }
                    if (uci.get('firewall', s['.name'], 'dest') !== 'wan') {
                        uci.set('firewall', s['.name'], 'dest', 'wan');
                    }
                    if (uci.get('firewall', s['.name'], 'target') !== 'REJECT') {
                        uci.set('firewall', s['.name'], 'target', 'REJECT');
                    }
                    if (uci.get('firewall', s['.name'], 'extra') !== undefined) {
                        uci.remove('firewall', s['.name'], 'extra');
                    }
                    if (uci.get('firewall', s['.name'], 'proto') !== undefined) {
                        uci.remove('firewall', s['.name'], 'proto');
                    }
                    if (uci.get('firewall', s['.name'], 'utc_time') !== '0') {
                        uci.set('firewall', s['.name'], 'utc_time', '0');
                    }
                    var rule_enabled = ac_enabled === '1';
                    var enable = global_enabled && rule_enabled;
                    if (!enable) {
                        if (uci.get('firewall', s['.name'], 'ac_suspend') !== undefined) {
                            uci.remove('firewall', s['.name'], 'ac_suspend');
                        }
                    } else {
                        var ac_susp = uci.get('firewall', s['.name'], 'ac_suspend');
                        if (ac_susp) {
                            var now = Math.floor(Date.now() / 1000);
                            if (now > parseInt(ac_susp, 10)) {
                                uci.remove('firewall', s['.name'], 'ac_suspend');
                                ac_susp = null;
                            }
                        }
                        if (ac_susp) {
                            enable = false;
                        }
                    }
                    uci.set('firewall', s['.name'], 'enabled', enable ? '1' : '0');
                }
            });
            return form.Map.prototype.save.call(this);
        };

        var mapTableLabels = function() {
            var tables = document.querySelectorAll('.cbi-section-table, .table, .cbi-section-node');
            tables.forEach(function(table) {
                var headers = [];
                var ths = table.querySelectorAll('tr.cbi-section-table-titles th, .cbi-section-table-titles .th, .cbi-section-table-titles .cbi-section-table-cell, .thead .th, .thead .td, .tr.cbi-section-table-titles .th');
                ths.forEach(function(th) {
                    headers.push(th.textContent.trim());
                });
                
                var rows = table.querySelectorAll('tr.cbi-section-table-row, .cbi-section-table-row, .tr');
                rows.forEach(function(row) {
                    if (row.classList.contains('cbi-section-table-titles') || row.classList.contains('thead') || row.classList.contains('cbi-section-actions')) {
                        return;
                    }
                    var tds = row.querySelectorAll('td.cbi-value-field, td.cbi-section-table-cell, td.cbi-section-table-descr, .cbi-value-field, .cbi-section-table-cell, .td');
                    tds.forEach(function(td, index) {
                        if (headers[index]) {
                            td.setAttribute('data-label', headers[index]);
                        }
                    });
                });
            });
        };

        var observer = new MutationObserver(function(mutations) {
            var run = false;
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    run = true;
                }
            });
            if (run) {
                mapTableLabels();
            }
        });

        return Promise.all([
            m.render(),
            m2.render()
        ]).then(function(nodes) {
            var container = document.createElement('div');
            container.className = 'access-control-container';
            container.appendChild(nodes[0]);
            container.appendChild(nodes[1]);
            
            setTimeout(mapTableLabels, 150);
            var target = container.querySelector('.cbi-map') || container;
            observer.observe(target, { childList: true, subtree: true });
            
            return container;
        });
    }
});
