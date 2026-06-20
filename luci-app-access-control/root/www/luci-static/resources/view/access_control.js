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

return view.extend({
    load: function() {
        return Promise.all([
            uci.load('access_control'),
            uci.load('firewall'),
            callHostHints()
        ]);
    },

    render: function(data) {
        var host_hints = data[2] || {};
        var m, s, o;

        // Custom styling for weekday selector inside the modal
        var style = document.createElement('style');
        style.textContent = `
            .weekday-selector {
                display: flex !important;
                gap: 5px !important;
                flex-wrap: wrap !important;
                align-items: center !important;
                justify-content: flex-start !important;
                margin-top: 5px !important;
            }
            .weekday-selector input[type="checkbox"] {
                display: none !important;
            }
            .weekday-selector label {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 32px !important;
                height: 32px !important;
                border-radius: 50% !important;
                border: 1px solid rgba(0, 0, 0, 0.15) !important;
                background-color: rgba(0, 0, 0, 0.03) !important;
                color: inherit !important;
                font-size: 12px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                user-select: none !important;
                transition: all 0.2s ease !important;
                margin: 0 2px !important;
                padding: 0 !important;
            }
            .weekday-selector input[type="checkbox"]:checked + label {
                background-color: #3b82f6 !important;
                border-color: #3b82f6 !important;
                color: #ffffff !important;
                box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3) !important;
            }
            .weekday-selector label.sunday {
                color: #ef4444 !important;
                border-color: rgba(239, 68, 68, 0.3) !important;
            }
            .weekday-selector input[type="checkbox"]:checked + label.sunday {
                background-color: #ef4444 !important;
                border-color: #ef4444 !important;
                color: #ffffff !important;
                box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3) !important;
            }
            .weekday-selector label.saturday {
                color: #f97316 !important;
                border-color: rgba(249, 115, 22, 0.3) !important;
            }
            .weekday-selector input[type="checkbox"]:checked + label.saturday {
                background-color: #f97316 !important;
                border-color: #f97316 !important;
                color: #ffffff !important;
                box-shadow: 0 2px 4px rgba(249, 115, 22, 0.3) !important;
            }
            .weekday-selector label:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            /* Responsive layout for mobile (table to card layout) */
            @media (max-width: 768px) {
                .cbi-section-table, 
                .cbi-section-table tbody, 
                .cbi-section-table tr, 
                .cbi-section-table td,
                .cbi-section-table .tr,
                .cbi-section-table .td,
                .cbi-section-node,
                .cbi-section-node-tabbed {
                    display: block !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                }
                
                .cbi-section-table thead,
                .cbi-section-table tr.cbi-section-table-titles,
                .cbi-section-table .thead,
                .cbi-section-table .cbi-section-table-titles {
                    display: none !important;
                }
                
                .cbi-section-table tr.cbi-section-table-row,
                .cbi-section-table-row,
                .cbi-section-table .tr,
                .cbi-section-node .tr {
                    display: flex !important;
                    flex-direction: column !important;
                    width: 100% !important;
                    background: rgba(255, 255, 255, 0.03) !important;
                    border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    border-radius: 12px !important;
                    margin-bottom: 20px !important;
                    padding: 16px !important;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.15) !important;
                    position: relative !important;
                    box-sizing: border-box !important;
                }
                
                .cbi-section-table tr.cbi-section-table-row td.cbi-value-field,
                .cbi-section-table tr.cbi-section-table-row td.cbi-section-table-cell,
                .cbi-section-table-row .cbi-value-field,
                .cbi-section-table-row .cbi-section-table-cell,
                .cbi-section-table-row .td,
                .cbi-section-table .tr .cbi-value-field,
                .cbi-section-table .tr .cbi-section-table-cell,
                .cbi-section-table .tr .td,
                .cbi-section-node .tr .td {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: flex-start !important;
                    padding: 10px 0 !important;
                    border: none !important;
                    border-bottom: 1px dashed rgba(255, 255, 255, 0.08) !important;
                    text-align: left !important;
                    flex-wrap: wrap !important;
                    min-height: 45px !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                }
                
                .cbi-section-table tr.cbi-section-table-row td:last-child,
                .cbi-section-table-row .cbi-value-field:last-child,
                .cbi-section-table-row .cbi-section-table-cell:last-child,
                .cbi-section-table-row .td:last-child,
                .cbi-section-table .tr .cbi-value-field:last-child,
                .cbi-section-table .tr .cbi-section-table-cell:last-child,
                .cbi-section-table .tr .td:last-child,
                .cbi-section-node .tr .td:last-child {
                    border-bottom: none !important;
                    justify-content: flex-end !important;
                    padding-top: 14px !important;
                }

                .cbi-section-table tr.cbi-section-table-row td[data-label]::before,
                .cbi-section-table-row .cbi-value-field[data-label]::before,
                .cbi-section-table-row .cbi-section-table-cell[data-label]::before,
                .cbi-section-table-row .td[data-label]::before,
                .cbi-section-table .tr .cbi-value-field[data-label]::before,
                .cbi-section-table .tr .cbi-section-table-cell[data-label]::before,
                .cbi-section-table .tr .td[data-label]::before,
                .cbi-section-node .tr .td[data-label]::before {
                    content: attr(data-label) ": ";
                    font-weight: 600 !important;
                    font-size: 13px !important;
                    color: inherit !important;
                    opacity: 0.85 !important;
                    width: 100px !important;
                    min-width: 100px !important;
                    display: inline-block !important;
                    margin-right: 12px !important;
                }
                
                .cbi-section-table tr.cbi-section-table-row td[data-label=""]::before,
                .cbi-section-table tr.cbi-section-table-row td:last-child::before,
                .cbi-section-table-row .td[data-label=""]::before,
                .cbi-section-table-row .td:last-child::before,
                .cbi-section-table .tr .td[data-label=""]::before,
                .cbi-section-table .tr .td:last-child::before,
                .cbi-section-node .tr .td:last-child::before {
                    display: none !important;
                }

                .cbi-section-table tr.cbi-section-table-row td input[type="text"],
                .cbi-section-table tr.cbi-section-table-row td select,
                .cbi-section-table-row td input[type="text"],
                .cbi-section-table-row td select,
                .cbi-section-table-row .td input[type="text"],
                .cbi-section-table-row .td select,
                .cbi-section-table .tr .td input[type="text"],
                .cbi-section-table .tr .td select,
                .cbi-section-node .tr .td input[type="text"],
                .cbi-section-node .tr .td select {
                    flex: 1 !important;
                    width: auto !important;
                    min-width: 150px !important;
                }
                
                .cbi-section-table tr.cbi-section-table-row td .weekday-selector,
                .cbi-section-table-row .weekday-selector,
                .cbi-section-table .tr .weekday-selector,
                .cbi-section-node .tr .weekday-selector {
                    flex: 1 !important;
                }
            }
        `;
        document.head.appendChild(style);

        m = new form.Map('access_control', _('Internet Access Control'),
            _('Access Control allows you to manage Internet access for specific local hosts.<br/>\
               Each rule defines when a device should be blocked from having Internet access. The rules may be active permanently or during certain times of the day.<br/>\
               The rules may also be restricted to specific days of the week.<br/>\
               Any device that is blocked may obtain a ticket suspending the restriction for a specified time.'));

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
                uci.set('firewall', section_id, 'src', '*');
                uci.set('firewall', section_id, 'dest', 'wan');
                uci.set('firewall', section_id, 'target', 'REJECT');
                uci.set('firewall', section_id, 'proto', '0');
                uci.set('firewall', section_id, 'extra', '--kerneltz');
            }
            return section_id;
        };

        // Grid Section options
        o = s2.option(form.Flag, 'ac_enabled', _('Enabled'));
        o.editable = true;
        o.rmempty = false;

        o = s2.option(form.Value, 'name', _('Description'));
        o.editable = true;

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
        o.editable = true;
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
        o.editable = true;
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

        // Custom Weekday render inside modal only
        o = s2.option(form.Value, 'weekdays', _('Weekdays'));
        o.modalonly = true;
        o.render = function(section_id, option_index) {
            var val = uci.get('firewall', section_id, 'weekdays') || '';
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

            var days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
            var day_labels = {
                'mon': _('ac_Mon') === 'ac_Mon' ? 'M' : _('ac_Mon'),
                'tue': _('ac_Tue') === 'ac_Tue' ? 'T' : _('ac_Tue'),
                'wed': _('ac_Wed') === 'ac_Wed' ? 'W' : _('ac_Wed'),
                'thu': _('ac_Thu') === 'ac_Thu' ? 'T' : _('ac_Thu'),
                'fri': _('ac_Fri') === 'ac_Fri' ? 'F' : _('ac_Fri'),
                'sat': _('ac_Sat') === 'ac_Sat' ? 'S' : _('ac_Sat'),
                'sun': _('ac_Sun') === 'ac_Sun' ? 'S' : _('ac_Sun')
            };

            var self = this;
            days.forEach(function(d) {
                var checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = cbid + '_' + d;
                checkbox.value = d;

                // Check default: if no weekdays specified, it means all days
                if (val === '' || val.split(' ').indexOf(d) !== -1) {
                    checkbox.checked = true;
                }

                var label = document.createElement('label');
                label.setAttribute('for', checkbox.id);
                label.textContent = day_labels[d];
                if (d === 'sun') label.className = 'sunday';
                if (d === 'sat') label.className = 'saturday';

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
                    location.reload();
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
            container.appendChild(nodes[0]);
            container.appendChild(nodes[1]);
            
            setTimeout(mapTableLabels, 150);
            var target = container.querySelector('.cbi-map') || container;
            observer.observe(target, { childList: true, subtree: true });
            
            return container;
        });
    }
});
